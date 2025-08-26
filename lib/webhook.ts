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