import React from 'react'
import { Search, ArrowUpDown, FileText, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Post } from '../../types'
import { stripHtml, formatDate, statusConfig } from '../../lib/utils'

interface PostHistoryProps {
  isMobile: boolean
  posts: Post[]
  postsLoading: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  sortOrder: 'desc' | 'asc'
  setSortOrder: React.Dispatch<React.SetStateAction<'desc' | 'asc'>>
  statusFilter: 'ALL' | 'POSTED' | 'PENDING' | 'FAILED'
  handleFilterChange: (f: 'ALL' | 'POSTED' | 'PENDING' | 'FAILED') => void
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  filteredPosts: Post[]
  currentPosts: Post[]
  totalPages: number
  POSTS_PER_PAGE: number
  setSelectedPost: (p: Post) => void
  setDeleteConfirmId: (id: string) => void
}

export default function PostHistory({
  isMobile,
  posts,
  postsLoading,
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
  statusFilter,
  handleFilterChange,
  currentPage,
  setCurrentPage,
  filteredPosts,
  currentPosts,
  totalPages,
  POSTS_PER_PAGE,
  setSelectedPost,
  setDeleteConfirmId
}: PostHistoryProps) {
  return (
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
          {[0, 1, 2, 3, 4].map(i => (
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
                <th className="col-fbid">Source</th>
                <th className="col-time">Time</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.map(post => {
                const cfg = statusConfig[post.status] ?? statusConfig.PENDING
                const cleanTitle = stripHtml(post.title)
                const sourceDomain = post.link ? (() => { try { return new URL(post.link).hostname.replace('www.', '') } catch { return null } })() : null
                const isPending = post.status === 'PENDING'
                return (
                  <tr key={post.id}
                    onClick={() => setSelectedPost(post)}
                    style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td>
                      <div className="post-title-cell" title={cleanTitle} style={{ fontWeight: 500 }}>{cleanTitle}</div>
                    </td>
                    <td>
                      <span className={`badge-status ${cfg.cls}`}>
                        <span style={{
                          width: 6, height: 6, background: cfg.dot, borderRadius: '50%',
                          display: 'inline-block', flexShrink: 0,
                          animation: isPending ? 'pulse-dot 1.5s infinite' : 'none'
                        }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="col-fbid">
                      {sourceDomain ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`https://www.google.com/s2/favicons?domain=${sourceDomain}&sz=16`} alt=""
                            width={14} height={14} style={{ borderRadius: 3, flexShrink: 0 }} />
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted-light)' }}>{sourceDomain}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted-light)' }}>—</span>
                      )}
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
  )
}