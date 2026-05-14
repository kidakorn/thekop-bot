import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Kop Bot Dashboard',
  description: 'Auto-posting bot for คอบอลเดอะค็อป - The Kop',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}