import FormData from 'form-data'
import { createReadStream, writeFileSync, unlinkSync } from 'fs'

export interface TelegramConfig {
  botToken: string
  chatId: string
}

export async function sendZipToTelegram(
  zip: Buffer,
  fileName: string,
  links: string[],
  config: TelegramConfig
): Promise<{ message_id: number }> {
  // Create temporary file
  const tempFilePath = `/tmp/${fileName}`
  writeFileSync(tempFilePath, zip)
  
  console.log('Sending to Telegram:', {
    botToken: config.botToken.substring(0, 10) + '...',
    chatId: config.chatId,
    fileName,
    fileSize: zip.length,
    linksCount: links.length
  })

  const form = new FormData()
  
  form.append('chat_id', config.chatId)
  form.append('caption', links.join('\n'))
  form.append('document', createReadStream(tempFilePath), fileName)

  const response = await fetch(
    `https://api.telegram.org/bot${config.botToken}/sendDocument`,
    {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
      },
      body: form as any,
    }
  )

  console.log('Telegram response status:', response.status)

  // Clean up temporary file
  unlinkSync(tempFilePath)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Telegram API error:', response.status, errorText)
    
    if (response.status === 413) {
      throw new Error('File too large for Telegram')
    }
    
    throw new Error(`Telegram API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  return result.result
}

export async function sendMessageToTelegram(
  text: string,
  config: TelegramConfig
): Promise<{ message_id: number }> {
  const response = await fetch(
    `https://api.telegram.org/bot${config.botToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: 'HTML',
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Telegram API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  return result.result
}

// Helper function to split large files
export async function sendLargeFileInChunks(
  zip: Buffer,
  fileName: string,
  links: string[],
  config: TelegramConfig
): Promise<{ message_ids: number[] }> {
  const MAX_SIZE = 50 * 1024 * 1024 // 50MB
  const chunks: Buffer[] = []
  
  // Split file into chunks
  for (let i = 0; i < zip.length; i += MAX_SIZE) {
    chunks.push(zip.slice(i, i + MAX_SIZE))
  }

  const messageIds: number[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunkFileName = `${fileName.replace('.zip', '')}_part${i + 1}.zip`
    const chunkLinks = i === chunks.length - 1 ? links : []
    
    try {
      const result = await sendZipToTelegram(
        chunks[i],
        chunkFileName,
        chunkLinks,
        config
      )
      messageIds.push(result.message_id)
    } catch (error) {
      console.error(`Failed to send chunk ${i + 1}:`, error)
      throw error
    }
  }

  return { message_ids: messageIds }
}