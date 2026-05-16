/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config'
import cron from 'node-cron'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { GoogleAuth } from 'google-auth-library'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { unlinkSync } from 'fs'
import { tmpdir } from 'os'
import FormData from 'form-data'
import * as cheerio from 'cheerio'

const { Pool } = pg

// Initialize Prisma
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Initialize Google Auth
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const keyPath = path.resolve(process.cwd(), 'vertex-key.json')
const auth = new GoogleAuth({ keyFile: keyPath, scopes: ['https://www.googleapis.com/auth/cloud-platform'] })

const RSS_FEEDS = [
	'https://www.bbc.co.uk/sport/football/teams/liverpool/rss.xml',
	'https://www.liverpoolecho.co.uk/rss/sport/football/liverpool-fc.xml',
]

// Scrape news from official Liverpool FC website
async function scrapeOfficialSite() {
	try {
		const response = await axios.get('https://www.liverpoolfc.com/news', {
			timeout: 10000,
			headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
		})

		const $ = cheerio.load(response.data)
		const items = []

		// ดึง article links และ titles
		$('a[href*="/news/"]').each((_, el) => {
			const title = $(el).text().trim()
			const href = $(el).attr('href')
			const link = href.startsWith('http') ? href : `https://www.liverpoolfc.com${href}`

			if (title && title.length > 20 && link.includes('/news/')) {
				items.push({ title, link, description: title })
			}
		})

		// Remove duplicates
		const unique = [...new Map(items.map(i => [i.link, i])).values()]
		console.log(`✅ Scraped ${unique.length} items from liverpoolfc.com`)
		return unique.slice(0, 10)
	} catch (err) {
		console.warn(`⚠️ Scrape failed: ${err.message}`)
		return []
	}
}

// Parse RSS XML to array
function parseRSS(xmlText) {
	const items = []
	const itemRegex = /<item>([\s\S]*?)<\/item>/g
	let match

	while ((match = itemRegex.exec(xmlText)) !== null) {
		const itemXml = match[1]
		const title = (itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
			itemXml.match(/<title>(.*?)<\/title>/) || [])[1] || ''
		const link = (itemXml.match(/<link>(.*?)<\/link>/) || [])[1] || ''
		const description = (itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
			itemXml.match(/<description>(.*?)<\/description>/) || [])[1] || ''

		if (title) {
			items.push({
				title: title.trim(),
				link: link.trim(),
				description: description.replace(/<[^>]+>/g, '').trim().slice(0, 500),
			})
		}
	}
	return items
}

// Fetch Liverpool news from all RSS feeds — collect all items
async function fetchNews() {
	const allItems = []

	// Scrape official site
	const officialNews = await scrapeOfficialSite()
	allItems.push(...officialNews)

	// Fetch RSS feeds
	for (const feedUrl of RSS_FEEDS) {
		try {
			const response = await axios.get(feedUrl, {
				timeout: 10000,
				headers: { 'User-Agent': 'TheKopBot/1.0' },
			})
			const items = parseRSS(response.data)
			if (items.length > 0) {
				console.log(`✅ Fetched ${items.length} items from ${feedUrl}`)
				allItems.push(...items)
			}
		} catch (err) {
			console.warn(`⚠️ Failed to fetch ${feedUrl}: ${err.message}`)
		}
	}

	return allItems
}

// Summarize news in Thai using Gemini
async function summarizeThai(title, description) {
	try {
		const client = await auth.getClient()
		const projectId = await auth.getProjectId()
		const location = 'us-central1'
		const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.0-flash-001:generateContent`

		const response = await client.request({
			url,
			method: 'POST',
			data: {
				contents: [{
					role: 'user',
					parts: [{ text: `สรุปข่าวฟุตบอลลิเวอร์พูลต่อไปนี้เป็นภาษาไทย ให้กระชับ น่าอ่าน ไม่เกิน 3 ประโยค:\n\nหัวข้อ: ${title}\nเนื้อหา: ${description}\n\nตอบเป็นภาษาไทยเท่านั้น ไม่ต้องมีคำนำ` }]
				}],
				generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
			}
		})

		const text = response.data.candidates[0].content.parts[0].text.trim()
		console.log(`🤖 Summarized in Thai`)
		return text
	} catch (err) {
		console.warn(`⚠️ Gemini error: ${err.message}`)
		return description
	}
}

// Auto-refresh Facebook Long-lived Token
async function refreshFacebookToken() {
	try {
		const { APP_ID, APP_SECRET, PAGE_ACCESS_TOKEN } = process.env

		const response = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
			params: {
				grant_type: 'fb_exchange_token',
				client_id: APP_ID,
				client_secret: APP_SECRET,
				fb_exchange_token: PAGE_ACCESS_TOKEN,
			},
		})

		const newToken = response.data.access_token
		process.env.PAGE_ACCESS_TOKEN = newToken
		console.log('🔄 Facebook token refreshed successfully')
	} catch (err) {
		console.warn(`⚠️ Token refresh failed: ${err.message}`)
	}
}

// Extract score from news title only (e.g. "4-2", "3-1") — must be short numbers
function extractScore(title) {
	const match = title.match(/\b([0-9]{1,2})[-:]([0-9]{1,2})\b/)
	if (match) {
		const a = parseInt(match[1])
		const b = parseInt(match[2])
		// Ignore if numbers look like a year or date
		if (a > 20 || b > 20) return null
		return `${a} - ${b}`
	}
	return null
}

// Generate image using Imagen via Vertex AI
async function generateImage(title, thaiSummary) {
	try {
		const client = await auth.getClient()
		const projectId = await auth.getProjectId()
		const location = 'us-central1'

		// Generate English image prompt via Gemini
		const translateUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.0-flash-001:generateContent`

		const translateRes = await client.request({
			url: translateUrl,
			method: 'POST',
			data: {
				contents: [{
					role: 'user',
					parts: [{ text: `Create a short English image prompt (max 50 words) for a Liverpool FC news article. Make it dramatic football photography style. DO NOT include any scores, numbers, text, or scoreboards in the image. Focus only on player emotions, crowd atmosphere, and stadium. News: ${title}. Output ONLY the prompt, no explanation.` }]
				}],
				generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
			}
		})

		const imagePrompt = translateRes.data.candidates[0].content.parts[0].text.trim()
		console.log(`🎨 Image prompt: ${imagePrompt}`)

		// Generate image with Imagen
		const imagenUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`

		const imagenRes = await client.request({
			url: imagenUrl,
			method: 'POST',
			data: {
				instances: [{ prompt: imagePrompt }],
				parameters: {
					sampleCount: 1,
					aspectRatio: '1:1',
					safetySetting: 'block_most',
				}
			}
		})

		const base64Image = imagenRes.data.predictions[0].bytesBase64Encoded
		console.log('🖼️ Image generated successfully')
		return base64Image
	} catch (err) {
		console.warn(`⚠️ Image generation failed: ${err.message}`)
		return null
	}
}

// Post to Facebook with image
async function postToFacebook(thaiSummary, link, imageBase64, title = '') {
	const pageId = process.env.PAGE_ID
	const accessToken = process.env.PAGE_ACCESS_TOKEN

	if (!pageId || !accessToken) {
		throw new Error('PAGE_ID or PAGE_ACCESS_TOKEN not set')
	}

	const caption = `${thaiSummary}

	อ่านต่อได้ที่: ${link}

	#Liverpool #LFC #YNWA #คอบอลเดอะค็อป #ลิเวอร์พูล `

	if (imageBase64) {
		const imgBuffer = Buffer.from(imageBase64, 'base64')

		// Overlay score on image if found in title
		const score = extractScore(title)
		let processor = sharp(imgBuffer)

		if (score) {
			const width = 1024
			const svgOverlay = `
				<svg width="${width}" height="120">
					<rect x="0" y="0" width="${width}" height="120" fill="rgba(0,0,0,0.65)" rx="0"/>
					<text x="50%" y="75" font-family="Arial Black, Arial" font-size="72" font-weight="900"
						fill="white" text-anchor="middle" dominant-baseline="middle"
						letter-spacing="8">${score}</text>
				</svg>`

			processor = processor.composite([{
				input: Buffer.from(svgOverlay),
				gravity: 'south',
			}])
			console.log(`🏆 Score overlay added: ${score}`)
		}

		const jpgBuffer = await processor.jpeg({ quality: 90 }).toBuffer()

		// Upload image to Facebook
		const formData = new FormData()
		formData.append('message', caption)
		formData.append('source', jpgBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
		formData.append('access_token', accessToken)

		const response = await axios.post(
			`https://graph.facebook.com/v20.0/${pageId}/photos`,
			formData,
			{ headers: formData.getHeaders() }
		)

		return response.data.id
	}

	// Fallback: post without image
	const response = await axios.post(
		`https://graph.facebook.com/v20.0/${pageId}/feed`,
		{ message: caption, link, access_token: accessToken }
	)
	return response.data.id
}

// Core bot function
async function runBot() {
	try {
		console.log('📰 Fetching Liverpool news...')
		const news = await fetchNews()

		if (!news.length) {
			console.warn('⚠️ No new articles found')
			return
		}

		const latest = news[0]

		// Summarize in Thai using Gemini
		console.log('🤖 Summarizing in Thai...')
		const thaiSummary = await summarizeThai(latest.title, latest.description)

		// Save to DB with PENDING status
		const post = await prisma.post.create({
			data: {
				title: latest.title,
				content: thaiSummary,
				link: latest.link,
				status: 'PENDING',
			},
		})

		// Generate AI image
		console.log('🎨 Generating AI image...')
		const imageBase64 = await generateImage(latest.title, thaiSummary)

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
	}
}

// Schedule posts at 08:00, 12:00, 20:00 (UTC+7)
cron.schedule('0 1 * * *', runBot)  // 08:00 TH
cron.schedule('0 5 * * *', runBot)  // 12:00 TH
cron.schedule('0 13 * * *', runBot) // 20:00 TH

// Auto-refresh token every 50 days
cron.schedule('0 0 */50 * *', refreshFacebookToken)

console.log('🔴 The Kop Bot started...')
runBot()
