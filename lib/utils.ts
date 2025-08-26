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

export function validateSKU(sku: string): boolean {
  return /^[A-Z0-9_-]+$/.test(sku)
}

export function normalizeSKU(sku: string): string {
  return sku.toUpperCase().replace(/[^A-Z0-9_-]/g, '')
}