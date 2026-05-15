'use client'

import useSWR from 'swr'
import { BarChart2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
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
  const { data: stats, isLoading: statsLoading, mutate: mutateStats } = useSWR<PostStats>('/api/stats', fetcher, {
    refreshInterval: 30000,
  })

  const { data: posts, isLoading: postsLoading, mutate: mutatePosts } = useSWR<Post[]>('/api/posts', fetcher, {
    refreshInterval: 30000,
  })

  function handleRefresh() {
    mutateStats()
    mutatePosts()
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-red flex items-center justify-center shadow-md">
            <BarChart2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-dark-bg leading-tight">The Kop Bot</h1>
            <p className="text-sm text-base-content/50 mt-0.5">Auto-posting dashboard</p>
          </div>
        </div>

        <button
          id="refresh-btn"
          onClick={handleRefresh}
          className="btn btn-ghost btn-sm gap-2 text-base-content/60 hover:text-dark-bg hover:bg-base-300 focus-visible:ring-2 focus-visible:ring-primary-red rounded-xl active:scale-95 transition-all"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Total Posts"  value={stats?.total   ?? 0} icon={BarChart2}    variant="info"    />
          <StatsCard title="Posted"       value={stats?.posted  ?? 0} icon={CheckCircle}  variant="success" />
          <StatsCard title="Pending"      value={stats?.pending ?? 0} icon={Clock}         variant="warning" />
          <StatsCard title="Failed"       value={stats?.failed  ?? 0} icon={XCircle}      variant="error"   />
        </div>
      )}

      {/* ── Post History ── */}
      <div className="card bg-base-100 border border-base-300 shadow-md rounded-2xl">
        <div className="card-body p-4 md:p-6">
          <h2 className="card-title text-dark-bg text-2xl font-semibold mb-1">Post History</h2>
          {postsLoading ? (
            <div className="space-y-3 mt-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded-xl" />
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