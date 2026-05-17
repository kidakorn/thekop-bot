import { NextResponse } from 'next/server'
import prisma from '../../../../lib/db'

export async function DELETE(
	_req: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params

		const post = await prisma.post.findUnique({ where: { id } })
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 })
		}

		await prisma.post.delete({ where: { id } })
		return NextResponse.json({ success: true }, { status: 200 })
	} catch (error) {
		console.error('Delete post error:', error)
		return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
	}
}
