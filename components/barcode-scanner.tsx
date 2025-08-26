'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, X, Keyboard } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

interface BarcodeScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (result: string) => void
}

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    if (open && isScanning) {
      startScanning()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [open, isScanning])

  const startScanning = async () => {
    try {
      setError(null)
      
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader()
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      streamRef.current = stream
      
      if (videoRef) {
        videoRef.srcObject = stream
        // Проверяем, не играет ли видео уже
        if (videoRef.paused) {
          await videoRef.play()
        }
      }

      codeReaderRef.current.decodeFromVideoDevice(
        null,
        videoRef,
        (result, error) => {
          if (result) {
            handleScanResult(result.getText())
          } else if (error && !(error instanceof NotFoundException)) {
            setError('Ошибка сканирования: ' + error.message)
          }
        }
      )
    } catch (err) {
      setError('Не удалось получить доступ к камере')
      console.error('Camera error:', err)
    }
  }

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef) {
      videoRef.srcObject = null
    }
    
    setIsScanning(false)
  }

  const handleScanResult = (result: string) => {
    if (result) {
      onScan(result)
      toast({
        title: 'Штрихкод найден',
        description: `Результат: ${result}`,
      })
    }
  }

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      setManualInput('')
      onOpenChange(false)
      toast({
        title: 'SKU введен вручную',
        description: `Результат: ${manualInput.trim()}`,
      })
    }
  }

  const toggleScanning = () => {
    setIsScanning(!isScanning)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Сканер штрихкодов
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
            <video
              ref={setVideoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <Camera className="h-12 w-12 mx-auto mb-2" />
                  <p>Нажмите "Начать сканирование"</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/80">
                <p className="text-white text-center p-4">{error}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={toggleScanning}
              variant={isScanning ? "destructive" : "default"}
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Остановить
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Начать сканирование
                </>
              )}
            </Button>
          </div>

          <div className="border-t pt-4">
            <Label htmlFor="manual-sku">Или введите вручную</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="manual-sku"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                placeholder="Например: ABC123"
                maxLength={50}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit()
                  }
                }}
              />
              <Button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim()}
                variant="outline"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Поддерживается формат Code 39</p>
            <p>Убедитесь, что штрихкод хорошо освещен и находится в кадре</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}