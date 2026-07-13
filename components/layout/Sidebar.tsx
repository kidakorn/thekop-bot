import React from 'react'
import { LayoutDashboard, Rss, Activity, ShoppingBag, Settings, Radio, X } from 'lucide-react'
import { Session } from 'next-auth'

export type ActivePage = 'dashboard' | 'feeds' | 'analytics' | 'settings' | 'affiliate'

interface SidebarProps {
  activePage: ActivePage
  setActivePage: (page: ActivePage) => void
  isMobile: boolean
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  collapsed: boolean
  session: Session | null
  activeSchedulesCount: number
}

export default function Sidebar({
  activePage,
  setActivePage,
  isMobile,
  mobileOpen,
  setMobileOpen,
  collapsed,
  session,
  activeSchedulesCount
}: SidebarProps) {
  const sidebarCls = [
    'sidebar',
    !isMobile && collapsed ? 'collapsed' : '',
    isMobile && !mobileOpen ? 'mobile-hidden' : '',
  ].filter(Boolean).join(' ')

  const mainNavItems = [
    { id: 'dashboard' as const, icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { id: 'feeds' as const, icon: <Rss size={16} />, label: 'RSS Feeds' },
    { id: 'analytics' as const, icon: <Activity size={16} />, label: 'Analytics' },
    { id: 'affiliate' as const, icon: <ShoppingBag size={16} />, label: 'Affiliate' },
  ]

  return (
    <aside className={sidebarCls}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Radio size={17} color="var(--bg-card)" />
        </div>
        <div className="sidebar-logo-text">
          <h1>The Kop Bot</h1>
          <span>Auto-posting system</span>
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              marginLeft: 'auto', background: 'rgba(255,255,255,0.12)',
              border: 'none', borderRadius: 7, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--bg-card)', flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="sidebar-nav-label">Main</span>
        {mainNavItems.map(item => (
          <a
            key={item.id}
            className={`sidebar-nav-item${activePage === item.id ? ' active' : ''}`}
            data-label={item.label}
            onClick={() => { setActivePage(item.id); setMobileOpen(false) }}
            style={{ cursor: 'pointer' }}
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}

        <span className="sidebar-nav-label">System</span>
        <a
          className={`sidebar-nav-item${activePage === 'settings' ? ' active' : ''}`}
          data-label="Settings"
          onClick={() => { setActivePage('settings'); setMobileOpen(false) }}
          style={{ cursor: 'pointer' }}
        >
          <Settings size={16} />
          <span>Settings</span>
        </a>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-status-row" style={{ marginBottom: 10 }}>
          <div className="sidebar-status-dot" />
          <div className="sidebar-status-text">
            <strong>Bot Active</strong>
            <small>Runs {activeSchedulesCount}× / day</small>
          </div>
        </div>
        {/* User Avatar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 10,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          overflow: 'hidden', cursor: 'pointer', transition: 'background 0.2s'
        }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="Profile" referrerPolicy="no-referrer"
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)' }} />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, border: '2px solid rgba(255,255,255,0.3)'
            }}>
              {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="sidebar-status-text">
            <strong style={{ fontSize: 12.5, letterSpacing: '-0.1px' }}>{session?.user?.name || 'User'}</strong>
            <small style={{ fontSize: 10.5 }}>{session?.user?.email?.split('@')[0] || ''}</small>
          </div>
        </div>
      </div>
    </aside>
  )
}
