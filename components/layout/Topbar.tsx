import React from 'react'
import { Menu, TrendingUp, Sun, Moon, RefreshCw } from 'lucide-react'
import { ActivePage } from './Sidebar'

interface TopbarProps {
  activePage: ActivePage
  isMobile: boolean
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>
  theme: 'light' | 'dark'
  toggleTheme: () => void
  clock: string
  totalPostedToday: number
  handleRefresh: () => void
  triggeringNews: boolean
  handleTriggerNews: () => void
}

export default function Topbar({
  activePage,
  isMobile,
  setMobileOpen,
  theme,
  toggleTheme,
  clock,
  totalPostedToday,
  handleRefresh,
  triggeringNews,
  handleTriggerNews
}: TopbarProps) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="topbar-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Open menu">
          <Menu size={17} />
        </button>
        <div>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
            <span style={{ color: 'var(--text-muted-light)' }}>The Kop Bot</span>
            <span style={{ color: 'var(--text-muted-light)' }}>/</span>
            <span style={{ color: 'var(--text-strong)', fontWeight: 600 }}>
              {activePage === 'dashboard' && 'Dashboard'}
              {activePage === 'feeds' && 'RSS Feeds'}
              {activePage === 'analytics' && 'Analytics'}
              {activePage === 'settings' && 'Settings'}
              {activePage === 'affiliate' && 'Affiliate'}
            </span>
          </div>
          <div className="topbar-title" style={{ lineHeight: 1 }}>
            {activePage === 'dashboard' && 'Overview Dashboard'}
            {activePage === 'feeds' && 'RSS Feeds'}
            {activePage === 'analytics' && 'Analytics'}
            {activePage === 'settings' && 'Settings'}
            {activePage === 'affiliate' && 'Affiliate Monetization'}
          </div>
        </div>
      </div>
      <div className="topbar-right">
        {/* Real-time Clock */}
        {!isMobile && clock && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
            borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border-light)',
            fontSize: 13, fontWeight: 600, color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.5px'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
            {clock}
          </div>
        )}
        {/* Today's post count */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
            borderRadius: 8, background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
            border: '1px solid #fcd34d', fontSize: 12, fontWeight: 700, color: '#92400e'
          }}>
            <TrendingUp size={13} />
            {totalPostedToday} โพสต์วันนี้
          </div>
        )}
        <button onClick={toggleTheme} className="btn-refresh" style={{ padding: '8px', borderRadius: '50%' }} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <div className="live-badge">
          <span style={{ width: 6, height: 6, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
          Live
        </div>
        <button id="refresh-btn" className="btn-refresh" onClick={handleRefresh} style={{ marginRight: 12 }}>
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>
    </div>
  )
}
