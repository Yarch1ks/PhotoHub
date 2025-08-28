'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Scan, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void
  onPhotoTaken: (photo: File) => void
  onClose?: () => void
}

export function BarcodeScanner({ onBarcodeDetected, onPhotoTaken, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      return
    }

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    // Устанавливаем размеры canvas как у видео
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Рисуем текущий кадр с видео на canvas (с зеркальным отражением)
    context.save()
    context.scale(-1, 1)
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
    context.restore()

    // Получаем data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setPhotoDataUrl(dataUrl)

    // Создаем файл с уникальным именем
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const uniqueFileName = `photo_${timestamp}.jpg`
    
    // Конвертируем data URL в Blob, а затем в File
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const photoFile = new File([blob], uniqueFileName, {
          type: 'image/jpeg',
          lastModified: Date.now()
        })
        onPhotoTaken(photoFile)
        toast({
          title: 'Фото сделано',
          description: `Фото сохранено как ${uniqueFileName}`,
        })
        stopScanning()
      })
      .catch(err => {
        console.error('Error converting photo to file:', err)
        toast({
          title: 'Ошибка',
          description: 'Не удалось сохранить фото',
          variant: 'destructive',
        })
      })
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
          Камера
        </CardTitle>
        <CardDescription>
          Сделайте фото или отсканируйте штрихкод
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
          <canvas ref={canvasRef} className="hidden" />
          
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

          {photoDataUrl && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 mx-auto text-white mb-2" />
                <p className="text-white font-medium">Фото сделано</p>
                <p className="text-white/80 text-sm mt-1">Нажмите "Использовать фото"</p>
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
              {isProcessing ? 'Инициализация...' : 'Запустить камеру'}
            </Button>
          ) : (
            <>
              <Button
                onClick={takePhoto}
                className="flex-1"
                disabled={isProcessing}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Сделать фото
              </Button>
              <Button
                variant="outline"
                onClick={stopScanning}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Остановить
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {detectedBarcode && (
            <Button
              onClick={handleUseDetectedBarcode}
              className="flex-1"
            >
              <Scan className="w-4 h-4 mr-2" />
              Использовать штрихкод
            </Button>
          )}

          {photoDataUrl && (
            <Button
              onClick={() => {
                if (photoDataUrl) {
                  // Создаем файл с уникальным именем
                  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
                  const uniqueFileName = `photo_${timestamp}.jpg`
                  
                  // Конвертируем data URL в Blob, а затем в File
                  fetch(photoDataUrl)
                    .then(res => res.blob())
                    .then(blob => {
                      const photoFile = new File([blob], uniqueFileName, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                      })
                      onPhotoTaken(photoFile)
                      toast({
                        title: 'Фото добавлено',
                        description: `Фото добавлено как ${uniqueFileName}`,
                      })
                      setPhotoDataUrl(null)
                      stopScanning()
                    })
                    .catch(err => {
                      console.error('Error converting photo to file:', err)
                      toast({
                        title: 'Ошибка',
                        description: 'Не удалось добавить фото',
                        variant: 'destructive',
                      })
                    })
                }
              }}
              className="flex-1"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Использовать фото
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