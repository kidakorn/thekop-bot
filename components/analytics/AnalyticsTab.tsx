import React from 'react'
import {
  BarChart2, CheckCircle, Clock, XCircle
} from 'lucide-react'
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'
import { PostStats } from '../../types'

interface AnalyticsTabProps {
  stats?: PostStats
  totalPostedToday: number
  activeSchedules: { time: string; label: string; isReel: boolean; cron: string }[]
  chartData: { date: string; POSTED: number; PENDING: number; FAILED: number }[]
  isMobile: boolean
}

export default function AnalyticsTab({ stats, totalPostedToday, activeSchedules, chartData, isMobile }: AnalyticsTabProps) {
  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
            <BarChart2 size={22} color="#fff" />
          </div>
          <div>
            <div className="page-header-title">Analytics</div>
            <div className="page-header-subtitle">ภาพรวมสถิติการโพสต์ทั้งหมด</div>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {/* Success Rate */}
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
            <CheckCircle size={20} color="#fff" />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">Success Rate</div>
            <div className="stat-card-value" style={{ fontSize: 30 }}>
              {stats && stats.total > 0 ? `${Math.round((stats.posted / stats.total) * 100)}%` : '—'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>Posted / Total</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', opacity: 0.5, width: 52 }}>
            <svg viewBox="0 0 100 30" style={{ width: '100%', height: 24, strokeWidth: 2.5, stroke: '#10b981', fill: 'none', strokeLinecap: 'round' }}><path d="M 0 25 Q 15 5, 35 22 T 70 8 T 100 12" /></svg>
          </div>
        </div>
        {/* Posted Today */}
        <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.35)' }}>
            <BarChart2 size={20} color="#fff" />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">Posted Today</div>
            <div className="stat-card-value" style={{ fontSize: 30 }}>{totalPostedToday}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>of {activeSchedules.length} scheduled</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', opacity: 0.5, width: 52 }}>
            <svg viewBox="0 0 100 30" style={{ width: '100%', height: 24, strokeWidth: 2.5, stroke: '#3b82f6', fill: 'none', strokeLinecap: 'round' }}><path d="M 0 20 Q 15 5, 30 25 T 60 10 T 90 20 L 100 15" /></svg>
          </div>
        </div>
        {/* Pending */}
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
            <Clock size={20} color="#fff" />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">Pending Queue</div>
            <div className="stat-card-value" style={{ fontSize: 30 }}>{stats?.pending ?? 0}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Awaiting publish</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', opacity: 0.5, width: 52 }}>
            <svg viewBox="0 0 100 30" style={{ width: '100%', height: 24, strokeWidth: 2.5, stroke: '#f59e0b', fill: 'none', strokeLinecap: 'round' }}><path d="M 0 18 C 15 25, 30 10, 45 5 C 60 18, 80 25, 100 15" /></svg>
          </div>
        </div>
        {/* Fail Rate */}
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}>
            <XCircle size={20} color="#fff" />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">Fail Rate</div>
            <div className="stat-card-value" style={{ fontSize: 30 }}>
              {stats && stats.total > 0 ? `${Math.round(((stats.failed ?? 0) / stats.total) * 100)}%` : '—'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Failed / Total</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', opacity: 0.5, width: 52 }}>
            <svg viewBox="0 0 100 30" style={{ width: '100%', height: 24, strokeWidth: 2.5, stroke: '#ef4444', fill: 'none', strokeLinecap: 'round' }}><path d="M 0 12 Q 20 28, 45 15 T 80 18 L 100 5" /></svg>
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
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.85} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.85} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.85} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
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
            { label: 'Posted', value: stats?.posted ?? 0, color: '#16a34a', bg: '#dcfce7' },
            { label: 'Pending', value: stats?.pending ?? 0, color: '#d97706', bg: '#fef9c3' },
            { label: 'Failed', value: stats?.failed ?? 0, color: '#b91c1c', bg: '#fee2e2' },
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
    </>
  )
}
