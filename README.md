# PhotoHub 📸

<p align="center">
  <a href="https://github.com/Yarch1ks/PhotoHub">
    <img src="https://img.shields.io/badge/PhotoHub-blue?style=for-the-badge&logo=github" alt="PhotoHub">
  </a>
  <a href="https://github.com/Yarch1ks/PhotoHub/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/Yarch1ks/PhotoHub/deploy.yml?branch=main&style=for-the-badge&logo=github" alt="Build Status">
  </a>
  <a href="https://github.com/Yarch1ks/PhotoHub/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Yarch1ks/PhotoHub?style=for-the-badge&logo=mit" alt="License">
  </a>
</p>

<p align="center">
  <strong>Веб-сервис для автоматической обработки фотографий с удалением фона через Photoroom API</strong>
</p>

---

## 📋 Описание

PhotoHub — это веб-сервис для автоматической обработки фотографий. Система позволяет загружать изображения, автоматически удалять фон через Photoroom API и отправлять обработанные данные на вебхук для дальнейшей обработки.

Идеально подходит для:
- Интернет-магазинов (обработка карточек товаров)
- Фотоателье (автоматическая обработка портретов)
- Маркетинговых агентств (подготовка визуального контента)

---

## ✨ Возможности

- 📸 **Обработка изображений**: Автоматическое удаление фона через Photoroom API
- 🏷️ **Управление SKU**: Ввод вручную или сканирование штрихкодов Code 39
- 📁 **Массовая загрузка**: Поддержка одновременной загрузки до 30 файлов
- 🔄 **Автоматическое переименование**: Файлы переименовываются по схеме `SKU_001.jpg`, `SKU_002.jpg`
- 🌐 **Вебхук интеграция**: Отправка обработанных данных на указанный URL
- 🖼️ **Превью**: Мгновенный просмотр обработанных изображений
- 🎨 **Адаптивный UI**: Современный интерфейс с поддержкой темной/светлой темы

---

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18+ 
- npm 8+
- Аккаунт Railway для деплоя
- API ключ Photoroom

### Установка

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/Yarch1ks/PhotoHub.git
   cd PhotoHub
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Настройте Railway**
   ```bash
   # Установите Railway CLI
   npm install -g @railway/cli
   railway login
   railway init
   ```

4. **Добавьте переменные окружения в Railway**
   ```bash
   # Photoroom API
   PHOTOROOM_API_KEY=sk_ваш_api_ключ
   PHOTOROOM_API_URL=https://image-api.photoroom.com/v2/edit
   
   # App Configuration
   NEXT_PUBLIC_MAX_UPLOADS=30
   NEXT_PUBLIC_MAX_FILE_MB=30
   NODE_ENV=production
   ```

5. **Запустите в разработке**
   ```bash
   npm run dev
   ```

6. **Деплой на Railway**
   ```bash
   railway up
   ```

---

## 💻 Использование

1. **Откройте веб-интерфейс** по вашему Railway URL
2. **Введите SKU** товара вручную или отсканируйте штрихкод
3. **Загрузите изображения** (поддерживаются JPG, PNG, WebP, HEIC)
4. **Нажмите "Обработать"** - система автоматически:
   - Удалит фон
   - Нормализует размер
   - Переименует файлы
   - Отправит данные на вебхук

---

## 🔧 API Документация

### `/api/process` - Обработка изображений

**Метод**: `POST`  
**Content-Type**: `multipart/form-data`

**Параметры**:
- `sku` (string): SKU товара
- `files[]` (file): Изображения (jpg, png, webp, heic)

**Пример ответа**:
```json
{
  "sku": "TEST001",
  "items": [
    {
      "originalName": "photo1.jpg",
      "processedName": "TEST001_001.jpg",
      "previewUrl": "/api/preview/abc123",
      "processedData": {...}
    }
  ]
}
```

### `/api/health` - Health Check

**Метод**: `GET`  
**Пример ответа**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "service": "PhotoHub API",
  "version": "1.0.0"
}
```

---

## 🏗️ Структура проекта

```
PhotoHub/
├── app/                    # Next.js App Router
│   ├── api/               # API роуты
│   │   ├── process/       # Обработка изображений
│   │   ├── health/        # Health check
│   │   └── webhook-logs/  # Логи вебхуков
│   ├── layout.tsx         # Корневой layout
│   └── page.tsx           # Главная страница
├── components/            # React компоненты
│   ├── ui/               # Базовые UI компоненты
│   ├── barcode-scanner.tsx # Сканер штрихкодов
│   └── file-uploader.tsx   # Загрузчик файлов
├── lib/                  # Утилиты
├── types/               # TypeScript declaration файлы
└── test/                # Тесты
```

---

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm test

# Запуск E2E тестов
npm run test:e2e
```

---

## 🤝 Внесение вклада

1. **Fork** репозитория
2. **Создайте** ветку: `git checkout -b feature/amazing-feature`
3. **Внесите** изменения
4. **Зафиксируйте**: `git commit -m 'Add amazing feature'`
5. **Отправьте**: `git push origin feature/amazing-feature`
6. **Откройте** Pull Request

---

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

---

## ❓ FAQ

### Вопрос: Какие форматы изображений поддерживаются?
**Ответ**: JPG, PNG, WebP и HEIC/HEIF.

### Вопрос: Какой максимальный размер файла?
**Ответ**: 30MB (настраивается через `NEXT_PUBLIC_MAX_FILE_MB`).

### Вопрос: Как получить API ключ Photoroom?
**Ответ**: Зарегистрируйтесь на [photoroom.com](https://photoroom.com), создайте ключ в разделе API.

---

<div align="center">
  <p>
    Сделано с ❤️ командой PhotoHub
  </p>
</div>