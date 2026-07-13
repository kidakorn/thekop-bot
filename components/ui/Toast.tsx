import React from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export interface ToastProps {
  toast: { msg: string; type: 'success' | 'error' } | null
}

export default function Toast({ toast }: ToastProps) {
  if (!toast) return null

  return (
    <>
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        background: toast.type === 'success' ? '#16a34a' : '#C8102E',
        color: 'var(--bg-card)', padding: '12px 20px', borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex', alignItems: 'center', gap: 8,
        animation: 'slideUp 0.3s ease-out'
      }}>
        {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
        <span style={{ fontWeight: 500, fontSize: 14 }}>{toast.msg}</span>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </>
  )
}
