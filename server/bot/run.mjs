import 'dotenv/config'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import path from 'path'
import FormData from 'form-data'
import * as cheerio from 'cheerio'
import { translate } from 'google-translate-api-x'

// Initialize Prisma
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const RSS_FEEDS = [
	'https://www.bbc.co.uk/sport/football/teams/liverpool/rss.xml',
	'https://www.liverpoolecho.co.uk/all-about/liverpool-fc?service=rss',
	'https://www.thisisanfield.com/feed/',
	'https://www.empireofthekop.com/feed/',
]

// Parse RSS XML to array
function parseRSS(xmlText) {
	const items = []
	const itemRegex = /<item>([\s\S]*?)<\/item>/g
	let match

	while ((match = itemRegex.exec(xmlText)) !== null) {
		const itemXml = match[1]
		const title = (itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemXml.match(/<title>(.*?)<\/title>/) || [])[1] || ''
		const link = (itemXml.match(/<link>(.*?)<\/link>/) || [])[1] || ''
		const description = (itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || itemXml.match(/<description>(.*?)<\/description>/) || [])[1] || ''
		const pubDate = (itemXml.match(/<pubDate><!\[CDATA\[(.*?)\]\]><\/pubDate>/) || itemXml.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || ''

		if (title) {
			let pubDateMs = 0
			if (pubDate) {
				try { pubDateMs = Date.parse(pubDate.trim()) } catch (e) { /* Ignore */ }
			}

			const decodedTitle = cheerio.load(title.trim()).text()
			const cleanDescription = description.replace(/<[^>]+>/g, '').trim()
			const decodedDescription = cheerio.load(cleanDescription).text()

			items.push({
				title: decodedTitle,
				link: link.trim(),
				description: decodedDescription.slice(0, 500),
				pubDate: pubDate.trim(),
				pubDateMs: isNaN(pubDateMs) ? 0 : pubDateMs
			})
		}
	}
	return items
}

async function fetchNews() {
	const allItems = []
	const dbFeedsSetting = await prisma.setting.findUnique({ where: { key: 'rss_feeds' } })
	let activeFeeds = RSS_FEEDS
	if (dbFeedsSetting) {
		try {
			const customFeeds = JSON.parse(dbFeedsSetting.value)
			if (customFeeds.length > 0) activeFeeds = customFeeds.map(f => f.url)
		} catch (e) { }
	}

	for (const url of activeFeeds) {
		try {
			const res = await axios.get(url, { timeout: 10000 })
			const parsed = parseRSS(res.data)
			allItems.push(...parsed)
			console.log(`✅ Fetched ${parsed.length} items from ${url}`)
		} catch (err) {
			console.warn(`⚠️ Failed to fetch RSS from ${url}: ${err.message}`)
		}
	}

	const firstTeamNews = allItems.filter(item => {
		const text = (item.title + ' ' + item.description).toLowerCase()
		return !text.includes('u21') && !text.includes('u18') && !text.includes('women') && !text.includes('academy')
	})

	const now = Date.now()
	const twentyFourHours = 24 * 60 * 60 * 1000
	return firstTeamNews.filter(item => {
		if (item.pubDateMs) {
			return (now - item.pubDateMs) <= twentyFourHours
		}
		return true
	})
}

// Extract main image from article HTML
async function getArticleImage(url) {
	try {
		const res = await axios.get(url, { timeout: 10000 })
		const $ = cheerio.load(res.data)
		let imgUrl = $('meta[property="og:image"]').attr('content')
		if (!imgUrl) imgUrl = $('meta[name="twitter:image"]').attr('content')
		return imgUrl
	} catch (err) {
		return null
	}
}

// Get Facebook Page Access Token (from DB or fallback to ENV)
async function getFacebookToken() {
	const dbToken = await prisma.setting.findUnique({ where: { key: 'fb_page_token' } })
	if (dbToken && dbToken.value) return dbToken.value
	return process.env.PAGE_ACCESS_TOKEN
}

// Post to Facebook Page
async function postToFacebook(caption, link, base64Image, rawTitle) {
	const pageId = process.env.PAGE_ID
	const accessToken = await getFacebookToken()

	if (!accessToken || !pageId) throw new Error('Missing Facebook Page ID or Access Token')

	const fullCaption = `${caption}\n\n#Liverpool #LFC #YNWA #คอบอลเดอะค็อป #ลิเวอร์พูล`
	const commentText = `อ่านรายละเอียดข่าวฉบับเต็มได้ที่นี่ 👇\n${link}`
	let fbPostId = null

	if (base64Image) {
		// 1. Post Photo
		const formData = new FormData()
		const imageBuffer = Buffer.from(base64Image, 'base64')
		formData.append('source', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
		formData.append('message', fullCaption)
		formData.append('access_token', accessToken)

		const response = await axios.post(
			`https://graph.facebook.com/v20.0/${pageId}/photos`,
			formData,
			{ headers: formData.getHeaders(), timeout: 60000 }
		)
		fbPostId = response.data.id

		// 2. Post Comment with Link
		try {
			await axios.post(
				`https://graph.facebook.com/v20.0/${fbPostId}/comments`,
				{ message: commentText, access_token: accessToken }
			)
			console.log(`💬 Added link to the first comment of post ${fbPostId}`)
		} catch (commentErr) {
			console.error(`⚠️ Failed to add comment to post ${fbPostId}:`, commentErr.response?.data || commentErr.message)
		}

		return fbPostId
	} else {
		// Fallback to Link Post if no image
		const response = await axios.post(
			`https://graph.facebook.com/v20.0/${pageId}/feed`,
			{ message: fullCaption, link, access_token: accessToken }
		)
		return response.data.id
	}
}

// Core bot function
async function runBot() {
	let post = null
	try {
		console.log('📰 Fetching Liverpool news...')
		const news = await fetchNews()

		if (!news.length) {
			console.warn('⚠️ No new articles found')
			return
		}

		// Anti-duplicate logic
		const recentPosts = await prisma.post.findMany({
			where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
			select: { title: true }
		})

		const isDuplicate = (newTitle) => {
			const newWords = newTitle.toLowerCase().split(/[\\W_]+/).filter(w => w.length > 3)
			return recentPosts.some(p => {
				const oldWords = p.title.toLowerCase().split(/[\\W_]+/).filter(w => w.length > 3)
				const matchCount = newWords.filter(w => oldWords.includes(w)).length
				return matchCount >= 4
			})
		}

		let latest = null
		for (const item of news) {
			const existing = await prisma.post.findFirst({ where: { link: item.link } })
			if (!existing && !isDuplicate(item.title)) {
				latest = item
				break
			}
		}

		if (!latest) {
			console.warn('⚠️ No unposted new articles found in the fetched list')
			return
		}

		let thaiSummary = latest.description
		console.log('🤖 AI is removed. Translating using google-translate-api-x...')
		
		try {
			const titleRes = await translate(latest.title, { to: 'th' })
			const descRes = await translate(latest.description, { to: 'th' })
			
			const translatedTitle = titleRes.text
			let translatedDesc = descRes.text
			// Truncate description if too long
			translatedDesc = translatedDesc.slice(0, 300) + (translatedDesc.length > 300 ? '...' : '')
			
			thaiSummary = `${translatedTitle}\n\n${translatedDesc}`
		} catch (err) {
			console.warn('⚠️ Free translation failed, falling back to raw English:', err.message)
			thaiSummary = `${latest.title}\n\n${latest.description.slice(0, 300)}...`
		}

		// Save to DB with PENDING status
		post = await prisma.post.create({
			data: {
				title: latest.title,
				content: thaiSummary,
				link: latest.link,
				status: 'PENDING',
			},
		})

		let imageBase64 = null
		const articleImageUrl = await getArticleImage(latest.link)
		if (articleImageUrl) {
			try {
				const imgRes = await axios.get(articleImageUrl, { responseType: 'arraybuffer', timeout: 10000 })
				imageBase64 = Buffer.from(imgRes.data).toString('base64')
			} catch (err) {
				console.warn('⚠️ Failed to download article image')
			}
		}

		console.log(`📢 Posting...`)
		const fbPostId = await postToFacebook(thaiSummary, latest.link, imageBase64, latest.title)

		// Update status to POSTED
		await prisma.post.update({
			where: { id: post.id },
			data: { status: 'POSTED', fbPostId, postedAt: new Date() },
		})

		console.log(`✅ Posted! FB Post ID: ${fbPostId}`)
	} catch (err) {
		console.error('❌ Bot error:', err.message)
		if (err.response && err.response.data) {
			console.error('❌ Response data:', JSON.stringify(err.response.data, null, 2))
		}

		// Update status to FAILED if post was created
		if (post?.id) {
			await prisma.post.update({
				where: { id: post.id },
				data: { status: 'FAILED' },
			})
		}
	}
}

// Manual token refresh logic (save to DB)
async function refreshFacebookToken() {
	try {
		console.log('🔄 Refreshing Facebook Long-lived token...')
		const { APP_ID, APP_SECRET } = process.env
		const currentToken = await getFacebookToken()

		if (!APP_ID || !APP_SECRET || !currentToken) {
			throw new Error('Missing APP_ID, APP_SECRET, or current token.')
		}

		const response = await axios.get(`https://graph.facebook.com/v20.0/oauth/access_token`, {
			params: {
				grant_type: 'fb_exchange_token',
				client_id: APP_ID,
				client_secret: APP_SECRET,
				fb_exchange_token: currentToken
			}
		})

		const newToken = response.data.access_token
		
		await prisma.setting.upsert({
			where: { key: 'fb_page_token' },
			update: { value: newToken },
			create: { key: 'fb_page_token', value: newToken }
		})

		console.log('✅ Token successfully refreshed and saved to Database.')
	} catch (err) {
		console.error('❌ Failed to refresh Facebook token:', err.response?.data || err.message)
	}
}

// Check if current hour has a schedule, and if we haven't posted in the last 50 minutes
async function isScheduledTime() {
	const dbNewsSetting = await prisma.setting.findUnique({ where: { key: 'news_schedule' } })
	let newsTimes = ['08:00', '11:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
	if (dbNewsSetting) {
		try { newsTimes = JSON.parse(dbNewsSetting.value) } catch (e) { }
	}

	const now = new Date()
	const currentHour = now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok', hour: '2-digit', hourCycle: 'h23' })

	// Check if this hour is in the schedule
	const hasScheduleThisHour = newsTimes.some(t => t.startsWith(currentHour + ':'))
	if (!hasScheduleThisHour) return false

	// Check if we already posted in the last 50 minutes to avoid duplicate posts for the same schedule
	const fiftyMinutesAgo = new Date(Date.now() - 50 * 60 * 1000)
	const recentPost = await prisma.post.findFirst({
		where: { createdAt: { gte: fiftyMinutesAgo } },
		orderBy: { createdAt: 'desc' }
	})

	if (recentPost) {
		console.log(`⏰ Schedule for ${currentHour}:00 is already fulfilled (last post was at ${recentPost.createdAt.toISOString()}). Skipping run.`)
		return false
	}

	return true
}

// Auto-delete posts older than 24 hours to save Database space
async function cleanupOldPosts() {
	try {
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
		const deleted = await prisma.post.deleteMany({
			where: { createdAt: { lt: oneDayAgo } }
		})
		if (deleted.count > 0) {
			console.log(`🧹 Cleaned up ${deleted.count} old posts (>24hrs).`)
		}
	} catch (err) {
		console.error('❌ Failed to clean up old posts:', err.message)
	}
}

// Entry point based on CLI arguments
const args = process.argv.slice(2)

async function main() {
	try {
		if (args.includes('--news')) {
			await cleanupOldPosts()
			await runBot()
		} else if (args.includes('--scheduled-news')) {
			await cleanupOldPosts()
			if (await isScheduledTime()) {
				await runBot()
			} else {
				console.log('⏰ Not a scheduled time. Skipping run.')
			}
		} else if (args.includes('--refresh-token')) {
			await refreshFacebookToken()
		} else {
			console.log('⚠️ Please provide an argument: --news, --scheduled-news, or --refresh-token')
		}
	} catch (err) {
		console.error('Fatal error:', err)
	} finally {
		await prisma.$disconnect()
		process.exit(0)
	}
}

main()