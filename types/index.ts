export interface NewsItem {
  title: string
  link: string
  description: string
}

export interface PostStats {
  total: number
  posted: number
  failed: number
  pending: number
}

export interface Post {
  id: string
  title: string
  status: string
  fbPostId: string | null
  postedAt: string | null
  createdAt: string
  link?: string
  content?: string
}