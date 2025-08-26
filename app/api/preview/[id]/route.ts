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

    return new NextResponse(buffer as any, {
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