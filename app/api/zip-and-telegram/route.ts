import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import archiver from 'archiver'
import { sendZipToTelegram } from '@/lib/telegram'
import { createZipArchive } from '@/lib/zip-utils'
import { ProcessResult } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sku, items, links } = body

    if (!sku || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Generate ZIP filename
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '')
    const zipFileName = `${sku}_${timestamp}.zip`

    // Create ZIP archive
    const zipBuffer = await createZipArchive(items, zipFileName)

    // Send to Telegram
    const telegramConfig = {
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
    }

    const telegramResult = await sendZipToTelegram(
      zipBuffer,
      zipFileName,
      links || [],
      telegramConfig
    )

    return NextResponse.json({
      ok: true,
      zipFileName,
      telegramMessageId: telegramResult.message_id,
    })
  } catch (error) {
    console.error('ZIP and Telegram error:', error)
    return NextResponse.json(
      { error: 'Failed to create ZIP and send to Telegram' },
      { status: 500 }
    )
  }
}
