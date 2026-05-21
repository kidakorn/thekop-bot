import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
	try {
		const settings = await prisma.setting.findMany()
		const config: Record<string, string> = {}
		settings.forEach(s => {
			config[s.key] = s.value
		})

		const newsSchedule = config.news_schedule
			? JSON.parse(config.news_schedule)
			: ['08:00', '11:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']

		const reelsSchedule = config.reels_schedule
			? JSON.parse(config.reels_schedule)
			: ['09:30', '13:30', '17:30', '19:30', '21:30', '23:30']

		const rssFeeds = config.rss_feeds
			? JSON.parse(config.rss_feeds)
			: [
				{ name: 'BBC Sport — Liverpool', url: 'https://www.bbc.co.uk/sport/football/teams/liverpool/rss.xml' },
				{ name: 'Liverpool Echo', url: 'https://www.liverpoolecho.co.uk/all-about/liverpool-fc?service=rss' },
				{ name: 'LFC Official (Scraped)', url: 'https://www.liverpoolfc.com/news/rss.xml' },
			]

		return NextResponse.json({
			news_schedule: newsSchedule,
			reels_schedule: reelsSchedule,
			rss_feeds: rssFeeds,
		}, { status: 200 })
	} catch (error) {
		console.error('Settings GET error:', error)
		return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { news_schedule, reels_schedule, rss_feeds } = body

		if (!Array.isArray(news_schedule) || !Array.isArray(reels_schedule)) {
			return NextResponse.json({ error: 'Invalid schedules format' }, { status: 400 })
		}
		
		if (rss_feeds && !Array.isArray(rss_feeds)) {
			return NextResponse.json({ error: 'Invalid rss_feeds format' }, { status: 400 })
		}

		// Validate that each item is in HH:MM format
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
		const allValidNews = news_schedule.every((t: string) => timeRegex.test(t))
		const allValidReels = reels_schedule.every((t: string) => timeRegex.test(t))

		if (!allValidNews || !allValidReels) {
			return NextResponse.json({ error: 'Schedules must be in HH:MM format (24-hour)' }, { status: 400 })
		}

		// Sort schedules chronologically
		const sortedNews = [...news_schedule].sort()
		const sortedReels = [...reels_schedule].sort()

		const transactions = [
			prisma.setting.upsert({
				where: { key: 'news_schedule' },
				update: { value: JSON.stringify(sortedNews) },
				create: { key: 'news_schedule', value: JSON.stringify(sortedNews) },
			}),
			prisma.setting.upsert({
				where: { key: 'reels_schedule' },
				update: { value: JSON.stringify(sortedReels) },
				create: { key: 'reels_schedule', value: JSON.stringify(sortedReels) },
			})
		]
		
		if (rss_feeds) {
			transactions.push(
				prisma.setting.upsert({
					where: { key: 'rss_feeds' },
					update: { value: JSON.stringify(rss_feeds) },
					create: { key: 'rss_feeds', value: JSON.stringify(rss_feeds) },
				})
			)
		}

		await prisma.$transaction(transactions)

		return NextResponse.json({ 
			success: true, 
			news_schedule: sortedNews, 
			reels_schedule: sortedReels,
			rss_feeds: rss_feeds
		}, { status: 200 })
	} catch (error) {
		console.error('Settings POST error:', error)
		return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
	}
}
