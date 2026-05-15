'use client'

import useSWR from 'swr'
import { BarChart2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { StatsCard } from '../components/dashboard/StatsCard'
import { PostHistory } from '../components/dashboard/PostHistory'
import { PostStats } from '../types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Post {
  id: string
  title: string
  status: string
  fbPostId: string | null
  postedAt: string | null
  createdAt: string
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useSWR<PostStats>('/api/stats', fetcher, {
    refreshInterval: 30000,
  })

  const { data: posts, isLoading: postsLoading } = useSWR<Post[]>('/api/posts', fetcher, {
    refreshInterval: 30000,
  })

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-primary-red flex items-center justify-center">
          <BarChart2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-dark-bg">The Kop Bot</h1>
          <p className="text-sm text-base-content/60">Auto-posting dashboard</p>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Total Posts" value={stats?.total ?? 0} icon={BarChart2} variant="info" />
          <StatsCard title="Posted" value={stats?.posted ?? 0} icon={CheckCircle} variant="success" />
          <StatsCard title="Pending" value={stats?.pending ?? 0} icon={Clock} variant="warning" />
          <StatsCard title="Failed" value={stats?.failed ?? 0} icon={XCircle} variant="error" />
        </div>
      )}

      {/* Post History */}
      <div className="card bg-base-100 border border-base-300 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-dark-bg">Post History</h2>
          {postsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-10 w-full" />
              ))}
            </div>
          ) : (
            <PostHistory posts={posts ?? []} />
          )}
        </div>
      </div>
    </main>
  )
}