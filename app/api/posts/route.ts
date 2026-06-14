import { NextResponse } from 'next/server'
import prisma from '../../../lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
	try {
		const session = await auth()
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const posts = await prisma.post.findMany({
			where: { userId: session.user.id },
			orderBy: { createdAt: 'desc' },
			take: 100,
			select: {
				id: true,
				title: true,
				status: true,
				fbPostId: true,
				postedAt: true,
				createdAt: true,
				content: true,
				link: true,
			},
		})

		return NextResponse.json(posts, { status: 200 })
	} catch (error) {
		console.error('Posts API error:', error)
		return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
	}
}