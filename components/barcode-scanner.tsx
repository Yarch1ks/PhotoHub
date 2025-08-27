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
  const isScanningRef = useRef(false)
  const { toast } = useToast()

  const startScanning = async () => {
    if (isScanningRef.current) return
    
    try {
      setError(null)
      setDetectedBarcode(null)
      isScanningRef.current = true
      
      console.log('Starting camera access...')
      
      // Инициализируем zxing reader
      codeReaderRef.current = new BrowserMultiFormatReader()
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      console.log('Camera stream obtained:', stream)
      streamRef.current = stream
      
      // Даем время для инициализации видео перед отображением
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setIsScanning(true)
        }
      }
      
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Не удалось доступиться к камере. Пожалуйста, убедитесь, что вы предоставили разрешение.')
      toast({
        title: 'Ошибка доступа к камере',
        description: 'Не удалось доступиться к камере. Пожалуйста, убедитесь, что вы предоставили разрешение.',
        variant: 'destructive',
      })
      isScanningRef.current = false
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
    isScanningRef.current = false
    setIsScanning(false)
    setDetectedBarcode(null)
  }

  const handleBarcodeDetected = (barcode: string) => {
    setDetectedBarcode(barcode)
    onBarcodeDetected(barcode)
    
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
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
      }
    }
  }, [])

  // Эффект для обработки установки потока после монтирования
  useEffect(() => {
    let isMounted = true
    let scanningTimeout: NodeJS.Timeout

    const setupVideo = async () => {
      if (!isMounted || !isScanning || !streamRef.current || !videoRef.current) {
        return
      }

      console.log('Setting up video stream...')
      
      try {
        videoRef.current.srcObject = streamRef.current
        
        const handleLoadedMetadata = () => {
          if (!isMounted) return
          
          console.log('Video metadata loaded')
          videoRef.current?.play().then(() => {
            console.log('Video playing successfully')
            if (isMounted) {
              startBarcodeScanning()
            }
          }).catch(err => {
            console.error('Error playing video:', err)
            if (isMounted) {
              startBarcodeScanning()
            }
          })
        }

        videoRef.current.onloadedmetadata = handleLoadedMetadata
        
        // Fallback timeout
        scanningTimeout = setTimeout(() => {
          if (isMounted && videoRef.current && videoRef.current.readyState === 0) {
            console.log('Using fallback for video ready')
            videoRef.current.play().catch(err => {
              console.error('Fallback play failed:', err)
            }).then(() => {
              if (isMounted) {
                startBarcodeScanning()
              }
            })
          } else if (isMounted) {
            startBarcodeScanning()
          }
        }, 2000)
        
      } catch (err) {
        console.error('Error setting up video:', err)
        if (isMounted) {
          startBarcodeScanning()
        }
      }
    }

    if (isScanning) {
      setupVideo()
    }

    return () => {
      isMounted = false
      if (scanningTimeout) {
        clearTimeout(scanningTimeout)
      }
    }
  }, [isScanning])

  // Функция для запуска сканирования штрихкодов
  const startBarcodeScanning = () => {
    if (codeReaderRef.current && videoRef.current) {
      console.log('Starting barcode scanning...')
      try {
        // Останавливаем предыдущее сканирование, если оно было
        if (codeReaderRef.current) {
          codeReaderRef.current.reset()
        }
        
        isScanningRef.current = true
        
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
        isScanningRef.current = false
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
              style={{
                display: 'block',
                transform: 'scaleX(-1)',
                transition: 'opacity 0.3s ease-in-out'
              }}
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