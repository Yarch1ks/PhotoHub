import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { promises as fs } from 'fs'
import { join } from 'path'
import { sendToWebhook, sendFilesToWebhook } from '@/lib/webhook'
import { createZipArchive } from '@/lib/zip-utils'
import { sendZipToTelegram } from '@/lib/telegram'
import { ProcessResult } from '@/types'
import heicConvert from 'heic-convert'

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

// Import shared file storage
import { processedFiles } from '@/lib/file-storage'
const processingItems = new Map<string, ProcessingItem>()

export async function POST(request: NextRequest) {
  try {
    console.log('Starting process request...')
    
    // Add File polyfill for standalone mode
    if (typeof File === 'undefined') {
      (global as any).File = class File extends Blob {
        constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
          super(bits, options)
          this.name = name
        }
        name: string
      }
      console.log('File polyfill added')
    }

    const formData = await parseForm(request)
    console.log('FormData parsed:', {
      sku: formData.fields.sku?.[0],
      filesCount: formData.files?.length
    })
    
    const sku = formData.fields.sku?.[0] || ''
    const files = formData.files || []

    if (!sku.trim()) {
      console.log('SKU is empty')
      return NextResponse.json(
        { error: 'SKU is required' },
        { status: 400 }
      )
    }

    if (files.length === 0) {
      console.log('No files provided')
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }
    
    console.log('Processing files:', files.map(f => f.originalFilename))

    // Create temporary directory for this SKU
    const tempDir = join(process.cwd(), 'tmp', sku)
    await fs.mkdir(tempDir, { recursive: true })

    // Process files
    const results: ProcessResult[] = []
    const maxConcurrency = 3 // Limit concurrent processing
    const processingPromises: Promise<void>[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const serverName = `${sku}_${String(i + 1).padStart(3, '0')}.jpg`
      const itemId = uuidv4()

      // Create processing item
      const item: ProcessingItem = {
        id: itemId,
        originalName: file.originalFilename || file.file.name || `file_${i}`,
        serverName,
        status: 'queued',
      }
      processingItems.set(itemId, item)

      // Process file with concurrency control
      const processPromise = processFileWithRetry(
        file,
        serverName,
        tempDir,
        itemId,
        sku,
        results
      ).catch((error) => {
        console.error(`Error processing ${file.originalFilename || file.file.name}:`, error)
        const item = processingItems.get(itemId)
        if (item) {
          item.status = 'failed'
          item.error = error.message
        }
      })

      processingPromises.push(processPromise)

      // Limit concurrency
      if (processingPromises.length >= maxConcurrency) {
        await Promise.all(processingPromises.splice(0, maxConcurrency))
      }
    }

    // Wait for remaining processing
    await Promise.all(processingPromises)

    return NextResponse.json({
      sku,
      items: results,
    })
  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function parseForm(request: NextRequest) {
  try {
    const formData = await request.formData()
    console.log('FormData entries:', Array.from(formData.entries()).map(([key, value]) => ({
      key,
      type: typeof value,
      size: value instanceof File ? value.size : 'N/A',
      name: value instanceof File ? value.name : 'N/A'
    })))
    
    const fields: Record<string, string[]> = {}
    const files: any[] = []

    for (const [key, value] of formData.entries()) {
      if (key === 'sku') {
        fields[key] = [value.toString()]
        console.log('Found SKU:', value.toString())
      } else if (key.startsWith('files') && value instanceof File) {
        console.log('Found file:', { name: value.name, size: value.size, type: value.type })
        files.push({
          originalFilename: value.name,
          filepath: '', // Will be handled differently
          mimetype: value.type,
          size: value.size,
          file: value
        })
      }
    }

    console.log('Parsed result:', { sku: fields.sku?.[0], filesCount: files.length })
    return { fields, files }
  } catch (error) {
    console.error('Error parsing form:', error)
    throw error
  }
}

async function processFileWithRetry(
  file: any,
  serverName: string,
  tempDir: string,
  itemId: string,
  sku: string,
  results: ProcessResult[]
): Promise<void> {
  const maxRetries = 3
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      const item = processingItems.get(itemId)
      if (item) {
        item.status = 'processing'
        item.progress = 0
      }

      // Read file
      const fileBuffer = Buffer.from(await file.file.arrayBuffer())
      
      // Convert all images to JPEG for webhook compatibility
      let processedBuffer = fileBuffer
      let contentType = 'image/jpeg'
      let width = 0
      let height = 0
      
      if (!file.mimetype?.startsWith('image/jpeg')) {
        try {
          // Handle HEIC/HEIF files first
          if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
            console.log(`Converting HEIC file: ${file.originalFilename}`)
            processedBuffer = await heicConvert({
              buffer: fileBuffer,
              format: 'JPEG',
              quality: 90
            })
            console.log(`Successfully converted HEIC to JPG: ${file.originalFilename}`)
            
            // Get dimensions from HEIC metadata
            try {
              const heif = require('heic-decode')
              const decoded = await heif(fileBuffer)
              width = decoded.width
              height = decoded.height
            } catch (metadataError) {
              console.warn('Could not get HEIC dimensions:', metadataError)
            }
          } else {
            // For non-HEIC formats, use simple conversion without Sharp
            // Create a simple JPEG wrapper for basic formats
            const imageType = file.mimetype?.split('/')[1] || 'jpeg'
            if (imageType === 'png' || imageType === 'webp') {
              // For basic formats, we'll use a simple approach
              // In production, you might want to use a different image library
              processedBuffer = fileBuffer
              contentType = file.mimetype || 'image/jpeg'
            } else {
              throw new Error(`Unsupported format: ${file.mimetype}`)
            }
          }
        } catch (conversionError) {
          console.error('Conversion error:', conversionError)
          throw new Error(`Ошибка конвертации файла: ${file.originalFilename || 'unknown'}. Пожалуйста, используйте JPG, PNG, WebP или HEIC форматы.`)
        }
      } else {
        // For JPEG files, try to get dimensions
        try {
          const heif = require('heic-decode')
          const decoded = await heif(fileBuffer)
          width = decoded.width
          height = decoded.height
        } catch (metadataError) {
          // If not HEIC, use basic dimensions
          width = 1920 // Default width
          height = 1080 // Default height
        }
      }

      // Update progress
      if (item) {
        item.progress = 50
      }

      // Update progress
      if (item) {
        item.progress = 90
      }

      // Send to webhook and get response
      let webhookSent = false
      let processedImageUrl = ''
      try {
        const webhookUrl = process.env.WEBHOOK_URL
        if (webhookUrl) {
          const webhookConfig = { url: webhookUrl }
          
          // Send the processed image to webhook as binary data and get response
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${file.originalFilename || serverName}"`,
            },
            body: processedBuffer,
          })

          if (!response.ok) {
            throw new Error(`Webhook request failed with status ${response.status}: ${response.statusText}`)
          }

          // Try to get the processed image from response
          try {
            const contentType = response.headers.get('content-type')
            
            if (contentType && contentType.includes('application/json')) {
              // If JSON response, try to extract URL
              const responseData = await response.json()
              if (responseData.url || responseData.imageUrl || responseData.image) {
                processedImageUrl = responseData.url || responseData.imageUrl || responseData.image
              } else {
                processedImageUrl = webhookUrl
              }
            } else if (contentType && contentType.includes('text')) {
              // If text response, check if it's a URL
              const responseData = await response.text()
              if (responseData && responseData.startsWith('http')) {
                processedImageUrl = responseData.trim()
              } else {
                processedImageUrl = webhookUrl
              }
            } else {
              // For binary response, create a data URL
              console.log('Received binary response from webhook, creating data URL')
              try {
                const arrayBuffer = await response.arrayBuffer()
                const base64 = Buffer.from(arrayBuffer).toString('base64')
                const mimeType = contentType || 'image/jpeg'
                processedImageUrl = `data:${mimeType};base64,${base64}`
                console.log(`Successfully created data URL with length: ${base64.length}`)
              } catch (error) {
                console.error('Error creating data URL:', error)
                processedImageUrl = webhookUrl
              }
            }
          } catch (responseError) {
            console.log('Could not parse webhook response, using webhook URL as fallback')
            processedImageUrl = webhookUrl
          }
          
          webhookSent = true
          console.log(`Successfully sent ${serverName} to webhook`)
        }
      } catch (webhookError) {
        console.error('Webhook send error:', webhookError)
        // Don't fail the entire processing if webhook send fails
      }

      // Update item status
      if (item) {
        item.status = 'done'
        item.width = width
        item.height = height
        item.bytes = processedBuffer.length
        item.previewUrl = webhookSent ? processedImageUrl : `/api/preview/${serverName}`
      }

      // Add to results
      const resultItem = {
        originalName: file.originalFilename || file.file.name || `file_${itemId}`,
        serverName,
        width,
        height,
        bytes: processedBuffer.length,
        previewUrl: webhookSent ? processedImageUrl : `/api/preview/${serverName}`,
        bufferId: undefined
      }
      console.log(`Adding to results:`, { serverName: resultItem.serverName, previewUrl: resultItem.previewUrl })
      results.push(resultItem)

      return
    } catch (error) {
      retryCount++
      console.error(`Retry ${retryCount} for ${file.originalFilename || file.file.name}:`, error)
      
      if (retryCount >= maxRetries) {
        throw error
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
    }
  }
}

export async function GET() {
  // Return current processing status
  const items = Array.from(processingItems.values())
  return NextResponse.json({ items })
}

// Helper function to automatically create ZIP and send to Telegram
async function autoCreateZipAndSendToTelegram(
  processedResults: ProcessResult[],
  sku: string
): Promise<void> {
  if (processedResults.length === 0) return

  try {
    // Generate ZIP filename
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '')
    const zipFileName = `${sku}_${timestamp}.zip`

    // Create ZIP archive
    const zipBuffer = await createZipArchive(processedResults, zipFileName)

    // Send to Telegram
    const telegramConfig = {
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
    }

    await sendZipToTelegram(
      zipBuffer,
      zipFileName,
      processedResults.map(result => result.previewUrl).filter(Boolean),
      telegramConfig
    )

    console.log(`Auto-sent ZIP to Telegram: ${zipFileName}`)
  } catch (error) {
    console.error('Auto ZIP and Telegram error:', error)
    // Don't fail the entire processing if auto-send fails
  }
}