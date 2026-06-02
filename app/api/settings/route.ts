import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
	try {
		const settings = await prisma.setting.findMany()
		const config: Record<string, string> = {}
		settings.forEach((s: { key: string, value: string }) => {
			config[s.key] = s.value
		})

		const newsSchedule = config.news_schedule
			? JSON.parse(config.news_schedule)
			: ['08:00', '11:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']

		const rssFeeds = config.rss_feeds
			? JSON.parse(config.rss_feeds)
			: [
				{ name: 'BBC Sport — Liverpool', url: 'https://www.bbc.co.uk/sport/football/teams/liverpool/rss.xml' },
				{ name: 'Liverpool Echo', url: 'https://www.liverpoolecho.co.uk/all-about/liverpool-fc?service=rss' },
				{ name: 'LFC Official (Scraped)', url: 'https://www.liverpoolfc.com/news/rss.xml' },
			]

		const disableAi = config.disable_ai === 'true'

		return NextResponse.json({
			news_schedule: newsSchedule,
			rss_feeds: rssFeeds,
			disable_ai: disableAi,
		}, { status: 200 })
	} catch (error) {
		console.error('Settings GET error:', error)
		return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { news_schedule, rss_feeds, disable_ai } = body

		if (!Array.isArray(news_schedule)) {
			return NextResponse.json({ error: 'Invalid schedules format' }, { status: 400 })
		}
		
		if (rss_feeds && !Array.isArray(rss_feeds)) {
			return NextResponse.json({ error: 'Invalid rss_feeds format' }, { status: 400 })
		}

		// Validate that each item is in HH:MM format
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
		const allValidNews = news_schedule.every((t: string) => timeRegex.test(t))

		if (!allValidNews) {
			return NextResponse.json({ error: 'Schedules must be in HH:MM format (24-hour)' }, { status: 400 })
		}

		// Sort schedules chronologically
		const sortedNews = [...news_schedule].sort()

		const transactions = [
			prisma.setting.upsert({
				where: { key: 'news_schedule' },
				update: { value: JSON.stringify(sortedNews) },
				create: { key: 'news_schedule', value: JSON.stringify(sortedNews) },
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
		
		if (typeof disable_ai === 'boolean') {
			transactions.push(
				prisma.setting.upsert({
					where: { key: 'disable_ai' },
					update: { value: disable_ai ? 'true' : 'false' },
					create: { key: 'disable_ai', value: disable_ai ? 'true' : 'false' },
				})
			)
		}

		await prisma.$transaction(transactions)

		return NextResponse.json({ 
			success: true, 
			news_schedule: sortedNews, 
			rss_feeds: rss_feeds,
			disable_ai: disable_ai
		}, { status: 200 })
	} catch (error) {
		console.error('Settings POST error:', error)
		return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
	}
}
