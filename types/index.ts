export interface ProcessResult {
  originalName: string
  serverName: string
  width: number
  height: number
  bytes: number
  previewUrl: string
  bufferId?: string
}

export interface ProcessingItem {
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

export interface TelegramConfig {
  botToken: string
  chatId: string
}
