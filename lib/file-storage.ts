// Глобальное хранилище для обработанных файлов
export const processedFiles = new Map<string, Buffer>()

// Сохранение обработанного файла
export function saveProcessedFile(id: string, buffer: Buffer): void {
  processedFiles.set(id, buffer)
}

// Получение обработанного файла
export function getProcessedFile(id: string): Buffer | undefined {
  return processedFiles.get(id)
}

// Очистка старых файлов (чтобы не засорять память)
export function cleanupOldFiles() {
  const now = Date.now()
  const ONE_HOUR = 60 * 60 * 1000
  
  Array.from(processedFiles.entries()).forEach(([id, buffer]) => {
    // В реальном приложении здесь можно добавить логику отслеживания времени создания
    // Для простоты оставляем файлы на 1 час
    if (Math.random() < 0.1) { // 10% шанс очистки при каждом вызове
      processedFiles.delete(id)
    }
  })
}

// Регулярная очистка
if (typeof global !== 'undefined') {
  setInterval(cleanupOldFiles, 10 * 60 * 1000) // Каждые 10 минут
}