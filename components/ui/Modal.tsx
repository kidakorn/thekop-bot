import React, { useEffect } from 'react'

export interface ModalProps {
  isOpen?: boolean
  onClose?: () => void
  onConfirm?: () => void
  title?: string
  confirmText?: string
  confirmType?: 'danger' | 'primary'
  children: React.ReactNode
  maxWidth?: number | string
}

export default function Modal({ 
  isOpen = true, 
  onClose, 
  onConfirm, 
  title, 
  confirmText = 'Confirm', 
  confirmType = 'primary', 
  children, 
  maxWidth = 360 
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
    }}>
      {/* Click outside to close */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      
      {/* Modal content */}
      <div style={{
        position: 'relative',
        background: 'var(--bg-card)', 
        borderRadius: 16, 
        width: '90%', 
        maxWidth,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
        animation: 'slideUp 0.2s ease-out'
      }}>
        {title && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', fontSize: 16, fontWeight: 700 }}>
            {title}
          </div>
        )}
        <div style={{ padding: '20px', fontSize: 14, color: 'var(--text-main)', lineHeight: 1.5 }}>
          {children}
        </div>
        {onConfirm && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-main)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button onClick={onConfirm} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: confirmType === 'danger' ? '#ef4444' : '#C8102E', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>{confirmText}</button>
          </div>
        )}
      </div>
    </div>
  )
}
