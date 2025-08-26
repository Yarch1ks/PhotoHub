import { NextRequest, NextResponse } from 'next/server'

// Простое хранилище логов (в реальном приложении лучше использовать базу данных)
const webhookLogs: Array<{
  timestamp: string
  status: number
  headers: Record<string, string>
  body: string
  error?: string
}> = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Добавляем лог
    webhookLogs.push({
      timestamp: new Date().toISOString(),
      status: body.status || 0,
      headers: body.headers || {},
      body: body.body || '',
      error: body.error
    })
    
    // Сохраняем только последние 100 логов
    if (webhookLogs.length > 100) {
      webhookLogs.shift()
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving webhook log:', error)
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    logs: webhookLogs.reverse(), // Показываем самые свежие логи первыми
    total: webhookLogs.length
  })
}