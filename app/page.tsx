'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, ArrowRight, Scan, Loader2 } from 'lucide-react'
import { FileUploader } from '@/components/file-uploader'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { useToast } from '@/hooks/use-toast'

interface ProcessingItem {
  id: string
  originalName: string
  serverName: string
  status: 'queued' | 'processing' | 'done' | 'failed'
  previewUrl?: string
  error?: string
}

type Step = 'sku' | 'files' | 'scanner' | 'logs'

export default function HomePage() {
  const [step, setStep] = useState<Step>('sku')
  const [sku, setSku] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingItems, setProcessingItems] = useState<ProcessingItem[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [webhookLogs, setWebhookLogs] = useState<any[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const { toast } = useToast()

  const handleSkuChange = (value: string) => {
    setSku(value.replace(/[^0-9]/g, ''))
  }

  const handleBarcodeDetected = (barcode: string) => {
    setSku(barcode.replace(/[^0-9]/g, ''))
    setShowScanner(false)
    toast({
      title: 'Штрихкод обнаружен',
      description: `Найден штрихкод: ${barcode}`,
    })
  }

  const handlePhotoTaken = (photo: File) => {
    // Добавляем фото в список файлов
    setFiles(prev => [...prev, photo])
    setShowScanner(false)
    toast({
      title: 'Фото добавлено',
      description: `Фото "${photo.name}" добавлено для обработки`,
    })
  }

  const handleOpenScanner = () => {
    setShowScanner(true)
  }

  const handleCloseScanner = () => {
    setShowScanner(false)
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
        description: 'Введите 6 цифр',
        variant: 'destructive',
      })
      return
    }
    if (sku.length !== 6) {
      toast({
        title: 'Ошибка',
        description: 'SKU должен содержать ровно 6 цифр',
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
        id: `${sku}-${index}`,
        originalName: item.originalName,
        serverName: item.serverName,
        status: item.previewUrl ? 'done' as const : 'queued' as const,
        previewUrl: item.previewUrl
      }))
      
      setProcessingItems([]) // Очищаем результаты обработки
      setStep('sku') // Возвращаемся на начальную страницу
      setSku('')
      setFiles([])
      toast({
        title: 'Успешно',
        description: `Файлы отправлены на обработку: ${newItems.length} файлов`,
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

  const handleBackToSku = () => {
    setStep('sku')
  }


  const handleStartOver = () => {
    setStep('sku')
    setSku('')
    setFiles([])
    setProcessingItems([])
  }

  const loadWebhookLogs = async () => {
    setIsLoadingLogs(true)
    try {
      const response = await fetch('/api/webhook-logs')
      if (response.ok) {
        const data = await response.json()
        setWebhookLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to load webhook logs:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить логи webhook',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingLogs(false)
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">PhotoHub</h1>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-6 sm:mb-8">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className={`flex items-center ${step === 'sku' ? 'text-blue-600' : step === 'files' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'sku' ? 'bg-blue-600 text-white' : step === 'files' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <span className="ml-2 font-medium">6 цифр</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center ${step === 'files' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'files' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Файлы</span>
          </div>
        </div>
      </div>

      {/* Step 1: SKU Input */}
      {step === 'sku' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              Шаг 1: Введите SKU
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Введите ровно 6 цифр
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm sm:text-base">6 цифр</Label>
              <div className="flex gap-2">
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => handleSkuChange(e.target.value)}
                  placeholder="123456 - введите ровно 6 цифр"
                  maxLength={6}
                  className="flex-1 text-center text-base sm:text-lg px-3 py-2"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenScanner}
                  className="px-3 py-2"
                  title="Сканировать штрихкод"
                >
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
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
                onClick={handleProcess}
                disabled={files.length === 0 || isProcessing}
                className="flex-1 text-sm sm:text-base px-4 py-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Отправить →'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <BarcodeScanner
              onBarcodeDetected={handleBarcodeDetected}
              onPhotoTaken={handlePhotoTaken}
              onClose={handleCloseScanner}
            />
          </div>
        </div>
      )}
    </div>
  )
}