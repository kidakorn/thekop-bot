import React from 'react'
import { Rss, ExternalLink, Clock } from 'lucide-react'

interface RssFeedsTabProps {
  RSS_FEEDS: { name: string; url: string }[]
  activeSchedules: { time: string; label: string; isReel: boolean; cron: string }[]
}

export default function RssFeedsTab({ RSS_FEEDS, activeSchedules }: RssFeedsTabProps) {
  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>
            <Rss size={22} color="#fff" />
          </div>
          <div>
            <div className="page-header-title">RSS Feeds</div>
            <div className="page-header-subtitle">แหล่งข่าวที่บอทใช้ดึงข้อมูลอัตโนมัติ</div>
          </div>
        </div>
      </div>

      <div className="table-card" style={{ marginBottom: 20 }}>
        <div className="table-card-header">
          <div>
            <div className="table-card-title">Active RSS Sources</div>
            <div className="table-card-meta">{RSS_FEEDS.length} feeds configured</div>
          </div>
          <span className="badge-status badge-posted">
            <span style={{ width: 5, height: 5, background: '#16a34a', borderRadius: '50%', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
            Live Pulling
          </span>
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
    </>
  )
}
