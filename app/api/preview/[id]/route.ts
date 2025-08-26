import { NextRequest, NextResponse } from 'next/server'
import { processedFiles } from '@/lib/file-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Preview request for file: ${params.id}`)
    const buffer = processedFiles.get(params.id)
    
    if (!buffer) {
      console.log(`File not found in processedFiles: ${params.id}`)
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    console.log(`File found in processedFiles: ${params.id}, type: ${typeof buffer}`)

    // Check if buffer is a data URL string
    if (typeof buffer === 'string' && (buffer as string).startsWith('data:')) {
      console.log(`Processing data URL for file: ${params.id}`)
      // Handle data URL
      const dataUrl = buffer
      const base64Data = (dataUrl as string).split(',')[1]
      
      if (!base64Data) {
        console.error(`Invalid data URL format for file: ${params.id}`)
        return NextResponse.json(
          { error: 'Invalid data URL format' },
          { status: 400 }
        )
      }
      
      const binaryData = Buffer.from(base64Data, 'base64')
      const mimeType = (dataUrl as string).split(';')[0].split(':')[1] || 'image/jpeg'
      
      console.log(`Data URL processed successfully for file: ${params.id}, mimeType: ${mimeType}, size: ${binaryData.length}`)
      
      return new NextResponse(binaryData, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Handle binary buffer
    console.log(`Processing binary buffer for file: ${params.id}`)
    return new NextResponse(new Uint8Array(buffer as Buffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}