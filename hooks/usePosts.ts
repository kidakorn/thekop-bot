import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Post, PostStats } from '../types'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

const fetcher = (url: string) => fetch(url).then(r => r.json())
const POSTS_PER_PAGE = 10

export function usePosts() {
  const { data: postsData, isLoading: postsLoading, mutate: mutatePosts } =
    useSWR<Post[]>('/api/posts', fetcher, { refreshInterval: 30000 })
  const { data: stats, isLoading: statsLoading, mutate: mutateStats } =
    useSWR<PostStats>('/api/stats', fetcher, { refreshInterval: 30000 })
  
  const posts = Array.isArray(postsData) ? postsData : []

  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'POSTED' | 'PENDING' | 'FAILED'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  function handleFilterChange(f: 'ALL' | 'POSTED' | 'PENDING' | 'FAILED') {
    setStatusFilter(f)
    setCurrentPage(1)
  }

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || (p.fbPostId && p.fbPostId.includes(searchQuery))
      return matchStatus && matchSearch
    }).sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })
  }, [posts, statusFilter, searchQuery, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE))
  const currentPosts = useMemo(() => {
    return filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)
  }, [filteredPosts, currentPage])

  // Analytics Data
  const totalPostedToday = useMemo(() => {
    return posts.filter(p => {
      return p.status === 'POSTED' && new Date(p.createdAt).toDateString() === new Date().toDateString()
    }).length
  }, [posts])

  const chartData = useMemo(() => {
    const grouped: Record<string, { date: string, POSTED: number, PENDING: number, FAILED: number }> = {}
    posts.forEach(p => {
      const d = new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      if (!grouped[d]) grouped[d] = { date: d, POSTED: 0, PENDING: 0, FAILED: 0 }
      if (p.status === 'POSTED') grouped[d].POSTED++
      if (p.status === 'PENDING') grouped[d].PENDING++
      if (p.status === 'FAILED') grouped[d].FAILED++
    })
    return Object.values(grouped).reverse().slice(-7)
  }, [posts])

  return {
    posts,
    stats,
    statsLoading,
    mutateStats,
    postsLoading,
    mutatePosts,
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
    totalPostedToday,
    chartData
  }
}
