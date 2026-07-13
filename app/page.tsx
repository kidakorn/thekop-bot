'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'

// Hooks
import { usePosts } from '../hooks/usePosts'
import { useSettings } from '../hooks/useSettings'

// Components
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import StatsCards from '../components/dashboard/StatsCards'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import PostHistory from '../components/dashboard/PostHistory'
import RssFeedsTab from '../components/feeds/RssFeedsTab'
import AnalyticsTab from '../components/analytics/AnalyticsTab'
import SettingsTab from '../components/settings/SettingsTab'
import AffiliateTab from './AffiliateTab'
import Toast from '../components/ui/Toast'
import Modal from '../components/ui/Modal'

// Utils
import { stripHtml, formatDate, statusConfig } from '../lib/utils'
import { X, ExternalLink, FileText } from 'lucide-react'
import { Post } from '../types'

export type ActivePage = 'dashboard' | 'feeds' | 'analytics' | 'settings' | 'affiliate'

export default function DashboardPage() {
  const { data: session, status } = useSession({ required: true })

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activePage, setActivePage] = useState<ActivePage>('dashboard')

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [clock, setClock] = useState('')
  const [triggeringNews, setTriggeringNews] = useState(false)

  const {
    posts, stats, mutatePosts, mutateStats,
    searchQuery, setSearchQuery, sortOrder, setSortOrder,
    statusFilter, handleFilterChange, currentPage, setCurrentPage,
    filteredPosts, currentPosts, totalPages, POSTS_PER_PAGE, totalPostedToday, chartData, postsLoading
  } = usePosts()

  const { RSS_FEEDS, activeSchedules, mutateSettings } = useSettings()

  // Real-time clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme as 'light' | 'dark')
    if (savedTheme === 'dark') document.documentElement.classList.add('dark')
  }, [])

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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleTriggerNews() {
    setTriggeringNews(true)
    try {
      const res = await fetch('/api/run-news', { method: 'POST' })
      if (res.ok) {
        showToast('🚀 Bot started (News)', 'success')
      } else if (res.status === 401) {
        showToast('Session expired. Redirecting to login...', 'error')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        showToast('Failed to start', 'error')
      }
    } catch (e) { showToast('Server offline', 'error') }
    setTimeout(() => setTriggeringNews(false), 2000)
  }

  function handleRefresh() {
    mutateStats()
    mutatePosts()
    mutateSettings()
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

  const mainCls = [
    'main-content',
    !isMobile && collapsed ? 'sidebar-collapsed' : '',
    isMobile ? 'sidebar-mobile' : '',
  ].filter(Boolean).join(' ')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>

      <Toast toast={toast} />

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="sidebar-overlay visible" onClick={() => setMobileOpen(false)} />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <Modal title="ยืนยันการลบโพสต์" onClose={() => setDeleteConfirmId(null)} onConfirm={handleDelete} confirmText="ลบโพสต์" confirmType="danger">
          คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </Modal>
      )}

      <Sidebar
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        setMobileOpen={setMobileOpen}
        activePage={activePage}
        setActivePage={setActivePage}
        session={session}
        activeSchedulesCount={activeSchedules.length}
      />

      <main className={mainCls}>
        <Topbar
          theme={theme}
          toggleTheme={toggleTheme}
          clock={clock}
          triggeringNews={triggeringNews}
          handleTriggerNews={handleTriggerNews}
          isMobile={isMobile}
          setMobileOpen={setMobileOpen}
          activePage={activePage}
          totalPostedToday={totalPostedToday}
          handleRefresh={handleRefresh}
        />

        <AnimatePresence mode="wait">
          {activePage === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="page-body"
            >
              <StatsCards stats={stats} totalPostedToday={totalPostedToday} />

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 20 }}>
                <PostHistory
                  isMobile={isMobile}
                  posts={posts}
                  postsLoading={postsLoading}
                  filteredPosts={filteredPosts}
                  currentPosts={currentPosts}
                  POSTS_PER_PAGE={POSTS_PER_PAGE}
                  statusFilter={statusFilter}
                  searchQuery={searchQuery}
                  sortOrder={sortOrder}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  handleFilterChange={handleFilterChange}
                  setSearchQuery={setSearchQuery}
                  setSortOrder={setSortOrder}
                  setCurrentPage={setCurrentPage}
                  setSelectedPost={setSelectedPost}
                  setDeleteConfirmId={setDeleteConfirmId}
                />

                <PerformanceChart data={chartData} />
              </div>
            </motion.div>
          )}

          {activePage === 'feeds' && (
            <motion.div
              key="feeds"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="page-body"
            >
              <RssFeedsTab RSS_FEEDS={RSS_FEEDS} activeSchedules={activeSchedules} />
            </motion.div>
          )}

          {activePage === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="page-body"
            >
              <AnalyticsTab
                stats={stats}
                totalPostedToday={totalPostedToday}
                activeSchedules={activeSchedules}
                chartData={chartData}
                isMobile={isMobile}
              />
            </motion.div>
          )}

          {activePage === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="page-body"
            >
              <SettingsTab isMobile={isMobile} showToast={showToast} />
            </motion.div>
          )}

          {activePage === 'affiliate' && (
            <motion.div
              key="affiliate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="page-body"
            >
              <AffiliateTab />
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
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}} />
        </div>
      )}
    </div>
  )
}