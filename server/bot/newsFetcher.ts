import axios from 'axios'
import { NewsItem } from '../../types'

const RSS_FEEDS = [
	'https://www.liverpoolfc.com/news/rss.xml',
	'https://www.bbc.co.uk/sport/football/teams/liverpool/rss.xml',
]

/**
 * Parse RSS XML into array of news items
 */
function parseRSS(xmlText: string): NewsItem[] {
	const items: NewsItem[] = []
	const itemRegex = /<item>([\s\S]*?)<\/item>/g
	let match

	while ((match = itemRegex.exec(xmlText)) !== null) {
		const itemXml = match[1]

		const title =
			(itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
				itemXml.match(/<title>(.*?)<\/title>/) || [])[1] || ''

		const link =
			(itemXml.match(/<link>(.*?)<\/link>/) || [])[1] || ''

		const description =
			(itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
				itemXml.match(/<description>(.*?)<\/description>/) || [])[1] || ''

		if (title) {
			items.push({
				title: title.trim(),
				link: link.trim(),
				description: description.replace(/<[^>]+>/g, '').trim().slice(0, 200),
			})
		}
	}

	return items
}

/**
 * Fetch Liverpool news from RSS feeds
 * Returns empty array if all feeds fail
 */
export async function fetchLiverpoolNews(): Promise<NewsItem[]> {
	for (const feedUrl of RSS_FEEDS) {
		try {
			const response = await axios.get<string>(feedUrl, {
				timeout: 10000,
				headers: { 'User-Agent': 'TheKopBot/1.0' },
			})

			const items = parseRSS(response.data)
			if (items.length > 0) {
				console.log(`✅ Fetched ${items.length} news items from ${feedUrl}`)
				return items
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error'
			console.warn(`⚠️ Failed to fetch from ${feedUrl}: ${message}`)
		}
	}

	return []
}