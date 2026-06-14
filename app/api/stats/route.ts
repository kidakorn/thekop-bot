import { NextResponse } from 'next/server'
import prisma from '../../../lib/db'
import { PostStats } from '../../../types'
import { auth } from '@/lib/auth'

export async function GET() {
	try {
		const session = await auth()
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const userId = session.user.id

		const [total, posted, failed, pending] = await Promise.all([
			prisma.post.count({ where: { userId } }),
			prisma.post.count({ where: { userId, status: 'POSTED' } }),
			prisma.post.count({ where: { userId, status: 'FAILED' } }),
			prisma.post.count({ where: { userId, status: 'PENDING' } }),
		])

		const stats: PostStats = { total, posted, failed, pending }
		return NextResponse.json(stats, { status: 200 })
	} catch (error) {
		console.error('Stats API error:', error)
		return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
	}
}