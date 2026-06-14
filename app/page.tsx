'use client'

import { useState, useEffect, JSX } from 'react'
import useSWR from 'swr'
import {
  BarChart2, CheckCircle, XCircle, Clock, RefreshCw,
  LayoutDashboard, Settings, Rss, Activity, Trash2,
  FileText, TrendingUp, Radio, ChevronLeft, Menu, X,
  ExternalLink, ChevronRight, Moon, Sun, Search, ArrowUpDown, Filter, Play, Pause, AlertTriangle
} from 'lucide-react'
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
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
  content?: string
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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [logFilter, setLogFilter] = useState<'ALL' | 'ERROR' | 'SUCCESS'>('ALL')
  const [autoScrollLogs, setAutoScrollLogs] = useState(true)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme as 'light' | 'dark')
    if (savedTheme === 'dark') document.documentElement.classList.add('dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }
  
  const [triggeringNews, setTriggeringNews] = useState(false)

  async function handleTriggerNews() {
    setTriggeringNews(true)
    try {
      const res = await fetch('/api/run-news', { method: 'POST' })
      if (res.ok) showToast('🚀 Bot started (News)', 'success')
      else showToast('Failed to start', 'error')
    } catch(e) { showToast('Server offline', 'error') }
    setTimeout(() => setTriggeringNews(false), 2000)
  }

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

  const { data: settingsData, mutate: mutateSettings } =
    useSWR<{ pageId?: string; pageAccessToken?: string; news_schedule: string[]; rss_feeds?: {name: string, url: string}[], disable_ai?: boolean }>('/api/settings', fetcher)

  const [editedPageId, setEditedPageId] = useState('')
  const [editedPageAccessToken, setEditedPageAccessToken] = useState('')
  const [editedNews, setEditedNews] = useState<string[]>([])
  const [editedFeeds, setEditedFeeds] = useState<{name: string, url: string}[]>([])
  const [editedDisableAi, setEditedDisableAi] = useState<boolean>(false)
  const [newNewsTime, setNewNewsTime] = useState('12:00')
  const [newFeedName, setNewFeedName] = useState('')
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [showTutorialModal, setShowTutorialModal] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (settingsData) {
      setEditedPageId(settingsData.pageId || '')
      setEditedPageAccessToken(settingsData.pageAccessToken || '')
      setEditedNews(settingsData.news_schedule || [])
      if (settingsData.rss_feeds) {
        setEditedFeeds(settingsData.rss_feeds)
      }
      if (typeof settingsData.disable_ai === 'boolean') {
        setEditedDisableAi(settingsData.disable_ai)
      }
    }
  }, [settingsData])
  /* eslint-enable react-hooks/set-state-in-effect */

  function addNewsTime() {
    if (!editedNews.includes(newNewsTime)) {
      setEditedNews([...editedNews, newNewsTime].sort())
    } else {
      showToast('เวลานี้มีอยู่ในตารางอยู่แล้ว', 'error')
    }
  }

  function removeNewsTime(time: string) {
    setEditedNews(editedNews.filter(t => t !== time))
  }

  function addFeed() {
    if (newFeedName.trim() && newFeedUrl.trim()) {
      setEditedFeeds([...editedFeeds, { name: newFeedName.trim(), url: newFeedUrl.trim() }])
      setNewFeedName('')
      setNewFeedUrl('')
    } else {
      showToast('กรุณากรอกชื่อและ URL ให้ครบถ้วน', 'error')
    }
  }

  function removeFeed(index: number) {
    setEditedFeeds(editedFeeds.filter((_, i) => i !== index))
  }

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: editedPageId,
          pageAccessToken: editedPageAccessToken,
          news_schedule: editedNews,
          rss_feeds: editedFeeds,
          disable_ai: editedDisableAi
        })
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.error ?? 'Failed to save settings', 'error')
        return
      }

      mutateSettings()
      showToast('บันทึกตั้งค่าตารางเวลาเรียบร้อยแล้ว', 'success')
    } catch (err) {
      console.error(err)
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  const activeSchedules = (() => {
    const news = settingsData?.news_schedule ?? ['08:00', '11:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
    
    const items: { time: string; label: string; isReel: boolean; cron: string }[] = []
    
    news.forEach(time => {
      const [h, m] = time.split(':')
      items.push({
        time,
        label: `${parseInt(h) < 12 ? 'Morning' : parseInt(h) < 17 ? 'Afternoon' : 'Evening'} News`,
        isReel: false,
        cron: `${parseInt(m)} ${parseInt(h)} * * * (Asia/Bangkok)`
      })
    })

    return items.sort((a, b) => a.time.localeCompare(b.time))
  })()

  const totalPostedToday = posts.filter(p => {
    return p.status === 'POSTED' && new Date(p.createdAt).toDateString() === new Date().toDateString()
  }).length

  function handleRefresh() { mutateStats(); mutatePosts(); mutateSettings() }

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

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'POSTED' | 'PENDING' | 'FAILED'>('ALL')

  function handleFilterChange(f: 'ALL' | 'POSTED' | 'PENDING' | 'FAILED') {
    setStatusFilter(f)
    setCurrentPage(1)
  }

  // Filter posts
  const filteredPosts = posts.filter(p => {
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || (p.fbPostId && p.fbPostId.includes(searchQuery))
    return matchStatus && matchSearch
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE))
  const currentPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)

  // Analytics Data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      name: format(d, 'dd MMM', { locale: th }),
      dateStr: format(d, 'yyyy-MM-dd'),
      Posted: 0,
      Failed: 0,
    }
  })

  posts.forEach(p => {
    const dStr = format(new Date(p.createdAt), 'yyyy-MM-dd')
    const dayData = last7Days.find(d => d.dateStr === dStr)
    if (dayData) {
      if (p.status === 'POSTED') dayData.Posted++
      else if (p.status === 'FAILED') dayData.Failed++
    }
  })

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

  const RSS_FEEDS = settingsData?.rss_feeds || [
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
          color: 'var(--bg-card)', padding: '12px 20px', borderRadius: 8,
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
            background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '90%', maxWidth: 360,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'slideUp 0.2s ease-out'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trash2 color="#C8102E" size={20} />
              ยืนยันการลบโพสต์
            </h3>
            <p style={{ fontSize: 14, color: '#4a4f6a', marginBottom: 24 }}>
              คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#4a4f6a', background: 'var(--border-light)', border: 'none', cursor: 'pointer' }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'var(--bg-card)', background: '#C8102E', border: 'none', cursor: 'pointer' }}
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
              <small>Runs {activeSchedules.length}× / day</small>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={mainCls} style={{ flex: 1 }}>
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
            <button onClick={toggleTheme} className="btn-refresh" style={{ padding: '8px', borderRadius: '50%' }} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
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

        <AnimatePresence mode="wait">
        {/* ═════════════════════════════════
            DASHBOARD PAGE
        ═════════════════════════════════ */}
        {activePage === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="page-body"
          >
            {/* Manual Trigger Actions */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button
                onClick={handleTriggerNews}
                disabled={triggeringNews}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'var(--bg-card)', border: 'none', borderRadius: 8, padding: '10px 18px',
                  fontWeight: 600, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 12px rgba(16,185,129,0.25)', transition: 'all 0.2s',
                  opacity: triggeringNews ? 0.7 : 1
                }}
              >
                {triggeringNews ? <RefreshCw size={15} className="animate-spin" /> : <Radio size={15} />}
                Force Run News
              </button>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              {statsLoading ? (
                [0,1,2,3].map(i => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.5)', height: 88 }}>
                    <div className="skeleton-line" style={{ height: 11, width: '50%', marginBottom: 10 }} />
                    <div className="skeleton-line" style={{ height: 26, width: '35%' }} />
                  </div>
                ))
              ) : (
                <>
                  <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div className="stat-card-icon blue" style={{ background: 'rgba(59, 130, 246, 0.08)' }}><BarChart2 size={18} /></div>
                    <div className="stat-card-content">
                      <div className="stat-card-label">Total Posts</div>
                      <div className="stat-card-value">{stats?.total ?? 0}</div>
                      <div className="stat-card-sub">All time records</div>
                    </div>
                    <div style={{ marginLeft: 'auto', alignSelf: 'center', opacity: 0.6, width: 48 }}>
                      <svg viewBox="0 0 100 30" style={{ width: '100%', height: 20, strokeWidth: 2, stroke: '#3b82f6', fill: 'none', strokeLinecap: 'round' }}>
                        <path d="M 0 20 Q 15 5, 30 25 T 60 10 T 100 15" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div className="stat-card-icon green" style={{ background: 'rgba(16, 185, 129, 0.08)' }}><CheckCircle size={18} /></div>
                    <div className="stat-card-content">
                      <div className="stat-card-label">Posted</div>
                      <div className="stat-card-value">{stats?.posted ?? 0}</div>
                      <div className="stat-card-sub">{totalPostedToday} today</div>
                    </div>
                    <div style={{ marginLeft: 'auto', alignSelf: 'center', opacity: 0.6, width: 48 }}>
                      <svg viewBox="0 0 100 30" style={{ width: '100%', height: 20, strokeWidth: 2, stroke: '#10b981', fill: 'none', strokeLinecap: 'round' }}>
                        <path d="M 0 25 Q 15 5, 35 22 T 70 8 T 100 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div className="stat-card-icon amber" style={{ background: 'rgba(245, 158, 11, 0.08)' }}><Clock size={18} /></div>
                    <div className="stat-card-content">
                      <div className="stat-card-label">Pending</div>
                      <div className="stat-card-value">{stats?.pending ?? 0}</div>
                      <div className="stat-card-sub">Awaiting publish</div>
                    </div>
                    <div style={{ marginLeft: 'auto', alignSelf: 'center', opacity: 0.6, width: 48 }}>
                      <svg viewBox="0 0 100 30" style={{ width: '100%', height: 20, strokeWidth: 2, stroke: '#f59e0b', fill: 'none', strokeLinecap: 'round' }}>
                        <path d="M 0 18 C 15 25, 30 10, 45 5 C 60 18, 80 25, 100 15" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <div className="stat-card-icon red" style={{ background: 'rgba(239, 68, 68, 0.08)' }}><XCircle size={18} /></div>
                    <div className="stat-card-content">
                      <div className="stat-card-label">Failed</div>
                      <div className="stat-card-value">{stats?.failed ?? 0}</div>
                      <div className="stat-card-sub">Need attention</div>
                    </div>
                    <div style={{ marginLeft: 'auto', alignSelf: 'center', opacity: 0.6, width: 48 }}>
                      <svg viewBox="0 0 100 30" style={{ width: '100%', height: 20, strokeWidth: 2, stroke: '#ef4444', fill: 'none', strokeLinecap: 'round' }}>
                        <path d="M 0 12 Q 20 28, 45 15 T 80 18 L 100 5" />
                      </svg>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Advanced Analytics */}
            <div className="table-card" style={{ marginBottom: 24, padding: 20 }}>
              <div className="table-card-title" style={{ marginBottom: 16 }}>Last 7 Days Performance</div>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <RechartsTooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 8, fontSize: 12, color: 'var(--text-main)' }}
                      cursor={{ fill: 'var(--bg-hover)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Posted" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={32} />
                    <Bar dataKey="Failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Post History Table */}
            <div className="table-card">
              <div className="table-card-header" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: 12 }}>
                <div>
                  <div className="table-card-title">Post History</div>
                  <div className="table-card-meta">{filteredPosts.length} matches of {posts.length} records</div>
                </div>
                
                <div style={{ display: 'flex', gap: 12, marginLeft: isMobile ? 0 : 'auto', alignSelf: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Search Bar */}
                  <div style={{ position: 'relative' }}>
                    <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      placeholder="Search title..." 
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      style={{
                        padding: '6px 10px 6px 30px', borderRadius: 8, border: '1px solid var(--border-main)',
                        background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 13, outline: 'none',
                        width: isMobile ? '100%' : '180px'
                      }}
                    />
                  </div>

                  {/* Sort Toggle */}
                  <button
                    onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
                    className="btn-refresh"
                    style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ArrowUpDown size={14} />
                    {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                  </button>

                  {/* Status Filters */}
                  <div style={{
                    display: 'flex', gap: 4, background: 'var(--bg-main)', padding: 4, borderRadius: 10,
                  }}>
                    {(['ALL', 'POSTED', 'PENDING', 'FAILED'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => handleFilterChange(f)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                          border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                          background: statusFilter === f ? 'var(--bg-card)' : 'transparent',
                          color: statusFilter === f
                            ? (f === 'POSTED' ? '#16a34a' : f === 'FAILED' ? '#ef4444' : f === 'PENDING' ? '#d97706' : 'var(--text-main)')
                            : 'var(--text-muted)',
                          boxShadow: statusFilter === f ? '0 1px 3px var(--glass-shadow)' : 'none'
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
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
              ) : filteredPosts.length === 0 ? (
                <div className="empty-state">
                  <FileText size={34} strokeWidth={1.5} />
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{posts.length === 0 ? 'No post history yet' : 'No matching records'}</div>
                  <div style={{ fontSize: 12 }}>{posts.length === 0 ? 'Posts will appear here once the bot runs' : 'Try selecting a different filter'}</div>
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
                          <tr key={post.id} onClick={() => setSelectedPost(post)} style={{ cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f9fafb'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
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
                              <span style={{ fontSize: 11.5, color: 'var(--text-muted-light)' }}>
                                {post.fbPostId ?? '—'}
                              </span>
                            </td>
                            <td className="col-time" style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                              {formatDate(post.postedAt ?? post.createdAt)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                id={`delete-${post.id}`}
                                className="btn-delete"
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(post.id); }}
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
              {!postsLoading && filteredPosts.length > 0 && (
                <div style={{
                  padding: '12px 20px', borderTop: '1px solid var(--border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--bg-main)'
                }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    Showing {(currentPage - 1) * POSTS_PER_PAGE + 1} to {Math.min(currentPage * POSTS_PER_PAGE, filteredPosts.length)} of {filteredPosts.length}
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
          </motion.div>
        )}

        {/* ═════════════════════════════════
            RSS FEEDS PAGE
        ═════════════════════════════════ */}
        {activePage === 'feeds' && (
          <motion.div 
            key="feeds"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="page-body"
          >
            <div className="table-card" style={{ marginBottom: 20 }}>
              <div className="table-card-header">
                <div>
                  <div className="table-card-title">Active RSS Sources</div>
                  <div className="table-card-meta">{RSS_FEEDS.length} feeds configured</div>
                </div>
                <Rss size={15} color="var(--text-muted)" />
              </div>
              <div style={{ padding: '8px 0' }}>
                {RSS_FEEDS.map((feed, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px', borderBottom: i < RSS_FEEDS.length - 1 ? '1px solid var(--border-light)' : 'none',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: '#fef2f2', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Rss size={16} color="#C8102E" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-strong)' }}>{feed.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted-light)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {feed.url}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge-status badge-posted">
                        <span style={{ width: 5, height: 5, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
                        Active
                      </span>
                      <a href={feed.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', transition: 'color 0.15s' }}
                        onMouseOver={e => (e.currentTarget.style.color = '#C8102E')}
                        onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
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
                {activeSchedules.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 0' }}>
                    <Clock size={30} strokeWidth={1.5} />
                    <div style={{ fontSize: 13, marginTop: 8 }}>ไม่มีกำหนดเวลาโพสต์ในขณะนี้</div>
                  </div>
                ) : (
                  activeSchedules.map((s, i, arr) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '13px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none',
                    }}>
                      <div style={{
                        width: 52, textAlign: 'center', fontWeight: 700,
                        fontSize: 14, color: s.isReel ? '#7c3aed' : '#C8102E',
                      }}>
                        {s.time}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {s.label}
                          {s.isReel && <span style={{ fontSize: 10, padding: '2px 6px', background: '#ede9fe', color: '#7c3aed', borderRadius: 4, fontWeight: 600 }}>REEL</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted-light)', fontFamily: 'monospace' }}>{s.cron}</div>
                      </div>
                      <span className="badge-status badge-posted">
                        <span style={{ width: 5, height: 5, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
                        Enabled
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═════════════════════════════════
            ANALYTICS PAGE
        ═════════════════════════════════ */}
        {activePage === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="page-body"
          >
            <div className="stats-grid" style={{ marginBottom: 20 }}>
              <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                <div className="stat-card-icon green" style={{ background: 'rgba(16, 185, 129, 0.08)' }}><CheckCircle size={18} /></div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Success Rate</div>
                  <div className="stat-card-value">
                    {stats && stats.total > 0
                      ? `${Math.round((stats.posted / stats.total) * 100)}%`
                      : '—'}
                  </div>
                  <div className="stat-card-sub">Posted / Total</div>
                </div>
                <div style={{ marginLeft: 'auto', alignSelf: 'center', opacity: 0.6, width: 48 }}>
                  <svg viewBox="0 0 100 30" style={{ width: '100%', height: 20, strokeWidth: 2, stroke: '#10b981', fill: 'none', strokeLinecap: 'round' }}>
                    <path d="M 0 25 Q 15 5, 35 22 T 70 8 T 100 12" />
                  </svg>
                </div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                <div className="stat-card-icon blue" style={{ background: 'rgba(59, 130, 246, 0.08)' }}><BarChart2 size={18} /></div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Posted Today</div>
                  <div className="stat-card-value">{totalPostedToday}</div>
                  <div className="stat-card-sub">of {activeSchedules.length} scheduled</div>
                </div>
                <div style={{ marginLeft: 'auto', alignSelf: 'center', opacity: 0.6, width: 48 }}>
                  <svg viewBox="0 0 100 30" style={{ width: '100%', height: 20, strokeWidth: 2, stroke: '#3b82f6', fill: 'none', strokeLinecap: 'round' }}>
                    <path d="M 0 20 Q 15 5, 30 25 T 60 10 T 90 20 L 100 15" />
                  </svg>
                </div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div className="stat-card-icon amber" style={{ background: 'rgba(245, 158, 11, 0.08)' }}><Clock size={18} /></div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Pending Queue</div>
                  <div className="stat-card-value">{stats?.pending ?? 0}</div>
                  <div className="stat-card-sub">Awaiting publish</div>
                </div>
                <div style={{ marginLeft: 'auto', alignSelf: 'center', opacity: 0.6, width: 48 }}>
                  <svg viewBox="0 0 100 30" style={{ width: '100%', height: 20, strokeWidth: 2, stroke: '#f59e0b', fill: 'none', strokeLinecap: 'round' }}>
                    <path d="M 0 18 C 15 25, 30 10, 45 5 C 60 18, 80 25, 100 15" />
                  </svg>
                </div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                <div className="stat-card-icon red" style={{ background: 'rgba(239, 68, 68, 0.08)' }}><XCircle size={18} /></div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Fail Rate</div>
                  <div className="stat-card-value">
                    {stats && stats.total > 0
                      ? `${Math.round(((stats.failed ?? 0) / stats.total) * 100)}%`
                      : '—'}
                  </div>
                  <div className="stat-card-sub">Failed / Total</div>
                </div>
                <div style={{ marginLeft: 'auto', alignSelf: 'center', opacity: 0.6, width: 48 }}>
                  <svg viewBox="0 0 100 30" style={{ width: '100%', height: 20, strokeWidth: 2, stroke: '#ef4444', fill: 'none', strokeLinecap: 'round' }}>
                    <path d="M 0 12 Q 20 28, 45 15 T 80 18 L 100 5" />
                  </svg>
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
                        <defs>
                          <linearGradient id="colorPosted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.85}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                          </linearGradient>
                          <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.85}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                          </linearGradient>
                          <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.85}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}
                          itemStyle={{ fontSize: 12, fontWeight: 600 }}
                          labelStyle={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" iconSize={8} />
                        <Bar dataKey="POSTED" name="Posted" stackId="a" fill="url(#colorPosted)" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="PENDING" name="Pending" stackId="a" fill="url(#colorPending)" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="FAILED" name="Failed" stackId="a" fill="url(#colorFailed)" radius={[4, 4, 0, 0]} />
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
                    <div key={i} style={{ padding: '16px 20px', borderBottom: i < 2 ? '1px solid var(--border-light)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{row.label}</span>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: row.color }}>{row.value} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: '#eef2f6', borderRadius: 99, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: `linear-gradient(90deg, ${row.color} 0%, ${row.color}cc 100%)`,
                          borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═════════════════════════════════
            SETTINGS PAGE
        ═════════════════════════════════ */}
        {activePage === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="page-body"
          >
            <div className="table-card" style={{ marginBottom: 20 }}>
              <div className="table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="table-card-title">AI Generation</div>
                  <div className="table-card-meta">Enable or disable all AI APIs (Text, Image, Video, Voice) to save quota.</div>
                </div>
                <button
                  onClick={async () => {
                    const newVal = !editedDisableAi
                    setEditedDisableAi(newVal)
                    try {
                      await fetch('/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          news_schedule: editedNews,
                          rss_feeds: editedFeeds,
                          disable_ai: newVal
                        })
                      })
                      mutateSettings()
                      showToast(newVal ? 'AI Generation Disabled' : 'AI Generation Enabled', 'success')
                    } catch(e) {
                      showToast('Failed to save AI setting', 'error')
                    }
                  }}
                  style={{
                    background: editedDisableAi ? 'var(--bg-hover)' : '#16a34a',
                    color: editedDisableAi ? 'var(--text-main)' : '#fff',
                    border: '1px solid var(--border-light)',
                    padding: '8px 16px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {editedDisableAi ? 'AI Disabled' : 'AI Enabled'}
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: editedDisableAi ? '#ef4444' : '#fff'
                  }} />
                </button>
              </div>
            </div>

            <div className="table-card" style={{ marginBottom: 20 }}>
              <div className="table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="table-card-title">Facebook Page Integration</div>
                  <div className="table-card-meta">ตั้งค่า Facebook Page ID และ Access Token ของเพจคุณ</div>
                </div>
                <button 
                  onClick={() => setShowTutorialModal(true)}
                  style={{
                    background: 'var(--bg-hover)', color: '#3b82f6', border: '1px solid #3b82f633',
                    padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  วิธีดึง Token
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Facebook Page ID</label>
                    <input 
                      type="text"
                      value={editedPageId}
                      onChange={e => setEditedPageId(e.target.value)}
                      placeholder="e.g. 123456789012345"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-main)',
                        background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14, outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Page Access Token (Long-lived)</label>
                    <input 
                      type="password"
                      value={editedPageAccessToken}
                      onChange={e => setEditedPageAccessToken(e.target.value)}
                      placeholder="EAACBGZCmVi..."
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-main)',
                        background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14, outline: 'none'
                      }}
                    />
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
                      Token จะต้องเป็นแบบไม่มีวันหมดอายุ และมีสิทธิ์ pages_manage_posts, pages_read_engagement
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RSS Feeds Settings Card */}
            <div className="table-card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Rss size={18} color="#f59e0b" />
                แหล่งที่มาของข่าว (RSS Sources)
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 18 }}>ตั้งค่า RSS Feed สำหรับให้บอทดึงข่าวอัตโนมัติ</p>

              {/* Add new feed row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="ชื่อแหล่งข่าว (เช่น BBC Sport)"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-main)',
                    outline: 'none', background: 'var(--bg-hover)', fontSize: 14, flex: '1 1 200px'
                  }}
                />
                <input
                  type="url"
                  placeholder="RSS URL (เช่น https://.../rss.xml)"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-main)',
                    outline: 'none', background: 'var(--bg-hover)', fontSize: 14, flex: '2 1 300px'
                  }}
                />
                <button
                  onClick={addFeed}
                  className="btn-refresh"
                  style={{ background: '#f59e0b', color: 'var(--bg-card)', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                >
                  เพิ่มแหล่งข่าว
                </button>
              </div>

              {/* Feeds list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {editedFeeds.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', width: '100%', textAlign: 'center', padding: '12px 0' }}>ไม่มีแหล่งข่าวในระบบ</div>
                ) : (
                  editedFeeds.map((feed, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      background: 'var(--bg-card)', border: '1px solid var(--border-main)',
                      borderRadius: 8, padding: '12px 16px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{feed.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feed.url}</div>
                      </div>
                      <button
                        onClick={() => removeFeed(idx)}
                        style={{
                          background: '#fef2f2', color: '#C8102E', border: 'none', borderRadius: 6,
                          padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0
                        }}
                      >
                        ลบ
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Scheduler settings card */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* News Schedule Card */}
              <div className="table-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Radio size={18} color="#C8102E" />
                  ตารางเวลาโพสต์ข่าว (News Schedule)
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 18 }}>ตั้งค่าช่วงเวลาโพสต์คอนเทนต์ข่าวลิเวอร์พูลปกติ</p>

                {/* Add new time row */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    type="time"
                    value={newNewsTime}
                    onChange={(e) => setNewNewsTime(e.target.value)}
                    style={{
                      padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-main)',
                      outline: 'none', background: 'var(--bg-hover)', fontSize: 14, flex: 1
                    }}
                  />
                  <button
                    onClick={addNewsTime}
                    className="btn-refresh"
                    style={{ background: '#C8102E', color: 'var(--bg-card)', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    เพิ่มเวลา
                  </button>
                </div>

                {/* Times list */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {editedNews.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', width: '100%', textAlign: 'center', padding: '12px 0' }}>ไม่มีกำหนดเวลาโพสต์ข่าว</div>
                  ) : (
                    editedNews.map(time => (
                      <span key={time} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#fef2f2', color: '#C8102E', border: '1px solid #fee2e2',
                        borderRadius: 6, padding: '5px 10px', fontSize: 13, fontWeight: 600
                      }}>
                        {time}
                        <button
                          onClick={() => removeNewsTime(time)}
                          style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', display: 'flex', padding: 0 }}
                          title="Remove time"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Save Button Card */}
            <div className="table-card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                disabled={savingSettings}
                onClick={handleSaveSettings}
                className="btn-refresh"
                style={{
                  background: '#C8102E', color: 'var(--bg-card)', border: 'none',
                  borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', opacity: savingSettings ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : null}
                บันทึกกำหนดเวลาทั้งหมด
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Post Details Slide-Over Drawer */}
      {selectedPost && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          zIndex: 100, display: 'flex', justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setSelectedPost(null)}>
          <div style={{
            width: '100%', maxWidth: 450, background: 'var(--bg-card)',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
            height: '100%', overflowY: 'auto',
            animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex', flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border-light)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 10
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>POST DETAILS</div>
                  <span className={`badge-status ${statusConfig[selectedPost.status]?.cls ?? 'badge-pending'}`}>
                    <span style={{ width: 5, height: 5, background: statusConfig[selectedPost.status]?.dot ?? '#d97706', borderRadius: '50%', display: 'inline-block' }} />
                    {statusConfig[selectedPost.status]?.label ?? 'Pending'}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.4 }}>
                  {stripHtml(selectedPost.title)}
                </h2>
              </div>
              <button onClick={() => setSelectedPost(null)} style={{ background: 'var(--border-light)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24, flex: 1 }}>
              {/* Timeline / Meta info */}
              <div style={{ background: 'var(--bg-hover)', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid var(--border-main)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>CREATED AT</div>
                    <div style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 500 }}>{formatDate(selectedPost.createdAt)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>POSTED AT</div>
                    <div style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 500 }}>{selectedPost.postedAt ? formatDate(selectedPost.postedAt) : '—'}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>FACEBOOK POST ID</div>
                    <div style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 500, fontFamily: 'monospace' }}>{selectedPost.fbPostId || 'Not posted yet'}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                {selectedPost.fbPostId && (
                  <a href={`https://facebook.com/${selectedPost.fbPostId}`} target="_blank" rel="noreferrer" style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#1877F2', color: 'var(--bg-card)', textDecoration: 'none', padding: '10px 0',
                    borderRadius: 8, fontWeight: 600, fontSize: 13.5, transition: 'opacity 0.2s'
                  }} onMouseOver={e => e.currentTarget.style.opacity = '0.9'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                    <ExternalLink size={15} /> View on FB
                  </a>
                )}
                {selectedPost.link && (
                  <a href={selectedPost.link} target="_blank" rel="noreferrer" style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'var(--bg-card)', color: 'var(--text-main)', textDecoration: 'none', padding: '10px 0',
                    borderRadius: 8, fontWeight: 600, fontSize: 13.5, border: '1px solid var(--border-main)', transition: 'background 0.2s'
                  }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg-card)'}>
                    <ExternalLink size={15} /> Source
                  </a>
                )}
              </div>

              {/* Thai Summary Content */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color="#C8102E" />
                  Thai Summary
                </div>
                {selectedPost.content ? (
                  <div style={{
                    fontSize: 14.5, color: '#374151', lineHeight: 1.7, background: 'var(--bg-card)',
                    padding: 16, borderRadius: 12, border: '1px solid var(--border-main)', whiteSpace: 'pre-wrap'
                  }}>
                    {selectedPost.content}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 0' }}>
                    No content available for this post.
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-main)' }}>
              <button
                onClick={() => setSelectedPost(null)}
                style={{
                  width: '100%', padding: '12px 0', background: 'var(--bg-card)', border: '1px solid var(--border-main)',
                  borderRadius: 8, fontWeight: 600, fontSize: 14, color: 'var(--text-main)', cursor: 'pointer'
                }}
              >
                Close Drawer
              </button>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}} />
        </div>
      )}
      {/* Tutorial Modal */}
      {showTutorialModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border-main)'
          }}>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>วิธีเอา Facebook Page Token (ไม่มีวันหมดอายุ)</h3>
              <button onClick={() => setShowTutorialModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 24, fontSize: 14, color: 'var(--text-main)', lineHeight: 1.6 }}>
              <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <li>
                  <strong>ไปที่ Facebook Developers</strong>
                  <div>เข้าเว็บ <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>developers.facebook.com</a> สร้าง App เลือกประเภทเป็น <b>Business</b></div>
                </li>
                <li>
                  <strong>เพิ่มผลิตภัณฑ์ Facebook Login for Business</strong>
                  <div>ในหน้า App Dashboard เลือก Add Product &gt; <b>Facebook Login for Business</b></div>
                </li>
                <li>
                  <strong>สร้าง Short-lived Token</strong>
                  <div>ไปที่ <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Graph API Explorer</a></div>
                  <ul style={{ paddingLeft: 20, marginTop: 4, color: 'var(--text-muted)' }}>
                    <li>เลือก Facebook App ของคุณ</li>
                    <li>ตรง User or Page เลือก <b>"Get Page Access Token"</b> (เลือกเพจของคุณ)</li>
                    <li>เพิ่ม Permissions: <code>pages_manage_posts</code>, <code>pages_read_engagement</code></li>
                    <li>กด <b>Generate Access Token</b> (ก็อปปี้ไว้)</li>
                  </ul>
                </li>
                <li>
                  <strong>แปลงเป็น Long-lived Token (อยู่ได้ 60 วัน)</strong>
                  <div>ไปที่แถบเครื่องมือ <b>Access Token Debugger</b> เอา Token ที่ได้ไปวางแล้วกด <b>Extend Access Token</b></div>
                </li>
                <li>
                  <strong>แปลงเป็น Permanent Token (ไม่มีวันหมดอายุ)</strong>
                  <div style={{ background: 'var(--bg-main)', padding: 12, borderRadius: 8, marginTop: 8, fontFamily: 'monospace', fontSize: 12, overflowX: 'auto', border: '1px solid var(--border-light)' }}>
                    https://graph.facebook.com/v19.0/<b>&#123;PAGE_ID&#125;</b>?fields=access_token&access_token=<b>&#123;LONG_LIVED_TOKEN_จากข้อ4&#125;</b>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    เอา URL ด้านบนไปเปิดในเบราว์เซอร์ (แก้ค่าในวงเล็บให้ถูกต้อง) <br/>
                    คุณจะได้ JSON กลับมา มี <code>"access_token"</code> ที่ <b>"ไม่มีวันหมดอายุ"</b> เอาค่านั้นมาใส่ในระบบได้เลย! 🎉
                  </div>
                </li>
              </ol>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTutorialModal(false)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                เข้าใจแล้ว ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}