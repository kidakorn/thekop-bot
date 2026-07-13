import React from 'react'
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'

export interface PerformanceData {
  date: string
  POSTED: number
  PENDING: number
  FAILED: number
}

interface PerformanceChartProps {
  data: PerformanceData[]
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <div className="table-card" style={{ marginBottom: 24, padding: 20 }}>
      <div className="table-card-title" style={{ marginBottom: 16 }}>Last 7 Days Performance</div>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <RechartsTooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 8, fontSize: 12, color: 'var(--text-main)' }}
              cursor={{ fill: 'var(--bg-hover)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="POSTED" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={32} />
            <Bar dataKey="FAILED" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
