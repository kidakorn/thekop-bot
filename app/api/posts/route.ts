import { NextResponse } from 'next/server'
import prisma from '../../../lib/db'

export async function GET() {
	try {
		const posts = await prisma.post.findMany({
			orderBy: { createdAt: 'desc' },
			take: 20,
			select: {
				id: true,
				title: true,
				status: true,
				fbPostId: true,
				postedAt: true,
				createdAt: true,
			},
		})

		return NextResponse.json(posts, { status: 200 })
	} catch (error) {
		console.error('Posts API error:', error)
		return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
	}
}