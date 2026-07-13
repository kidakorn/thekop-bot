import React from 'react'
import { BarChart2, CheckCircle, Clock, XCircle } from 'lucide-react'
import { PostStats } from '../../types'

interface StatsCardsProps {
  stats?: PostStats
  totalPostedToday: number
}

export default function StatsCards({ stats, totalPostedToday }: StatsCardsProps) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
          <BarChart2 size={22} />
        </div>
        <div className="stat-content">
          <span className="stat-label">TOTAL POSTS</span>
          <span className="stat-value">{stats?.total ?? 0}</span>
          <span className="stat-desc">All time records</span>
        </div>
        <svg className="stat-line" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0,20 Q25,5 50,20 T100,10" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.3" />
        </svg>
      </div>
      <div className="stat-card highlight">
        <div className="stat-icon-wrapper" style={{ background: '#16a34a', color: '#fff' }}>
          <CheckCircle size={22} />
        </div>
        <div className="stat-content">
          <span className="stat-label">POSTED</span>
          <span className="stat-value">{stats?.posted ?? 0}</span>
          <span className="stat-desc" style={{ color: '#16a34a', fontWeight: 600 }}>
            ▲ {totalPostedToday} today
          </span>
        </div>
        <svg className="stat-line" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0,25 Q25,10 50,20 T100,5" fill="none" stroke="#16a34a" strokeWidth="2" opacity="0.4" />
        </svg>
      </div>
      <div className="stat-card">
        <div className="stat-icon-wrapper" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#d97706' }}>
          <Clock size={22} />
        </div>
        <div className="stat-content">
          <span className="stat-label">PENDING</span>
          <span className="stat-value">{stats?.pending ?? 0}</span>
          <span className="stat-desc">Awaiting publish</span>
        </div>
        <svg className="stat-line" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0,15 Q25,25 50,15 T100,15" fill="none" stroke="#d97706" strokeWidth="2" opacity="0.3" />
        </svg>
      </div>
      <div className="stat-card">
        <div className="stat-icon-wrapper" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
          <XCircle size={22} />
        </div>
        <div className="stat-content">
          <span className="stat-label">FAILED</span>
          <span className="stat-value">{stats?.failed ?? 0}</span>
          <span className="stat-desc">All clear ✓</span>
        </div>
        <svg className="stat-line" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0,28 Q25,25 50,28 T100,25" fill="none" stroke="#dc2626" strokeWidth="2" opacity="0.3" />
        </svg>
      </div>
    </div>
  )
}
