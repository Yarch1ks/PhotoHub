'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Copy
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ImageViewer } from '@/components/image-viewer'

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

interface ProcessingQueueProps {
  items: ProcessingItem[]
  onDownloadZIP: () => void
  onSendToTelegram: () => void
  links: string[]
}

export function ProcessingQueue({
  items,
  onDownloadZIP,
  onSendToTelegram,
  links
}: ProcessingQueueProps) {
  const [copied, setCopied] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const { toast } = useToast()

  const doneItems = items.filter(item => item.status === 'done')
  const failedItems = items.filter(item => item.status === 'failed')
  const totalItems = items.length

  const getStatusIcon = (status: ProcessingItem['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: ProcessingItem['status']) => {
    const variants = {
      queued: 'secondary',
      processing: 'default',
      done: 'default',
      failed: 'destructive'
    } as const

    const labels = {
      queued: 'В очереди',
      processing: 'Обработка',
      done: 'Готово',
      failed: 'Ошибка'
    }

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status]}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const copyToClipboard = async () => {
    if (links.length === 0) return
    
    const text = links.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: 'Ссылки скопированы',
        description: 'Все публичные ссылки скопированы в буфер обмена'
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать ссылки',
        variant: 'destructive'
      })
    }
  }

  const openLink = (link: string) => {
    window.open(link, '_blank')
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5" />
              Очередь обработки
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {doneItems.length} из {totalItems} файлов обработано
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress
                value={(doneItems.length / totalItems) * 100}
                className="h-2"
              />
              
              <div className="grid gap-2 sm:gap-3 max-h-64 sm:max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getStatusIcon(item.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        <p className="text-xs sm:text-sm font-medium truncate">
                          {item.originalName}
                        </p>
                        {getStatusBadge(item.status)}
                      </div>
                      
                      {item.serverName && (
                        <p className="text-xs text-muted-foreground">
                          {item.serverName}
                        </p>
                      )}
                      
                      {item.width && item.height && (
                        <p className="text-xs text-muted-foreground">
                          {item.width} × {item.height} px
                        </p>
                      )}
                      
                      {item.bytes && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.bytes)}
                        </p>
                      )}
                      
                      {item.error && (
                        <p className="text-xs text-red-500">
                          {item.error}
                        </p>
                      )}
                      
                      {item.progress !== undefined && item.status === 'processing' && (
                        <div className="mt-1">
                          <Progress value={item.progress} className="h-1" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      {item.previewUrl && item.status === 'done' && (
                        <div className="group relative">
                          <div
                            className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden border-2 border-green-500 cursor-pointer hover:opacity-90 transition-all hover:scale-105"
                            onClick={() => {
                              const imageIndex = doneItems.findIndex(img => img.serverName === item.serverName)
                              if (imageIndex !== -1) {
                                setSelectedImageIndex(imageIndex)
                                setIsImageViewerOpen(true)
                              }
                            }}>
                            <img
                              src={item.previewUrl}
                              alt={item.originalName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                              Просмотр
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ссылки на обработанные файлы</CardTitle>
            <CardDescription>
              Ссылки на файлы, отправленные на webhook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Скопировано!' : 'Копировать все'}
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {links.map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <p className="text-sm font-mono truncate flex-1 mr-2">
                      {link}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openLink(link)}
                      className="flex-shrink-0"
                    >
                      
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {failedItems.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700 text-base sm:text-lg">Ошибки обработки</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {failedItems.length} файлов не удалось обработать
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-xs sm:text-sm">
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  <span className="text-red-700">{item.originalName}</span>
                  <span className="text-red-500 text-xs ml-auto">
                    {item.error}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ImageViewer Modal */}
      <ImageViewer
        images={doneItems.map(item => ({
          url: item.previewUrl!,
          name: item.originalName
        }))}
        currentIndex={selectedImageIndex}
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        onPrev={() => setSelectedImageIndex(prev => Math.max(0, prev - 1))}
        onNext={() => setSelectedImageIndex(prev => Math.min(doneItems.length - 1, prev + 1))}
      />
    </div>
  )
}