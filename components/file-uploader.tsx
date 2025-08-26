'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileImage } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void
  onFileRemove: (index: number) => void
  maxFiles?: number
  maxSize?: number
  className?: string
}

export function FileUploader({
  onFilesSelected,
  onFileRemove,
  maxFiles = 30,
  maxSize = 30 * 1024 * 1024, // 30MB
  className
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const totalFiles = acceptedFiles.length
    const remainingSlots = maxFiles - totalFiles

    if (remainingSlots < 0) {
      toast({
        title: 'Превышен лимит файлов',
        description: `Можно загрузить максимум ${maxFiles} файлов`,
        variant: 'destructive',
      })
      return
    }

    onFilesSelected(acceptedFiles)
    setIsDragActive(false)
  }, [maxFiles, onFilesSelected, toast])

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
    },
    maxFiles,
    maxSize,
    multiple: true,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={className}>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/10'
                : isDragReject
                ? 'border-destructive bg-destructive/10'
                : 'border-muted-foreground/25 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-8 sm:h-12 w-8 sm:w-12 text-muted-foreground mb-2 sm:mb-4" />
            <div className="space-y-2">
              <p className="text-base sm:text-lg font-medium">
                {isDragActive ? 'Перетащите файлы сюда' : 'Перетащите файлы или нажмите для выбора'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Поддерживаются изображения (JPG, PNG, WebP, HEIC)
              </p>
              <p className="text-xs text-muted-foreground">
                Максимум {maxFiles} файлов, до {formatFileSize(maxSize)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface FileListProps {
  files: File[]
  onFileRemove: (index: number) => void
}

export function FileList({ files, onFileRemove }: FileListProps) {
  return (
    <div className="space-y-2">
      {files.map((file, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-3">
            <FileImage className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFileRemove(index)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}