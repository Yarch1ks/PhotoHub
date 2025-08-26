'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Scan, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void
  onClose?: () => void
}

export function BarcodeScanner({ onBarcodeDetected, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()

  const startScanning = async () => {
    try {
      setError(null)
      setDetectedBarcode(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Не удалось доступиться к камере. Пожалуйста, убедитесь, что вы предоставили разрешение.')
      toast({
        title: 'Ошибка доступа к камере',
        description: 'Не удалось доступиться к камере. Пожалуйста, убедитесь, что вы предоставили разрешение.',
        variant: 'destructive',
      })
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
    setDetectedBarcode(null)
  }

  const handleBarcodeDetected = (barcode: string) => {
    setDetectedBarcode(barcode)
    onBarcodeDetected(barcode)
    stopScanning()
    
    toast({
      title: 'Штрихкод обнаружен',
      description: `Найден штрихкод: ${barcode}`,
    })
  }

  const handleUseDetectedBarcode = () => {
    if (detectedBarcode) {
      onBarcodeDetected(detectedBarcode)
      onClose?.()
    }
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Сканер штрихкодов
        </CardTitle>
        <CardDescription>
          Наведите камеру на штрихкод для сканирования
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {isScanning ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <Camera className="h-12 w-12" />
            </div>
          )}
          
          {detectedBarcode && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-4 rounded-lg text-center">
                <p className="font-mono text-lg font-semibold">{detectedBarcode}</p>
                <p className="text-sm text-gray-600 mt-1">Штрихкод обнаружен</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <div className="flex gap-2">
          {!isScanning ? (
            <Button 
              onClick={startScanning} 
              className="flex-1"
              disabled={!!error}
            >
              <Camera className="h-4 w-4 mr-2" />
              Начать сканирование
            </Button>
          ) : (
            <Button 
              onClick={stopScanning} 
              variant="outline"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Остановить
            </Button>
          )}

          {detectedBarcode && (
            <Button 
              onClick={handleUseDetectedBarcode}
              className="flex-1"
            >
              Использовать
            </Button>
          )}
        </div>

        {onClose && (
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full"
          >
            Закрыть
          </Button>
        )}
      </CardContent>
    </Card>
  )
}