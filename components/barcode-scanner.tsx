'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Scan, X, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void
  onClose?: () => void
}

export function BarcodeScanner({ onBarcodeDetected, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanningRef = useRef<boolean>(false)
  const { toast } = useToast()

  // Инициализация кода ридера один раз
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader()
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
      }
    }
  }, [])

  const startScanning = async () => {
    if (scanningRef.current) return
    
    try {
      setError(null)
      setDetectedBarcode(null)
      setIsProcessing(true)
      scanningRef.current = true
      
      console.log('Starting camera access...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })
      
      console.log('Camera stream obtained:', stream)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().then(() => {
          console.log('Video playing successfully')
          setIsScanning(true)
          setIsProcessing(false)
          startBarcodeDetection()
        }).catch(err => {
          console.error('Video play error:', err)
          setError('Ошибка воспроизведения видео')
          setIsProcessing(false)
          scanningRef.current = false
        })
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Не удалось доступиться к камере. Пожалуйста, убедитесь, что вы предоставили разрешение.')
      toast({
        title: 'Ошибка доступа к камере',
        description: 'Не удалось доступиться к камере. Пожалуйста, убедитесь, что вы предоставили разрешение.',
        variant: 'destructive',
      })
      setIsProcessing(false)
      scanningRef.current = false
    }
  }

  const startBarcodeDetection = () => {
    if (!scanningRef.current || !codeReaderRef.current || !videoRef.current) {
      return
    }

    const detectBarcode = () => {
      if (!scanningRef.current || !codeReaderRef.current || !videoRef.current) {
        return
      }

      try {
        codeReaderRef.current.decodeFromVideoDevice(
          null, // default device
          videoRef.current,
          (result, error) => {
            if (result) {
              console.log('Barcode detected:', result.getText())
              setDetectedBarcode(result.getText())
              scanningRef.current = false
              if (codeReaderRef.current) {
                codeReaderRef.current.reset()
              }
              stopScanning()
              onBarcodeDetected(result.getText())
            } else if (error && !(error instanceof NotFoundException)) {
              console.error('Barcode detection error:', error)
            }
          }
        )
      } catch (err) {
        console.error('Detection error:', err)
      }
    }

    // Даем время на инициализацию видео перед началом детекции
    setTimeout(detectBarcode, 1000)
  }

  const stopScanning = () => {
    scanningRef.current = false
    
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsScanning(false)
    setDetectedBarcode(null)
  }

  const handleUseDetectedBarcode = () => {
    if (detectedBarcode) {
      onBarcodeDetected(detectedBarcode)
      stopScanning()
    }
  }

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Сканер штрихкодов
        </CardTitle>
        <CardDescription>
          Наведите камеру на штрихкод для сканирования
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scaleX(-1)"
            style={{ display: isScanning ? 'block' : 'none' }}
          />
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Камера неактивна</p>
              </div>
            </div>
          )}
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!isScanning ? (
            <Button 
              onClick={startScanning}
              className="flex-1"
              disabled={isProcessing || isScanning}
            >
              <Camera className="w-4 h-4 mr-2" />
              {isProcessing ? 'Инициализация...' : 'Начать сканирование'}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={stopScanning}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Остановить
            </Button>
          )}

          {detectedBarcode && (
            <Button 
              onClick={handleUseDetectedBarcode}
              className="flex-1"
            >
              <Scan className="w-4 h-4 mr-2" />
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