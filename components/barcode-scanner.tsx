'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Scan, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BrowserMultiFormatReader } from '@zxing/library'

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
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const { toast } = useToast()

  const startScanning = async () => {
    try {
      setError(null)
      setDetectedBarcode(null)
      
      console.log('Starting camera access...')
      
      // Инициализируем zxing reader
      codeReaderRef.current = new BrowserMultiFormatReader()
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      console.log('Camera stream obtained:', stream)
      streamRef.current = stream
      setIsScanning(true)
      
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
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
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

  // Симуляция сканирования для тестирования
  const simulateBarcodeDetection = () => {
    const testBarcodes = ['123456789', '987654321', '555555555']
    const randomBarcode = testBarcodes[Math.floor(Math.random() * testBarcodes.length)]
    handleBarcodeDetected(randomBarcode)
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
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
      }
    }
  }, [])

  // Эффект для обработки установки потока после монтирования
  useEffect(() => {
    console.log('useEffect triggered, isScanning:', isScanning)
    console.log('videoRef.current:', videoRef.current)
    console.log('streamRef.current:', streamRef.current)
    
    if (isScanning && streamRef.current && videoRef.current) {
      console.log('Setting stream in useEffect:', videoRef.current)
      videoRef.current.srcObject = streamRef.current
      videoRef.current.style.display = 'block'
      videoRef.current.style.width = '100%'
      videoRef.current.style.height = '100%'
      
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded in useEffect')
        console.log('Video readyState:', videoRef.current?.readyState)
        console.log('Video videoWidth:', videoRef.current?.videoWidth)
        console.log('Video videoHeight:', videoRef.current?.videoHeight)
        videoRef.current?.play().then(() => {
          console.log('Video playing successfully in useEffect')
          // Запускаем сканирование после того, как видео готово
          startBarcodeScanning()
        }).catch(err => {
          console.error('Error playing video in useEffect:', err)
          // Все равно показываем видео и запускаем сканирование, даже если play не сработал
          startBarcodeScanning()
        })
      }
      
      // Fallback для случаев, когда onloadedmetadata не срабатывает
      setTimeout(() => {
        console.log('Fallback check - video readyState:', videoRef.current?.readyState)
        if (videoRef.current && videoRef.current.readyState === 0) {
          console.log('Using fallback for video ready')
          videoRef.current.play().catch(err => {
            console.error('Fallback play failed:', err)
          }).then(() => {
            startBarcodeScanning()
          })
        } else {
          startBarcodeScanning()
        }
      }, 1000)
    } else {
      console.log('Cannot set stream - missing conditions:', {
        isScanning,
        hasStream: !!streamRef.current,
        hasVideo: !!videoRef.current
      })
    }
  }, [isScanning])

  // Функция для запуска сканирования штрихкодов
  const startBarcodeScanning = () => {
    if (codeReaderRef.current && videoRef.current) {
      console.log('Starting barcode scanning...')
      try {
        codeReaderRef.current.decodeFromVideoDevice(
          null, // Используем первую доступную камеру
          videoRef.current,
          (result, error) => {
            if (result) {
              console.log('Barcode detected:', result.getText())
              handleBarcodeDetected(result.getText())
            } else if (error) {
              console.log('No barcode detected yet:', error.message)
              // Продолжаем сканирование
            }
          }
        )
      } catch (err) {
        console.error('Error starting barcode scanning:', err)
        setError('Ошибка при запуске сканирования штрихкодов')
      }
    }
  }

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
              style={{ display: 'block', transform: 'scaleX(-1)' }}
              onLoadedMetadata={() => {
                console.log('Video element in DOM loaded metadata')
              }}
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

        {/* Кнопка для тестирования симуляции сканирования */}
        <Button
          onClick={simulateBarcodeDetection}
          variant="outline"
          className="w-full"
          disabled={!isScanning}
        >
          🧪 Симулировать сканирование
        </Button>

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