'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, ScanBarcode, Zap, ArrowRight } from 'lucide-react'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { FileUploader } from '@/components/file-uploader'
import { ProcessingQueue } from '@/components/processing-queue'
import { useToast } from '@/hooks/use-toast'

interface ProcessingItem {
  id: string
  originalName: string
  serverName: string
  status: 'queued' | 'processing' | 'done' | 'failed'
  progress?: number
  width?: number
  height?: number
  bytes?: number
  previewUrl?: string
  error?: string
}

type Step = 'sku' | 'files' | 'process'

export default function HomePage() {
  const [step, setStep] = useState<Step>('sku')
  const [sku, setSku] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingItems, setProcessingItems] = useState<ProcessingItem[]>([])
  const [publicLinks, setPublicLinks] = useState<string[]>([])
  const { toast } = useToast()

  const handleSkuChange = (value: string) => {
    setSku(value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))
  }

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles)
  }

  const handleFileRemove = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleNextStep = () => {
    if (!sku.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите SKU',
        variant: 'destructive',
      })
      return
    }
    setStep('files')
  }

  const handleProcess = async () => {
    if (files.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите файлы для обработки',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    setProcessingItems([])
    
    try {
      const formData = new FormData()
      formData.append('sku', sku)
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Ошибка обработки')
      }

      const result = await response.json()
      
      const newItems: ProcessingItem[] = result.items.map((item: any, index: number) => ({
        id: item.bufferId || `${sku}-${index}`,
        originalName: item.originalName,
        serverName: item.serverName,
        status: item.previewUrl ? 'done' as const : 'queued' as const,
        width: item.width,
        height: item.height,
        bytes: item.bytes,
        previewUrl: item.previewUrl
      }))
      
      setProcessingItems(newItems)
      setStep('process')
      toast({
        title: 'Успешно',
        description: `Добавлено в очередь обработки: ${newItems.length} файлов`,
      })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обработать файлы',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadZIP = async () => {
    const doneItems = processingItems.filter(item => item.status === 'done')
    if (doneItems.length === 0) return

    try {
      const response = await fetch('/api/zip-and-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku,
          items: doneItems.map(item => ({
            serverName: item.serverName,
            bufferId: item.id,
            previewUrl: item.previewUrl
          })),
          links: publicLinks
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка создания ZIP')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sku}_${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Успешно',
        description: 'ZIP архив готов к скачиванию',
      })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать ZIP архив',
        variant: 'destructive',
      })
    }
  }

  const handleSendToTelegram = async () => {
    const doneItems = processingItems.filter(item => item.status === 'done')
    if (doneItems.length === 0) return

    try {
      const response = await fetch('/api/zip-and-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku,
          items: doneItems.map(item => ({
            serverName: item.serverName,
            bufferId: item.id,
            previewUrl: item.previewUrl
          })),
          links: publicLinks
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка отправки в Telegram')
      }

      toast({
        title: 'Успешно',
        description: 'Файлы отправлены в Telegram',
      })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить файлы в Telegram',
        variant: 'destructive',
      })
    }
  }

  const handleBackToSku = () => {
    setStep('sku')
  }

  const handleBackToFiles = () => {
    setStep('files')
  }

  const handleStartOver = () => {
    setStep('sku')
    setSku('')
    setFiles([])
    setProcessingItems([])
    setPublicLinks([])
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">PhotoHub</h1>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-6 sm:mb-8">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className={`flex items-center ${step === 'sku' ? 'text-blue-600' : step === 'files' || step === 'process' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'sku' ? 'bg-blue-600 text-white' : step === 'files' || step === 'process' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <span className="ml-2 font-medium">SKU</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center ${step === 'files' ? 'text-blue-600' : step === 'process' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'files' ? 'bg-blue-600 text-white' : step === 'process' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Файлы</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center ${step === 'process' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'process' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              3
            </div>
            <span className="ml-2 font-medium">Обработка</span>
          </div>
        </div>
      </div>

      {/* Step 1: SKU Input */}
      {step === 'sku' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ScanBarcode className="h-5 w-5 sm:h-6" />
              Шаг 1: Введите SKU
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Введите артикул товара или отсканируйте штрихкод
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm sm:text-base">SKU</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => handleSkuChange(e.target.value)}
                placeholder="Например: ABC123"
                maxLength={50}
                className="text-center text-base sm:text-lg px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowScanner(true)}
                className="flex-1 text-sm sm:text-base px-4 py-2"
              >
                <ScanBarcode className="h-4 w-4 mr-2" />
                Сканер штрихкодов
              </Button>
            </div>
            <Button
              onClick={handleNextStep}
              disabled={!sku.trim()}
              className="w-full text-sm sm:text-base px-6 py-3"
            >
              Далее →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: File Upload */}
      {step === 'files' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Upload className="h-5 w-5 sm:h-6" />
              Шаг 2: Загрузка файлов
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Выберите файлы для обработки (SKU: {sku})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center">
              <FileUploader
                onFilesSelected={handleFilesSelected}
                onFileRemove={handleFileRemove}
                maxFiles={parseInt(process.env.NEXT_PUBLIC_MAX_UPLOADS || '30')}
                maxSize={parseInt(process.env.NEXT_PUBLIC_MAX_FILE_MB || '30') * 1024 * 1024}
              />
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                Максимум {process.env.NEXT_PUBLIC_MAX_UPLOADS || '30'} файлов, до {process.env.NEXT_PUBLIC_MAX_FILE_MB || '30'}MB каждый
              </p>
            </div>

            {files.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-sm sm:text-base">Выбранные файлы ({files.length})</h4>
                <div className="max-h-32 sm:max-h-40 overflow-y-auto space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded">
                      <span className="text-xs sm:text-sm truncate">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileRemove(index)}
                        className="h-6 w-6 p-0 text-xs"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBackToSku}
                className="flex-1 text-sm sm:text-base px-4 py-2"
              >
                ← Назад
              </Button>
              <Button
                onClick={() => setStep('process')}
                disabled={files.length === 0}
                className="flex-1 text-sm sm:text-base px-4 py-2"
              >
                Проверить файлы →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Processing */}
      {step === 'process' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Zap className="h-5 w-5 sm:h-6" />
              Шаг 3: Предварительный просмотр
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Проверьте выбранные файлы перед отправкой на webhook для SKU: {sku}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-base sm:text-lg mb-4">Готовы к отправке на webhook?</p>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4">
                <p className="font-medium text-sm sm:text-base">SKU: {sku}</p>
                <p className="text-sm sm:text-base">Файлов: {files.length}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleBackToFiles}
                className="flex-1 text-sm sm:text-base px-4 py-2"
              >
                ← Назад
              </Button>
              <Button
                onClick={handleProcess}
                disabled={isProcessing}
                className="flex-1 text-sm sm:text-base px-4 py-2"
              >
                <Zap className="h-4 w-4 mr-2" />
                {isProcessing ? 'Обработка...' : 'Отправить'}
              </Button>
              <Button
                variant="outline"
                onClick={handleStartOver}
                className="flex-1 text-sm sm:text-base px-4 py-2"
              >
                🔄 Начать заново
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ProcessingQueue
        items={processingItems}
        onDownloadZIP={handleDownloadZIP}
        onSendToTelegram={handleSendToTelegram}
        links={publicLinks}
      />

      <BarcodeScanner
        open={showScanner}
        onOpenChange={setShowScanner}
        onScan={(result) => {
          handleSkuChange(result)
          setShowScanner(false)
          if (result.trim()) {
            handleNextStep()
          }
        }}
      />
    </div>
  )
}