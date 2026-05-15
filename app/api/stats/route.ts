import { NextResponse } from 'next/server'
import prisma from '../../../lib/db'
import { PostStats } from '../../../types'

export async function GET() {
	try {
		const [total, posted, failed, pending] = await Promise.all([
			prisma.post.count(),
			prisma.post.count({ where: { status: 'POSTED' } }),
			prisma.post.count({ where: { status: 'FAILED' } }),
			prisma.post.count({ where: { status: 'PENDING' } }),
		])

		const stats: PostStats = { total, posted, failed, pending }
		return NextResponse.json(stats, { status: 200 })
	} catch (error) {
		console.error('Stats API error:', error)
		return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
	}
}