import archiver from 'archiver'
import { ProcessResult } from '@/types'
import { promises as fs } from 'fs'
import { createWriteStream } from 'fs'
import { join } from 'path'

export interface ZipItem {
  name: string
  data: Buffer
}

export async function createZipArchive(
  items: ProcessResult[],
  fileName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = require('archiver')('zip', {
      zlib: { level: 9 }
    })

    const chunks: Buffer[] = []
    
    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    archive.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    archive.on('error', (err: any) => {
      reject(err)
    })

    // Add files to archive using bufferId to get file data
    items.forEach((item) => {
      if (!item.bufferId) {
        console.warn(`No bufferId for file: ${item.serverName}`)
        return
      }

      // For now, we'll create a placeholder file since we're sending to webhook
      // In production, you would retrieve the actual file data from storage
      const placeholderBuffer = Buffer.from(`Placeholder for ${item.serverName} (${item.width}x${item.height}, ${item.bytes} bytes)`)
      
      archive.append(placeholderBuffer, { name: item.serverName })
      console.log(`Added to ZIP: ${item.serverName} (${placeholderBuffer.length} bytes)`)
    })

    archive.finalize()
  })
}

export function splitFileIntoChunks(
  buffer: Buffer,
  maxSize: number = 50 * 1024 * 1024 // 50MB
): Buffer[] {
  const chunks: Buffer[] = []
  
  for (let i = 0; i < buffer.length; i += maxSize) {
    chunks.push(buffer.slice(i, i + maxSize))
  }

  return chunks
}