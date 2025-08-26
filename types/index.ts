export interface ProcessResult {
  originalName: string
  serverName: string
  width: number
  height: number
  bytes: number
  previewUrl: string
}

export interface ProcessingItem {
  id: string
  originalName: string
  serverName: string
  status: 'queued' | 'processing' | 'done' | 'failed'
  previewUrl?: string
  error?: string
}
