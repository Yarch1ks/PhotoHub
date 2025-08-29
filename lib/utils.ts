import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function generateFileName(sku: string, index: number): string {
  return `${sku}_${String(index + 1).padStart(3, '0')}.jpg`
}

export function generateUniqueFileName(sku: string | null, fileExtension: string = 'jpg'): string {
  if (sku) {
    // Используем SKU + порядковый номер
    const timestamp = Date.now()
    return `${sku}_${timestamp}.${fileExtension}`
  } else {
    // Используем timestamp или random UUID
    const useTimestamp = Math.random() > 0.5
    if (useTimestamp) {
      const now = new Date()
      const timestamp = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0')
      return `image_${timestamp}.${fileExtension}`
    } else {
      // Генерируем случайный UUID
      return `image_${Math.random().toString(36).substring(2, 11)}.${fileExtension}`
    }
  }
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2)
}

export function validateSKU(sku: string): boolean {
  return /^[A-Z0-9_-]+$/.test(sku)
}

export function normalizeSKU(sku: string): string {
  return sku.toUpperCase().replace(/[^A-Z0-9_-]/g, '')
}