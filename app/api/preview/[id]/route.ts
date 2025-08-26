import { NextRequest, NextResponse } from 'next/server'
import { processedFiles } from '@/lib/file-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const buffer = processedFiles.get(params.id)
    
    if (!buffer) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check if buffer is a data URL string
    if (typeof buffer === 'string' && (buffer as string).startsWith('data:')) {
      // Handle data URL
      const dataUrl = buffer
      const base64Data = (dataUrl as string).split(',')[1]
      
      if (!base64Data) {
        return NextResponse.json(
          { error: 'Invalid data URL format' },
          { status: 400 }
        )
      }
      
      const binaryData = Buffer.from(base64Data, 'base64')
      const mimeType = (dataUrl as string).split(';')[0].split(':')[1] || 'image/jpeg'
      
      return new NextResponse(binaryData, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Handle binary buffer
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