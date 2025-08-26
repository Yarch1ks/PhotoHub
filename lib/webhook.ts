import { ProcessResult } from '@/types'

export interface WebhookConfig {
  url: string
}

export interface WebhookPayload {
  sku: string
  items: ProcessResult[]
  timestamp: string
}

export async function sendToWebhook(
  payload: WebhookPayload,
  config: WebhookConfig
): Promise<void> {
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook request failed with status ${response.status}: ${response.statusText}`)
    }

    console.log(`Successfully sent webhook for SKU: ${payload.sku}`)
  } catch (error) {
    console.error('Webhook error:', error)
    throw new Error(`Failed to send webhook: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function sendFilesToWebhook(
  files: { name: string; data: Buffer }[],
  config: WebhookConfig
): Promise<void> {
  try {
    // For binary data, send the first file directly as binary data
    if (files.length > 0) {
      const file = files[0]
      
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${file.name}"`,
        },
        body: new Uint8Array(file.data),
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}: ${response.statusText}`)
      }

      console.log(`Successfully sent ${file.name} to webhook`)
    }
  } catch (error) {
    console.error('Webhook error:', error)
    throw new Error(`Failed to send files to webhook: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}