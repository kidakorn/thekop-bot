import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format วันที่เป็นภาษาไทย
 */
export function formatThaiDate(date: Date): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  }).format(date)
}

/** Strip HTML tags from a string */
export function stripHtml(str: string) {
  return str.replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, c => {
    const map: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&apos;': "'" }
    return map[c] ?? c
  }).trim()
}

export function formatDate(d: string) {
  return new Date(d).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export const statusConfig: Record<string, { label: string; cls: string; dot: string }> = {
  POSTED: { label: 'Posted', cls: 'badge-posted', dot: '#16a34a' },
  FAILED: { label: 'Failed', cls: 'badge-failed', dot: '#b91c1c' },
  PENDING: { label: 'Pending', cls: 'badge-pending', dot: '#d97706' },
  SKIPPED: { label: 'Skipped', cls: 'badge-skipped', dot: '#9ca3af' },
}