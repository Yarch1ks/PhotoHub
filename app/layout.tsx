import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PhotoHub - Обработка фотографий',
  description: 'Автоматическая обработка фотографий',
  icons: [
    {
      url: '/PhotoHub.png',
      sizes: '32x32',
      type: 'image/png',
    },
    {
      url: '/PhotoHub.png',
      sizes: '16x16',
      type: 'image/png',
    },
    {
      url: '/PhotoHub.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      url: '/PhotoHub.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col bg-background">
          <main className="flex-1">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}