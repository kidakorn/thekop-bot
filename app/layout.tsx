import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Kop Bot — Dashboard',
  description: 'Auto-posting bot dashboard for คอบอลเดอะค็อป - The Kop',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}