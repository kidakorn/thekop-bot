import 'dotenv/config'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import FormData from 'form-data'
import * as cheerio from 'cheerio'
import { translate } from 'google-translate-api-x'
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey() {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development_only_123'
  return crypto.scryptSync(secret, 'salt', 32)
}

function decryptToken(encryptedText) {
  if (!encryptedText) return encryptedText
  
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      return encryptedText
    }
    
    const [ivHex, authTagHex, encryptedDataHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (err) {
    console.error('Decryption error (might be plain-text token):', err.message)
    return encryptedText
  }
}

// Initialize Prisma
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const DEFAULT_RSS_FEEDS = [
	'https://www.bbc.co.uk/sport/football/teams/liverpool/rss.xml',
	'https://www.liverpoolecho.co.uk/all-about/liverpool-fc?service=rss',
	'https://www.thisisanfield.com/feed/',
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

async function fetchNews(activeFeeds) {
	const allItems = []

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
	const filteredNews = firstTeamNews.filter(item => {
		if (item.pubDateMs) {
			return (now - item.pubDateMs) <= twentyFourHours
		}
		return true
	})

	// Sort by newest first (highest timestamp to lowest)
	return filteredNews.sort((a, b) => b.pubDateMs - a.pubDateMs)
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

// Post to Facebook Page
async function postToFacebook(caption, link, base64Image, rawTitle, pageSetting) {
	const { pageId } = pageSetting
	const pageAccessToken = decryptToken(pageSetting.pageAccessToken)

	if (!pageAccessToken || !pageId) throw new Error('Missing Facebook Page ID or Access Token')

	const fullCaption = `${caption}\n\n#Liverpool #LFC #YNWA #คอบอลเดอะค็อป #ลิเวอร์พูล`
	const commentText = `อ่านรายละเอียดข่าวฉบับเต็มได้ที่นี่ 👇\n${link}`
	let fbPostId = null

	if (base64Image) {
		// 1. Post Photo
		const formData = new FormData()
		const imageBuffer = Buffer.from(base64Image, 'base64')
		formData.append('source', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
		formData.append('message', fullCaption)
		formData.append('access_token', pageAccessToken)

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
				{ message: commentText, access_token: pageAccessToken }
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
			{ message: fullCaption, link, access_token: pageAccessToken }
		)
		return response.data.id
	}
}

// Core bot function for a specific user
async function runBotForUser(pageSetting, activeFeeds) {
	let post = null
	try {
		console.log(`\n📰 Fetching Liverpool news for User [${pageSetting.userId}]...`)
		const news = await fetchNews(activeFeeds)

		if (!news.length) {
			console.warn(`⚠️ No new articles found for User [${pageSetting.userId}]`)
			return
		}

		// Anti-duplicate logic for this user
		const recentPosts = await prisma.post.findMany({
			where: { 
				userId: pageSetting.userId,
				createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
			},
			select: { title: true }
		})

		const isDuplicate = (newTitle) => {
			const newWords = newTitle.toLowerCase().split(/[\W_]+/).filter(w => w.length > 3)
			return recentPosts.some(p => {
				const oldWords = p.title.toLowerCase().split(/[\W_]+/).filter(w => w.length > 3)
				const matchCount = newWords.filter(w => oldWords.includes(w)).length
				return matchCount >= 4
			})
		}

		let latest = null
		for (const item of news) {
			const existing = await prisma.post.findFirst({ 
				where: { userId: pageSetting.userId, link: item.link } 
			})
			if (!existing && !isDuplicate(item.title)) {
				latest = item
				break
			}
		}

		if (!latest) {
			console.warn(`⚠️ No unposted new articles found for User [${pageSetting.userId}]`)
			return
		}

		let thaiSummary = latest.description
		
		if (pageSetting.disableAi) {
			console.log(`🤖 AI is disabled for User [${pageSetting.userId}]. Using raw English.`)
			thaiSummary = `${latest.title}\n\n${latest.description.slice(0, 300)}...`
		} else {
			console.log(`🤖 Translating using google-translate-api-x for User [${pageSetting.userId}]...`)
			try {
				const titleRes = await translate(latest.title, { to: 'th' })
				const descRes = await translate(latest.description, { to: 'th' })
				
				const translatedTitle = titleRes.text
				let translatedDesc = descRes.text
				translatedDesc = translatedDesc.slice(0, 300) + (translatedDesc.length > 300 ? '...' : '')
				
				thaiSummary = `${translatedTitle}\n\n${translatedDesc}`
			} catch (err) {
				console.warn(`⚠️ Free translation failed for User [${pageSetting.userId}], falling back to raw English:`, err.message)
				thaiSummary = `${latest.title}\n\n${latest.description.slice(0, 300)}...`
			}
		}

		// Save to DB with PENDING status
		post = await prisma.post.create({
			data: {
				userId: pageSetting.userId,
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

		console.log(`📢 Posting for User [${pageSetting.userId}]...`)
		const fbPostId = await postToFacebook(thaiSummary, latest.link, imageBase64, latest.title, pageSetting)

		// Update status to POSTED
		await prisma.post.update({
			where: { id: post.id },
			data: { status: 'POSTED', fbPostId, postedAt: new Date() },
		})

		console.log(`✅ Posted! FB Post ID: ${fbPostId} for User [${pageSetting.userId}]`)
	} catch (err) {
		console.error(`❌ Bot error for User [${pageSetting.userId}]:`, err.message)
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

// Check if current hour has a schedule, and if we haven't posted in the last 50 minutes for this user
async function isScheduledTime(pageSetting) {
	let newsTimes = ['08:00', '12:00', '16:00', '20:00']
	if (pageSetting.newsSchedule) {
		try { newsTimes = JSON.parse(pageSetting.newsSchedule) } catch (e) { }
	}

	const now = new Date()
	const currentHour = now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok', hour: '2-digit', hourCycle: 'h23' })

	// Check if this hour is in the schedule
	const hasScheduleThisHour = newsTimes.some(t => t.startsWith(currentHour + ':'))
	if (!hasScheduleThisHour) return false

	// Check if we already posted in the last 50 minutes to avoid duplicate posts
	const fiftyMinutesAgo = new Date(Date.now() - 50 * 60 * 1000)
	const recentPost = await prisma.post.findFirst({
		where: { 
			userId: pageSetting.userId,
			createdAt: { gte: fiftyMinutesAgo } 
		},
		orderBy: { createdAt: 'desc' }
	})

	if (recentPost) {
		console.log(`⏰ Schedule for ${currentHour}:00 is already fulfilled for User [${pageSetting.userId}] (last post at ${recentPost.createdAt.toISOString()}). Skipping.`)
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
		await cleanupOldPosts()
		
		const allSettings = await prisma.pageSetting.findMany()
		
		if (allSettings.length === 0) {
			console.log('⚠️ No PageSettings found in database. Exiting.')
			return
		}

		for (const pageSetting of allSettings) {
			if (!pageSetting.pageId || !pageSetting.pageAccessToken) {
				console.log(`⚠️ User [${pageSetting.userId}] has incomplete Facebook setup. Skipping.`)
				continue
			}

			const rssSources = await prisma.rssSource.findMany({ 
				where: { userId: pageSetting.userId, isActive: true } 
			})
			
			const activeFeeds = rssSources.length > 0 
				? rssSources.map(r => r.url) 
				: DEFAULT_RSS_FEEDS

			if (args.includes('--news')) {
				await runBotForUser(pageSetting, activeFeeds)
			} else if (args.includes('--scheduled-news')) {
				if (await isScheduledTime(pageSetting)) {
					await runBotForUser(pageSetting, activeFeeds)
				} else {
					console.log(`⏰ Not a scheduled time for User [${pageSetting.userId}]. Skipping.`)
				}
			} else {
				console.log('⚠️ Please provide an argument: --news or --scheduled-news')
				break
			}
		}

	} catch (err) {
		console.error('Fatal error:', err)
	} finally {
		await prisma.$disconnect()
		process.exit(0)
	}
}

main()