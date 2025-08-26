import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { promises as fs } from 'fs'
import { join } from 'path'
import { ProcessResult } from '@/types'

interface ProcessingItem {
  id: string
  originalName: string
  serverName: string
  status: 'queued' | 'processing' | 'done' | 'failed'
  error?: string
}

const processingItems = new Map<string, ProcessingItem>()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const sku = formData.get('sku')?.toString() || ''
    const files = formData.getAll('files') as File[]

    if (!sku.trim()) {
      return NextResponse.json({ error: 'SKU is required' }, { status: 400 })
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Create temporary directory for this SKU
    const tempDir = join(process.cwd(), 'tmp', sku)
    await fs.mkdir(tempDir, { recursive: true })

    // Process files
    const results: ProcessResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const serverName = `${sku}_${String(i + 1).padStart(3, '0')}.jpg`
      const itemId = uuidv4()

      // Create processing item
      const item: ProcessingItem = {
        id: itemId,
        originalName: file.name,
        serverName,
        status: 'queued',
      }
      processingItems.set(itemId, item)

      try {
        // Process file
        await processFile(file, serverName, tempDir, itemId, sku, results)
        
        // Update item status
        const item = processingItems.get(itemId)
        if (item) {
          item.status = 'done'
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
        const item = processingItems.get(itemId)
        if (item) {
          item.status = 'failed'
          item.error = error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Send all files to webhook
    const webhookUrl = process.env.WEBHOOK_URL
    if (webhookUrl && results.length > 0) {
      try {
        const processedImageUrls = await sendAllFilesToWebhook(results, webhookUrl, sku)
        
        // Update results with webhook URLs
        for (let i = 0; i < results.length; i++) {
          if (processedImageUrls[i]) {
            results[i].previewUrl = processedImageUrls[i]
          }
        }
      } catch (webhookError) {
        console.error('Error sending files to webhook:', webhookError)
      }
    }

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

async function processFile(
  file: File,
  serverName: string,
  tempDir: string,
  itemId: string,
  sku: string,
  results: ProcessResult[]
): Promise<void> {
  const item = processingItems.get(itemId)
  if (item) {
    item.status = 'processing'
  }

  // Read file
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  
  // Save processed file to temp directory
  const filePath = join(tempDir, serverName)
  await fs.writeFile(filePath, fileBuffer)

  // Add to results
  const resultItem: ProcessResult = {
    originalName: file.name,
    serverName,
    width: 1920,
    height: 1080,
    bytes: fileBuffer.length,
    previewUrl: '', // Will be updated later with webhook response
  }
  results.push(resultItem)
}

async function sendAllFilesToWebhook(
  processedResults: ProcessResult[],
  webhookUrl: string,
  sku: string
): Promise<string[]> {
  const processedImageUrls: string[] = []
  
  try {
    // Create FormData for multiple files
    const formData = new FormData()
    
    // Add each file to FormData
    for (let i = 0; i < processedResults.length; i++) {
      const result = processedResults[i]
      const fileBuffer = await getFileBuffer(result.serverName, sku)
      
      if (fileBuffer) {
        const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'image/jpeg' })
        formData.append(`files[${i}]`, blob, result.serverName)
      }
    }
    
    // Send all files in one request
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`Webhook request failed with status ${response.status}: ${response.statusText}`)
    }
    
    // Try to parse the response
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json()
      
      // Handle different response formats
      if (Array.isArray(responseData)) {
        // Handle array of URLs or file objects with dataUrl
        for (const item of responseData) {
          if (item.dataUrl) {
            processedImageUrls.push(item.dataUrl)
          } else if (typeof item === 'string') {
            processedImageUrls.push(item)
          }
        }
      } else if (responseData.dataUrl) {
        processedImageUrls.push(responseData.dataUrl)
      } else if (responseData.urls) {
        processedImageUrls.push(...responseData.urls)
      } else if (responseData.url || responseData.imageUrl || responseData.image) {
        processedImageUrls.push(responseData.url || responseData.imageUrl || responseData.image)
      }
    } else if (contentType && contentType.includes('text')) {
      const responseData = await response.text()
      if (responseData && responseData.startsWith('http')) {
        processedImageUrls.push(responseData.trim())
      }
    }
    
    return processedImageUrls
  } catch (error) {
    console.error('Webhook send error:', error)
    return processedImageUrls
  }
}

async function getFileBuffer(serverName: string, sku: string): Promise<Buffer | null> {
  try {
    const tempDir = join(process.cwd(), 'tmp', sku)
    const filePath = join(tempDir, serverName)
    
    const fileBuffer = await fs.readFile(filePath)
    return fileBuffer
  } catch (error) {
    console.error('Error getting file buffer:', error)
    return null
  }
}

export async function GET() {
  const items = Array.from(processingItems.values())
  return NextResponse.json({ items })
}