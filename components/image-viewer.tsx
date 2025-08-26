'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

interface ImageViewerProps {
  images: Array<{
    url: string
    name: string
  }>
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

export function ImageViewer({
  images,
  currentIndex,
  isOpen,
  onClose,
  onPrev,
  onNext
}: ImageViewerProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handlePrev = () => {
    if (isAnimating) return
    setIsAnimating(true)
    onPrev?.()
    setTimeout(() => setIsAnimating(false), 300)
  }

  const handleNext = () => {
    if (isAnimating) return
    setIsAnimating(true)
    onNext?.()
    setTimeout(() => setIsAnimating(false), 300)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowLeft') {
      handlePrev()
    } else if (e.key === 'ArrowRight') {
      handleNext()
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !images.length) return null

  const currentImage = images[currentIndex]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-none p-0 bg-black/95 backdrop-blur-sm border-none"
        aria-describedby="image-viewer-description"
      >
        <div id="image-viewer-description" className="sr-only">
          Image viewer with keyboard navigation. Use arrow keys to navigate, ESC to close.
        </div>
        <div className="relative w-full h-screen flex items-center justify-center">
          {/* Закрывающая кнопка */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Кнопка предыдущего изображения */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 z-50 text-white hover:bg-white/20"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {/* Кнопка следующего изображения */}
          {currentIndex < images.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 z-50 text-white hover:bg-white/20"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {/* Название изображения */}
          {currentImage.name && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
              <p className="text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                {currentImage.name}
              </p>
            </div>
          )}

          {/* Изображение с анимацией */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
            }`}
          >
            <img
              src={currentImage.url}
              alt={currentImage.name}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>

          {/* Индикатор прогресса */}
          <div className="absolute bottom-4 right-4 z-50">
            <p className="text-white/60 text-sm">
              {currentIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}