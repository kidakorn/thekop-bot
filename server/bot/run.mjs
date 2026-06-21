import 'dotenv/config'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import FormData from 'form-data'
import * as cheerio from 'cheerio'
import { translate } from 'google-translate-api-x'
import crypto from 'crypto'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import path from 'path'
import { readFile } from 'fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOGO_PATH = path.join(__dirname, 'assets', 'LOGO.png')
const FONT_PATH = path.join(__dirname, 'assets', 'Prompt-Bold.ttf')

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

			const imageUrlMatch = itemXml.match(/<media:content.*?url=["'](.*?)["']/) || itemXml.match(/<enclosure.*?url=["'](.*?)["']/) || []
			const imageUrl = imageUrlMatch[1] || null

			items.push({
				title: decodedTitle,
				link: link.trim(),
				description: decodedDescription.slice(0, 500),
				pubDate: pubDate.trim(),
				pubDateMs: isNaN(pubDateMs) ? 0 : pubDateMs,
				image: imageUrl
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
		const res = await axios.get(url, { 
			timeout: 10000,
			headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
		})
		const $ = cheerio.load(res.data)
		let imgUrl = $('meta[property="og:image"]').attr('content')
		if (!imgUrl) imgUrl = $('meta[name="twitter:image"]').attr('content')
		return imgUrl
	} catch (err) {
		console.warn(`⚠️ Failed to scrape image from HTML for ${url}:`, err.message)
		return null
	}
}

// ─── Image Processing Pipeline ──────────────────────────────────────────────

function getNewsCategory(title) {
	const t = title.toLowerCase()
	if (t.includes('official') || t.includes('confirm') || t.includes('sign')) return 'OFFICIAL!'
	if (t.includes('here we go') || t.includes('agree')) return 'HERE WE GO!'
	if (t.includes('breaking')) return 'BREAKING NEWS'
	if (t.includes('injury') || t.includes('ruled out')) return 'INJURY UPDATE'
	return 'LATEST NEWS'
}

function wrapText(text, maxChars = 32) {
	const words = text.split(' ')
	const lines = []
	let currentLine = ''

	for (const word of words) {
		if ((currentLine + word).length > maxChars) {
			if (currentLine) lines.push(currentLine.trim())
			currentLine = word + ' '
		} else {
			currentLine += word + ' '
		}
	}
	if (currentLine) lines.push(currentLine.trim())
	return lines
}

// สร้างรูป 1080×1080 จาก: รูปข่าว + gradient overlay + text + โลโก้
async function processImage(imageUrl, engTitle = '', thTitle = '', addTextOnImage = true) {
	const SIZE = 1080
	const BORDER = 12

	try {
		// 1. Download source image (with browser UA to avoid 403)
		const imgRes = await axios.get(imageUrl, {
			responseType: 'arraybuffer',
			timeout: 12000,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
			}
		})
		const inputBuf = Buffer.from(imgRes.data)

		// 2. Resize to 1080×1080 (cover crop centre)
		const base = await sharp(inputBuf)
			.resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
			.toBuffer()

		// 3. Gradient overlay — เข้มขึ้นตั้งแต่ 40% ถึงล่างสุด
		const gradientSvg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%"   stop-color="#000" stop-opacity="0.0"/>
					<stop offset="40%"  stop-color="#000" stop-opacity="0.20"/>
					<stop offset="75%"  stop-color="#000" stop-opacity="0.75"/>
					<stop offset="100%" stop-color="#000" stop-opacity="0.95"/>
				</linearGradient>
			</defs>
			<rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
		</svg>`

		// 4. Text Overlay (ฝัง Font Base64)
		const tag = getNewsCategory(engTitle)
		const wrappedLines = wrapText(thTitle, 40)
		
		const fontBuffer = await readFile(FONT_PATH)
		const fontBase64 = fontBuffer.toString('base64')

		let textSvgLines = `<text x="60" y="820" font-family="Prompt" font-weight="bold" font-size="28" fill="#ffffff" letter-spacing="2">${tag}</text>`
		
		let startY = 880
		wrappedLines.forEach((line, idx) => {
			if (idx < 3) {
				textSvgLines += `<text x="60" y="${startY}" font-family="Prompt" font-weight="bold" font-size="46" fill="#ffffff">${line}</text>`
				startY += 65
			}
		})

		const textSvg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
			<style>
				@font-face {
					font-family: 'Prompt';
					src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
				}
			</style>
			${textSvgLines}
		</svg>`

		// 4. Logo — resize ให้ไม่เกิน 180px และวาง bottom-right
		const logoBuf = await sharp(LOGO_PATH)
			.resize(180, 180, { fit: 'inside' })
			.toBuffer()
		const logoMeta = await sharp(logoBuf).metadata()
		const logoW = logoMeta.width ?? 180
		const logoH = logoMeta.height ?? 180

		// 6. Composite: gradient + text + logo
		const compositeLayers = [
			{ input: Buffer.from(gradientSvg), top: 0, left: 0 }
		]
		
		if (addTextOnImage) {
			compositeLayers.push({ input: Buffer.from(textSvg), top: 0, left: 0 })
		}

		compositeLayers.push({
			input: logoBuf,
			top: SIZE - logoH - 28,
			left: SIZE - logoW - 28,
		})

		const result = await sharp(base)
			.composite(compositeLayers)
			.jpeg({ quality: 90 })
			.toBuffer()

		console.log(`🖼️ processImage: success (${(result.length / 1024).toFixed(0)} KB)`)
		return result

	} catch (err) {
		console.warn(`⚠️ processImage failed: ${err.message}`)
		return null
	}
}

// Post to Facebook Page
async function postToFacebook(caption, link, imageUrl, rawTitle, pageSetting, dbPostId) {
	const { pageId } = pageSetting
	const pageAccessToken = decryptToken(pageSetting.pageAccessToken)

	if (!pageAccessToken || !pageId) throw new Error('Missing Facebook Page ID or Access Token')

	const fullCaption = `${caption}\n\n#Liverpool #LFC #YNWA #คอบอลเดอะค็อป #ลิเวอร์พูล`
	const commentText = `อ่านรายละเอียดข่าวฉบับเต็มได้ที่นี่ 👇\n${link}`
	let fbPostId = null

	if (pageSetting.postAsPhoto && imageUrl) {
		// Extract Thai title from caption (it's the first line before \n\n)
		const thTitle = caption.split('\n\n')[0] || rawTitle
		// Process image: resize 1080×1080 + gradient + text + logo
		const processedBuf = await processImage(imageUrl, rawTitle, thTitle, pageSetting.addTextOnImage)

		if (processedBuf) {
			// Upload as multipart buffer (not URL)
			const photoForm = new FormData()
			photoForm.append('source', processedBuf, { filename: 'photo.jpg', contentType: 'image/jpeg' })
			photoForm.append('message', fullCaption)
			photoForm.append('access_token', pageAccessToken)

			const response = await axios.post(
				`https://graph.facebook.com/v20.0/${pageId}/photos`,
				photoForm,
				{ headers: photoForm.getHeaders() }
			)
			fbPostId = response.data.id
		} else {
			// Fallback to link post if image processing fails
			console.warn('⚠️ Image processing failed, falling back to link post')
			const response = await axios.post(
				`https://graph.facebook.com/v20.0/${pageId}/feed`,
				{ message: fullCaption, link, access_token: pageAccessToken }
			)
			fbPostId = response.data.id
		}
	} else {
		// 1. Post as Link Preview (100% Copyright Safe, Default)
		const response = await axios.post(
			`https://graph.facebook.com/v20.0/${pageId}/feed`,
			{ message: fullCaption, link, access_token: pageAccessToken }
		)
		fbPostId = response.data.id
	}

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

		// 3. Post Affiliate Comment
		if (pageSetting.affiliateEnabled && pageSetting.affiliateLinks) {
			try {
				const links = JSON.parse(pageSetting.affiliateLinks)
				if (links.length > 0) {
					let selectedLink = null
					let newIndex = pageSetting.lastAffiliateIndex || 0

					if (pageSetting.affiliateMode === 'fixed') {
						selectedLink = links[0]
					} else if (pageSetting.affiliateMode === 'random') {
						selectedLink = links[Math.floor(Math.random() * links.length)]
					} else { // rotate
						if (newIndex >= links.length) newIndex = 0
						selectedLink = links[newIndex]
						newIndex++
						
						// Update db for next rotation
						await prisma.pageSetting.update({
							where: { userId: pageSetting.userId },
							data: { lastAffiliateIndex: newIndex }
						})
					}

					if (selectedLink) {
						const ctaText = pageSetting.affiliateTag || 'ช้อปสินค้า Liverpool แท้'
						
						// Use raw Shopee link so Facebook shows Shopee preview
						const affiliateComment = `${ctaText}\n${selectedLink.url}`
						
						await axios.post(
							`https://graph.facebook.com/v20.0/${fbPostId}/comments`,
							{ message: affiliateComment, access_token: pageAccessToken }
						)
						console.log(`🛍️ Added Affiliate comment to post ${fbPostId}`)
					}
				}
			} catch (affiliateErr) {
				console.error(`⚠️ Failed to add affiliate comment:`, affiliateErr.response?.data || affiliateErr.message)
			}
		}

		return fbPostId
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

		const articleImageUrl = latest.image || await getArticleImage(latest.link)

		console.log(`📢 Posting for User [${pageSetting.userId}]...`)
		const fbPostId = await postToFacebook(thaiSummary, latest.link, articleImageUrl, latest.title, pageSetting, post.id)

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