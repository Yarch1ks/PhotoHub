# PhotoHub — Веб-сервис для обработки фотографий

Полнофункциональный веб-сервис для автоматической обработки фотографий с удалением фона через Photoroom API, загрузкой на FTP и отправкой в Telegram.

## 🚀 Функциональность

- ✅ Ввод SKU вручную или сканирование штрихкодов Code 39
- ✅ Загрузка нескольких фото/видео файлов
- ✅ Автоматическое переименование файлов по схеме `SKU_001.jpg`, `SKU_002.jpg`, ...
- ✅ Обработка изображений через Photoroom API (удаление фона, нормализация размера)
- ✅ Превью обработанных файлов
- ✅ Загрузка на FTP с генерацией публичных ссылок
- ✅ Формирование ZIP-архива и отправка в Telegram
- ✅ Адаптивный UI с темной/светлой темой
- ✅ Поддержка HEIC/HEIF файлов

## 🛠️ Технологический стек

- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Сканер штрихкодов**: @zxing/browser (Code 39)
- **Обработка изображений**: Sharp + heic-convert
- **API**: Photoroom, FTP, Telegram Bot API
- **Логирование**: Pino
- **Тесты**: Vitest + Playwright
- **Деплой**: Railway + Docker

## 📦 Установка

### Клонирование репозитория

```bash
git clone <repository-url>
cd photosku
```

### Установка зависимостей

```bash
npm install
```

### Настройка переменных окружений

Скопируйте пример конфигурации:
```bash
cp .env.example .env.local
```

Отредактируйте файл `.env.local` и добавьте ваши значения:

#### 🔑 Получение API ключа Photoroom

1. Зарегистрируйтесь на [photoroom.com](https://photoroom.com)
2. Перейдите в раздел API/Developers
3. Создайте новый API ключ
4. Скопируйте ключ в `.env.local`

```env
# Photoroom API
PHOTOROOM_API_KEY=sk_ваш_api_ключ_здесь
PHOTOROOM_API_URL=https://image-api.photoroom.com/v2/edit
```

#### 📁 Настройка FTP

```env
# FTP Configuration
FTP_HOST=ваш_хост
FTP_USER=ваш_пользователь
FTP_PASSWORD=ваш_пароль
FTP_BASE_DIR=tmp
PUBLIC_CDN_ORIGIN=https://ваш-домен.com
```

#### 🤖 Настройка Telegram бота

1. Найдите @BotFather в Telegram
2. Создайте нового бота: `/newbot`
3. Скопируйте токен
4. Получите chat ID, отправив сообщение боту и используя @userinfobot

```env
# Telegram
TELEGRAM_BOT_TOKEN=ваш_токен_бота
TELEGRAM_CHAT_ID=ваш_chat_id
```

#### ⚙️ Настройки приложения

```env
# App Configuration
NEXT_PUBLIC_MAX_UPLOADS=30
NEXT_PUBLIC_MAX_FILE_MB=30
NODE_ENV=development
```

### Запуск в разработке

```bash
npm run dev
```

Проект будет доступен по адресу: `http://localhost:3000`

## 🚀 Деплой на Railway

1. Установите [Railway CLI](https://docs.railway.app/develop/cli)
2. Авторизуйтесь в Railway:
   ```bash
   railway login
   ```
3. Инициализируйте проект:
   ```bash
   railway init
   ```
4. Деплой:
   ```bash
   railway up
   ```

Railway автоматически определит Dockerfile и railway.json для деплоя.

## 📁 Структура проекта

```
photosku/
├── app/                    # Next.js App Router
│   ├── api/               # API роуты
│   │   ├── process/       # Обработка изображений
│   │   ├── upload-ftp/    # Загрузка на FTP
│   │   ├── zip-and-telegram/ # Формирование ZIP и отправка в Telegram
│   │   └── preview/       # Превью изображений
│   ├── layout.tsx         # Корневой layout
│   └── page.tsx           # Главная страница
├── components/            # React компоненты
│   ├── ui/               # Базовые UI компоненты (shadcn/ui)
│   ├── barcode-scanner.tsx # Сканер штрихкодов
│   ├── file-uploader.tsx   # Загрузчик файлов
│   └── processing-queue.tsx # Очередь обработки
├── lib/                  # Утилиты и клиенты
│   ├── photoroom.ts      # Интеграция с Photoroom
│   ├── ftp.ts           # Работа с FTP
│   ├── telegram.ts      # Работа с Telegram
│   ├── zip-utils.ts     # Работа с ZIP
│   └── file-storage.ts  # Хранилище файлов
├── types/               # TypeScript declaration файлы
├── test/                # Тесты
├── Dockerfile           # Docker конфигурация
├── railway.json         # Railway конфигурация
└── README.md            # Документация
```

## 🔧 API эндпоинты

### POST `/api/process` - Обработка изображений

**Вход**: `multipart/form-data`
- `sku`: string
- `files[]`: image/\* (jpg/png/webp)

**Выход**: `200 { sku, items: [...] }`

### POST `/api/upload-ftp` - Загрузка на FTP

**Вход**: `JSON { sku: string, items: [...] }`

**Выход**: `200 { links: string[] }`

### POST `/api/zip-and-telegram` - Формирование ZIP и отправка в Telegram

**Вход**: `JSON { sku: string, items: [...], links?: string[] }`

**Выход**: `200 { ok: true, zipFileName }`

### GET `/api/preview/:id` - Превью изображения

**Выход**: `image/jpeg`

## 🧪 Тестирование

### Unit тесты

```bash
npm test
```

### E2E тесты

```bash
npm run test:e2e
```

## 📱 Поддерживаемые браузеры

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔒 Безопасность

- Все ключи и пароли хранятся только в переменных окружения
- Секреты не попадают в репозиторий или логи
- Валидация всех входных данных
- Защита от дубликатов и атак

## 🚨 Известные ограничения

- Максимальный размер файла: 30MB (настраивается через `NEXT_PUBLIC_MAX_FILE_MB`)
- Максимальное количество файлов: 30 (настраивается через `NEXT_PUBLIC_MAX_UPLOADS`)
- Максимальный размер ZIP для Telegram: 49MB (авто-разбиение)
- HEIC/HEIF обработка может быть медленной на некоторых серверах

## 🐛 Отладка

### Логи

Логи выводятся в консоль и доступны в Railway dashboard.

### Health check

Доступен по эндпоинту: `GET /api/health`

```bash
curl http://localhost:3000/api/health
```

## 📄 Лицензия

MIT License

## 🤝 Contributing

1. Fork репозитория
2. Создайте ветку (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push ветку (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Поддержка

При возникновении проблем создайте issue в репозитории.

---

**PhotoHub** — автоматизируйте обработку фотографий с минимальными усилиями!