import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
	try {
		const session = await auth()
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = session.user.id

		// Fetch page settings
		let pageSetting = await prisma.pageSetting.findUnique({
			where: { userId }
		})

		// Fetch RSS feeds
		const rssFeeds = await prisma.rssSource.findMany({
			where: { userId },
			select: { id: true, name: true, url: true, isActive: true }
		})

		// Return default settings if none exists
		return NextResponse.json({
			pageId: pageSetting?.pageId || '',
			pageAccessToken: pageSetting?.pageAccessToken || '',
			news_schedule: pageSetting?.newsSchedule ? JSON.parse(pageSetting.newsSchedule) : ['08:00', '12:00', '16:00', '20:00'],
			rss_feeds: rssFeeds.length > 0 ? rssFeeds : [
				{ name: 'BBC Sport — Liverpool', url: 'https://www.bbc.co.uk/sport/football/teams/liverpool/rss.xml', isActive: true },
				{ name: 'Liverpool Echo', url: 'https://www.liverpoolecho.co.uk/all-about/liverpool-fc?service=rss', isActive: true },
				{ name: 'This Is Anfield', url: 'https://www.thisisanfield.com/feed/', isActive: true },
			],
			disable_ai: pageSetting?.disableAi ?? false,
		}, { status: 200 })
	} catch (error) {
		console.error('Settings GET error:', error)
		return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const session = await auth()
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const userId = session.user.id

		const body = await request.json()
		const { pageId, pageAccessToken, news_schedule, rss_feeds, disable_ai } = body

		if (news_schedule && !Array.isArray(news_schedule)) {
			return NextResponse.json({ error: 'Invalid schedules format' }, { status: 400 })
		}
		
		if (rss_feeds && !Array.isArray(rss_feeds)) {
			return NextResponse.json({ error: 'Invalid rss_feeds format' }, { status: 400 })
		}

		// Update or Create PageSetting
		const updatedPageSetting = await prisma.pageSetting.upsert({
			where: { userId },
			update: {
				...(pageId !== undefined && { pageId }),
				...(pageAccessToken !== undefined && { pageAccessToken }),
				...(news_schedule && { newsSchedule: JSON.stringify(news_schedule.sort()) }),
				...(typeof disable_ai === 'boolean' && { disableAi: disable_ai }),
			},
			create: {
				userId,
				pageId: pageId || '',
				pageAccessToken: pageAccessToken || '',
				newsSchedule: news_schedule ? JSON.stringify(news_schedule.sort()) : JSON.stringify(['08:00', '12:00', '16:00', '20:00']),
				disableAi: typeof disable_ai === 'boolean' ? disable_ai : false,
			}
		})

		// Update RSS Feeds (Replace all for this user for simplicity)
		if (rss_feeds) {
			await prisma.$transaction([
				prisma.rssSource.deleteMany({ where: { userId } }),
				prisma.rssSource.createMany({
					data: rss_feeds.map((f: any) => ({
						userId,
						name: f.name,
						url: f.url,
						isActive: f.isActive ?? true
					}))
				})
			])
		}

		const newRssFeeds = await prisma.rssSource.findMany({
			where: { userId },
			select: { id: true, name: true, url: true, isActive: true }
		})

		return NextResponse.json({ 
			success: true, 
			pageId: updatedPageSetting.pageId,
			news_schedule: updatedPageSetting.newsSchedule ? JSON.parse(updatedPageSetting.newsSchedule) : [], 
			rss_feeds: newRssFeeds,
			disable_ai: updatedPageSetting.disableAi
		}, { status: 200 })
	} catch (error) {
		console.error('Settings POST error:', error)
		return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
	}
}
