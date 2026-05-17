'use client'

import { useState, useEffect, JSX } from 'react'
import useSWR from 'swr'
import {
  BarChart2, CheckCircle, XCircle, Clock, RefreshCw,
  LayoutDashboard, Settings, Rss, Activity, Trash2,
  FileText, TrendingUp, Radio, ChevronLeft, Menu, X,
  ExternalLink, ChevronRight,
} from 'lucide-react'
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts'
import { PostStats } from '../types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Post {
  id: string
  title: string
  status: string
  fbPostId: string | null
  postedAt: string | null
  createdAt: string
  link?: string
}

/** Strip HTML tags from a string */
function stripHtml(str: string) {
  return str.replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, c => {
    const map: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&apos;': "'" }
    return map[c] ?? c
  }).trim()
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const statusConfig: Record<string, { label: string; cls: string; dot: string }> = {
  POSTED:  { label: 'Posted',  cls: 'badge-posted',  dot: '#16a34a' },
  FAILED:  { label: 'Failed',  cls: 'badge-failed',  dot: '#b91c1c' },
  PENDING: { label: 'Pending', cls: 'badge-pending', dot: '#d97706' },
  SKIPPED: { label: 'Skipped', cls: 'badge-skipped', dot: '#9ca3af' },
}

type ActivePage = 'dashboard' | 'feeds' | 'analytics' | 'settings'

const POSTS_PER_PAGE = 10

export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activePage, setActivePage] = useState<ActivePage>('dashboard')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 769
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const { data: stats, isLoading: statsLoading, mutate: mutateStats } =
    useSWR<PostStats>('/api/stats', fetcher, { refreshInterval: 30000 })
  const { data: postsData, isLoading: postsLoading, mutate: mutatePosts } =
    useSWR<Post[]>('/api/posts', fetcher, { refreshInterval: 30000 })
  const posts = Array.isArray(postsData) ? postsData : []

  const totalPostedToday = posts.filter(p => {
    return p.status === 'POSTED' && new Date(p.createdAt).toDateString() === new Date().toDateString()
  }).length

  function handleRefresh() { mutateStats(); mutatePosts() }

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDelete() {
    if (!deleteConfirmId) return
    const id = deleteConfirmId
    setDeleteConfirmId(null)
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      showToast(err.error ?? 'Failed to delete', 'error')
      return
    }
    mutatePosts()
    mutateStats()
    showToast('ลบโพสต์เรียบร้อยแล้ว', 'success')
  }

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE))
  const currentPosts = posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)

  // Chart data (group by date)
  const chartData = (() => {
    const grouped: Record<string, { date: string, POSTED: number, PENDING: number, FAILED: number }> = {}
    posts.forEach(p => {
      const d = new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      if (!grouped[d]) grouped[d] = { date: d, POSTED: 0, PENDING: 0, FAILED: 0 }
      if (p.status === 'POSTED') grouped[d].POSTED++
      if (p.status === 'PENDING') grouped[d].PENDING++
      if (p.status === 'FAILED') grouped[d].FAILED++
    })
    return Object.values(grouped).reverse().slice(-7)
  })()

  const sidebarCls = [
    'sidebar',
    !isMobile && collapsed ? 'collapsed' : '',
    isMobile && !mobileOpen ? 'mobile-hidden' : '',
  ].filter(Boolean).join(' ')

  const mainCls = [
    'main-content',
    !isMobile && collapsed ? 'sidebar-collapsed' : '',
    isMobile ? 'sidebar-mobile' : '',
  ].filter(Boolean).join(' ')

  const RSS_FEEDS = [
    { name: 'BBC Sport — Liverpool', url: 'https://www.bbc.co.uk/sport/football/teams/liverpool/rss.xml' },
    { name: 'Liverpool Echo', url: 'https://www.liverpoolecho.co.uk/all-about/liverpool-fc?service=rss' },
    { name: 'LFC Official (Scraped)', url: 'https://www.liverpoolfc.com/news' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'success' ? '#16a34a' : '#C8102E',
          color: '#fff', padding: '12px 20px', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideUp 0.3s ease-out'
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span style={{ fontWeight: 500, fontSize: 14 }}>{toast.msg}</span>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="sidebar-overlay visible" onClick={() => setMobileOpen(false)} />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 360,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'slideUp 0.2s ease-out'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f1117', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trash2 color="#C8102E" size={20} />
              ยืนยันการลบโพสต์
            </h3>
            <p style={{ fontSize: 14, color: '#4a4f6a', marginBottom: 24 }}>
              คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#4a4f6a', background: '#f0f2f5', border: 'none', cursor: 'pointer' }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', background: '#C8102E', border: 'none', cursor: 'pointer' }}
              >
                ลบโพสต์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar Toggle Button (outside sidebar to avoid overflow:hidden clipping) ── */}
      {!isMobile && (
        <button
          className={`sidebar-toggle-btn${collapsed ? ' collapsed' : ''}`}
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand' : 'Collapse'}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft size={13} />
        </button>
      )}

      {/* ── Sidebar ── */}
      <aside className={sidebarCls}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Radio size={17} color="#fff" />
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
                cursor: 'pointer', color: '#fff', flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <span className="sidebar-nav-label">Main</span>
          {([
            { id: 'dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
            { id: 'feeds',     icon: <Rss size={16} />,             label: 'RSS Feeds' },
            { id: 'analytics', icon: <Activity size={16} />,         label: 'Analytics' },
          ] as { id: ActivePage; icon: JSX.Element; label: string }[]).map(item => (
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
          <div className="sidebar-status-row">
            <div className="sidebar-status-dot" />
            <div className="sidebar-status-text">
              <strong>Bot Active</strong>
              <small>Runs 6× / day</small>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={mainCls} style={{ flex: 1 }}>
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <button className="topbar-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Open menu">
              <Menu size={17} />
            </button>
            <div>
              <div className="topbar-title">
                {activePage === 'dashboard' && 'Overview Dashboard'}
                {activePage === 'feeds'     && 'RSS Feeds'}
                {activePage === 'analytics' && 'Analytics'}
                {activePage === 'settings'  && 'Settings'}
              </div>
              <div className="topbar-subtitle">คอบอลเดอะค็อป — The Kop</div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="live-badge">
              <span style={{ width: 6, height: 6, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
              Live
            </div>
            <button id="refresh-btn" className="btn-refresh" onClick={handleRefresh}>
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>

        {/* ═════════════════════════════════
            DASHBOARD PAGE
        ═════════════════════════════════ */}
        {activePage === 'dashboard' && (
          <div className="page-body">
            {/* Stats */}
            <div className="stats-grid">
              {statsLoading ? (
                [0,1,2,3].map(i => (
                  <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #e8eaed', height: 88 }}>
                    <div className="skeleton-line" style={{ height: 11, width: '50%', marginBottom: 10 }} />
                    <div className="skeleton-line" style={{ height: 26, width: '35%' }} />
                  </div>
                ))
              ) : (
                <>
                  <div className="stat-card">
                    <div className="stat-card-icon blue"><BarChart2 size={18} /></div>
                    <div className="stat-card-content">
                      <div className="stat-card-label">Total Posts</div>
                      <div className="stat-card-value">{stats?.total ?? 0}</div>
                      <div className="stat-card-sub">All time</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon green"><CheckCircle size={18} /></div>
                    <div className="stat-card-content">
                      <div className="stat-card-label">Posted</div>
                      <div className="stat-card-value">{stats?.posted ?? 0}</div>
                      <div className="stat-card-sub">{totalPostedToday} today</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon amber"><Clock size={18} /></div>
                    <div className="stat-card-content">
                      <div className="stat-card-label">Pending</div>
                      <div className="stat-card-value">{stats?.pending ?? 0}</div>
                      <div className="stat-card-sub">Awaiting publish</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon red"><XCircle size={18} /></div>
                    <div className="stat-card-content">
                      <div className="stat-card-label">Failed</div>
                      <div className="stat-card-value">{stats?.failed ?? 0}</div>
                      <div className="stat-card-sub">Need attention</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Post History Table */}
            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <div className="table-card-title">Post History</div>
                  <div className="table-card-meta">{posts.length} recent records</div>
                </div>
                <TrendingUp size={15} color="#8a8fa8" />
              </div>

              {postsLoading ? (
                <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {[0,1,2,3,4].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div className="skeleton-line" style={{ flex: 1, height: 13 }} />
                      <div className="skeleton-line" style={{ width: 56, height: 20 }} />
                      <div className="skeleton-line" style={{ width: 80, height: 13 }} />
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="empty-state">
                  <FileText size={34} strokeWidth={1.5} />
                  <div style={{ fontWeight: 600, fontSize: 14 }}>No post history yet</div>
                  <div style={{ fontSize: 12 }}>Posts will appear here once the bot runs</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50%' }}>Title</th>
                        <th>Status</th>
                        <th className="col-fbid">FB Post ID</th>
                        <th className="col-time">Time</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPosts.map(post => {
                        const cfg = statusConfig[post.status] ?? statusConfig.PENDING
                        const cleanTitle = stripHtml(post.title)
                        return (
                          <tr key={post.id}>
                            <td>
                              <div className="post-title-cell" title={cleanTitle}>{cleanTitle}</div>
                            </td>
                            <td>
                              <span className={`badge-status ${cfg.cls}`}>
                                <span style={{ width: 5, height: 5, background: cfg.dot, borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
                                {cfg.label}
                              </span>
                            </td>
                            <td className="col-fbid">
                              <span style={{ fontSize: 11.5, color: '#b0b5c9' }}>
                                {post.fbPostId ?? '—'}
                              </span>
                            </td>
                            <td className="col-time" style={{ color: '#8a8fa8', fontSize: 12, whiteSpace: 'nowrap' }}>
                              {formatDate(post.postedAt ?? post.createdAt)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                id={`delete-${post.id}`}
                                className="btn-delete"
                                onClick={() => setDeleteConfirmId(post.id)}
                                title="Delete post"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination UI */}
              {!postsLoading && posts.length > 0 && (
                <div style={{
                  padding: '12px 20px', borderTop: '1px solid #f0f2f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#fafbfc'
                }}>
                  <div style={{ fontSize: 12.5, color: '#8a8fa8' }}>
                    Showing {(currentPage - 1) * POSTS_PER_PAGE + 1} to {Math.min(currentPage * POSTS_PER_PAGE, posts.length)} of {posts.length}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-refresh"
                      style={{ padding: '6px 10px' }}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      className="btn-refresh"
                      style={{ padding: '6px 10px' }}
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════
            RSS FEEDS PAGE
        ═════════════════════════════════ */}
        {activePage === 'feeds' && (
          <div className="page-body">
            <div className="table-card" style={{ marginBottom: 20 }}>
              <div className="table-card-header">
                <div>
                  <div className="table-card-title">Active RSS Sources</div>
                  <div className="table-card-meta">{RSS_FEEDS.length} feeds configured</div>
                </div>
                <Rss size={15} color="#8a8fa8" />
              </div>
              <div style={{ padding: '8px 0' }}>
                {RSS_FEEDS.map((feed, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px', borderBottom: i < RSS_FEEDS.length - 1 ? '1px solid #f0f2f5' : 'none',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: '#fef2f2', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Rss size={16} color="#C8102E" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f1117' }}>{feed.name}</div>
                      <div style={{ fontSize: 11.5, color: '#b0b5c9', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {feed.url}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge-status badge-posted">
                        <span style={{ width: 5, height: 5, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
                        Active
                      </span>
                      <a href={feed.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', color: '#8a8fa8', transition: 'color 0.15s' }}
                        onMouseOver={e => (e.currentTarget.style.color = '#C8102E')}
                        onMouseOut={e => (e.currentTarget.style.color = '#8a8fa8')}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule info */}
            <div className="table-card">
              <div className="table-card-header">
                <div className="table-card-title">Posting Schedule</div>
              </div>
              <div style={{ padding: '6px 0' }}>
                {[
                  { time: '08:00', label: 'Morning Post', cron: '0 1 * * *' },
                  { time: '11:00', label: 'Late Morning', cron: '0 4 * * *' },
                  { time: '14:00', label: 'Afternoon Post', cron: '0 7 * * *' },
                  { time: '17:00', label: 'Evening Post', cron: '0 10 * * *' },
                  { time: '20:00', label: 'Prime Time', cron: '0 13 * * *' },
                  { time: '23:00', label: 'Night Post', cron: '0 16 * * *' },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '13px 20px', borderBottom: i < 5 ? '1px solid #f0f2f5' : 'none',
                  }}>
                    <div style={{
                      width: 52, textAlign: 'center', fontWeight: 700,
                      fontSize: 14, color: '#C8102E',
                    }}>
                      {s.time}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>{s.label}</div>
                      <div style={{ fontSize: 11.5, color: '#b0b5c9', fontFamily: 'monospace' }}>{s.cron}</div>
                    </div>
                    <span className="badge-status badge-posted">
                      <span style={{ width: 5, height: 5, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
                      Enabled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════
            ANALYTICS PAGE
        ═════════════════════════════════ */}
        {activePage === 'analytics' && (
          <div className="page-body">
            <div className="stats-grid" style={{ marginBottom: 20 }}>
              <div className="stat-card">
                <div className="stat-card-icon green"><CheckCircle size={18} /></div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Success Rate</div>
                  <div className="stat-card-value">
                    {stats && stats.total > 0
                      ? `${Math.round((stats.posted / stats.total) * 100)}%`
                      : '—'}
                  </div>
                  <div className="stat-card-sub">Posted / Total</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon blue"><BarChart2 size={18} /></div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Posted Today</div>
                  <div className="stat-card-value">{totalPostedToday}</div>
                  <div className="stat-card-sub">of 6 scheduled</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon amber"><Clock size={18} /></div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Pending Queue</div>
                  <div className="stat-card-value">{stats?.pending ?? 0}</div>
                  <div className="stat-card-sub">Awaiting</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon red"><XCircle size={18} /></div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Fail Rate</div>
                  <div className="stat-card-value">
                    {stats && stats.total > 0
                      ? `${Math.round(((stats.failed ?? 0) / stats.total) * 100)}%`
                      : '—'}
                  </div>
                  <div className="stat-card-sub">Failed / Total</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 20 }}>
              {/* Chart */}
              <div className="table-card">
                <div className="table-card-header">
                  <div className="table-card-title">Posts Over Time (Last 7 Days)</div>
                </div>
                <div style={{ padding: '20px', height: 300 }}>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8a8fa8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#8a8fa8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          itemStyle={{ fontSize: 12, fontWeight: 600 }}
                          labelStyle={{ fontSize: 11, color: '#8a8fa8', marginBottom: 4 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" iconSize={8} />
                        <Bar dataKey="POSTED" name="Posted" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="PENDING" name="Pending" stackId="a" fill="#d97706" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="FAILED" name="Failed" stackId="a" fill="#b91c1c" radius={[4, 4, 0, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state" style={{ height: '100%', padding: 0 }}>
                      <BarChart2 size={30} strokeWidth={1.5} />
                      <div style={{ fontSize: 13, marginTop: 8 }}>Not enough data for chart</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="table-card">
                <div className="table-card-header">
                  <div className="table-card-title">Status Breakdown</div>
                </div>
                {[
                  { label: 'Posted',  value: stats?.posted ?? 0,  color: '#16a34a', bg: '#dcfce7' },
                  { label: 'Pending', value: stats?.pending ?? 0, color: '#d97706', bg: '#fef9c3' },
                  { label: 'Failed',  value: stats?.failed ?? 0,  color: '#b91c1c', bg: '#fee2e2' },
                ].map((row, i) => {
                  const pct = stats?.total ? Math.round((row.value / stats.total) * 100) : 0
                  return (
                    <div key={i} style={{ padding: '16px 20px', borderBottom: i < 2 ? '1px solid #f0f2f5' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{row.label}</span>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: row.color }}>{row.value} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: '#f0f2f5', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`, background: row.color,
                          borderRadius: 99, transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════
            SETTINGS PAGE
        ═════════════════════════════════ */}
        {activePage === 'settings' && (
          <div className="page-body">
            <div className="table-card">
              <div className="table-card-header">
                <div className="table-card-title">Configuration</div>
                <div className="table-card-meta">Environment variables</div>
              </div>
              {[
                { key: 'PAGE_ID', label: 'Facebook Page ID', secret: false },
                { key: 'PAGE_ACCESS_TOKEN', label: 'FB Access Token', secret: true },
                { key: 'APP_ID', label: 'App ID', secret: false },
                { key: 'DATABASE_URL', label: 'Database URL', secret: true },
              ].map((item, i, arr) => (
                <div key={item.key} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid #f0f2f5' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, background: '#f8f9fb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Settings size={15} color="#8a8fa8" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.label}</div>
                    <div style={{ fontSize: 11.5, color: '#b0b5c9', fontFamily: 'monospace' }}>
                      {item.secret ? '●●●●●●●●●●●●' : item.key}
                    </div>
                  </div>
                  <span className="badge-status badge-posted">
                    <span style={{ width: 5, height: 5, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
                    Set
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}