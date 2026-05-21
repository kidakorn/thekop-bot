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
import FormData from 'form-data'
import * as cheerio from 'cheerio'
import textToSpeech from '@google-cloud/text-to-speech'
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs'

const { Pool } = pg

// Initialize Prisma
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Initialize Google Auth
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const keyPath = path.resolve(process.cwd(), 'vertex-key.json')
const auth = new GoogleAuth({ keyFile: keyPath, scopes: ['https://www.googleapis.com/auth/cloud-platform'] })

const assetKeywords = [
	// Players
	{ file: 'Alexis_Mac_Allister.webp', type: 'players', keywords: ['mac allister', 'alexis', 'แม็ค อัลลิสเตอร์', 'แม็คอัลลิสเตอร์', 'อเล็กซิส'] },
	{ file: 'Alisson_Becker.webp', type: 'players', keywords: ['alisson', 'becker', 'อลิสซอน', 'เบ็คเกอร์', 'อลิสซัน'] },
	{ file: 'Andy_Robertson.webp', type: 'players', keywords: ['robertson', 'andy', 'โรเบิร์ตสัน', 'แอนดี้', 'ร็อบโบ้'] },
	{ file: 'Cody_Gakpo.webp', type: 'players', keywords: ['gakpo', 'cody', 'กัคโป', 'โคดี้'] },
	{ file: 'Conor_Bradley.webp', type: 'players', keywords: ['bradley', 'conor', 'แบรดลีย์', 'คอเนอร์'] },
	{ file: 'Curtis_Jones.webp', type: 'players', keywords: ['jones', 'curtis', 'โจนส์', 'เคอร์ติส'] },
	{ file: 'Diogo_Jota.webp', type: 'players', keywords: ['jota', 'diogo', 'โชต้า', 'ดิโอโก้'] },
	{ file: 'Dominik_Szoboszlai.webp', type: 'players', keywords: ['szoboszlai', 'dominik', 'โซบอสไล', 'โดมินิก'] },
	{ file: 'Federico_Chiesa.webp', type: 'players', keywords: ['chiesa', 'federico', 'เคียซ่า', 'เฟเดริโก้'] },
	{ file: 'Florian_Wirtz.webp', type: 'players', keywords: ['wirtz', 'florian', 'เวียร์ตซ์', 'ฟลอเรียน'] },
	{ file: 'Freddie_Woodman.webp', type: 'players', keywords: ['woodman', 'freddie', 'วู้ดแมน', 'เฟรดดี้'] },
	{ file: 'Giorgi_Mamardashvili.webp', type: 'players', keywords: ['mamardashvili', 'giorgi', 'มามาร์ดาชวิลี', 'จอร์จี้'] },
	{ file: 'Giovanni_Leoni.webp', type: 'players', keywords: ['leoni', 'giovanni', 'เลโอนี', 'โจวันนี'] },
	{ file: 'Harvey_Elliott.webp', type: 'players', keywords: ['elliott', 'harvey', 'เอลเลียต', 'ฮาร์วีย์'] },
	{ file: 'Hugo_Ekitike.webp', type: 'players', keywords: ['ekitike', 'hugo', 'เอกิติเก้', 'ฮูโก้'] },
	{ file: 'Ibrahima_Konate.webp', type: 'players', keywords: ['konate', 'ibrahima', 'โกนาเต้', 'อิบู', 'อิบราฮิมา'] },
	{ file: 'Jeremie_Frimpong.webp', type: 'players', keywords: ['frimpong', 'jeremie', 'ฟริมปง', 'เจเรมี่'] },
	{ file: 'Joe_Gomez.webp', type: 'players', keywords: ['gomez', 'joe', 'โกเมซ', 'โจ'] },
	{ file: 'Kostas_Tsimikas.webp', type: 'players', keywords: ['tsimikas', 'kostas', 'ซิมิกาส', 'คอสตาส'] },
	{ file: 'Milos_Kerkez.webp', type: 'players', keywords: ['kerkez', 'milos', 'เคอร์เคซ', 'มิลอส'] },
	{ file: 'Mohamed_Salah.webp', type: 'players', keywords: ['salah', 'mohamed', 'ซาลาห์', 'โมฮาเหม็ด', 'บังโม'] },
	{ file: 'Rio_Ngumoha.webp', type: 'players', keywords: ['ngumoha', 'rio', 'เอ็นกูโมฮา', 'ริโอ'] },
	{ file: 'Ryan_Gravenberch.webp', type: 'players', keywords: ['gravenberch', 'ryan', 'กราเฟนแบร์ก', 'ไรอัน'] },
	{ file: 'Virgil_van_Dijk.webp', type: 'players', keywords: ['van dijk', 'virgil', 'ฟาน ไดจ์ค', 'ฟานไดจ์ค', 'เวอร์จิล'] },
	{ file: 'Wataru_Endo.webp', type: 'players', keywords: ['endo', 'wataru', 'เอนโด', 'วาตารุ', 'เอ็นโด'] },
	// Staff
	{ file: 'Arne_Slot.webp', type: 'staff', keywords: ['slot', 'arne', 'สล็อต', 'อาร์เน่'] },
	{ file: 'Giovanni_van_Bronckhorst.webp', type: 'staff', keywords: ['bronckhorst', 'giovanni', 'บร็องฮอร์สต์', 'โจวันนี'] },
	{ file: 'Sipke_Hulshoff.webp', type: 'staff', keywords: ['hulshoff', 'sipke', 'ฮัลชอฟฟ์', 'ซิปเก้'] },
	// Stadium
	{ file: 'Anfield.webp', type: 'stadium', keywords: ['anfield', 'แอนฟิลด์'] }
]

function getMatchedAsset(title, thaiSummary) {
	const text = `${title} ${thaiSummary || ''}`.toLowerCase()
	for (const item of assetKeywords) {
		if (item.keywords.some(kw => text.includes(kw))) {
			const filePath = path.join(process.cwd(), 'assets', item.type, item.file)
			if (existsSync(filePath)) {
				try {
					const base64 = readFileSync(filePath).toString('base64')
					return {
						name: item.file.replace('.webp', '').replace(/_/g, ' '),
						type: item.type,
						file: item.file,
						filePath,
						base64
					}
				} catch (err) {
					console.warn(`⚠️ Failed to read asset ${filePath}: ${err.message}`)
				}
			}
		}
	}
	return null
}

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
		const title = (itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
			itemXml.match(/<title>(.*?)<\/title>/) || [])[1] || ''
		const link = (itemXml.match(/<link>(.*?)<\/link>/) || [])[1] || ''
		const description = (itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
			itemXml.match(/<description>(.*?)<\/description>/) || [])[1] || ''
		const pubDate = (itemXml.match(/<pubDate><!\[CDATA\[(.*?)\]\]><\/pubDate>/) ||
			itemXml.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || ''

		if (title) {
			let pubDateMs = 0
			if (pubDate) {
				try {
					pubDateMs = Date.parse(pubDate.trim())
				} catch (e) {
					// Ignore
				}
			}
			items.push({
				title: title.trim(),
				link: link.trim(),
				description: description.replace(/<[^>]+>/g, '').trim().slice(0, 500),
				pubDate: pubDate.trim(),
				pubDateMs: isNaN(pubDateMs) ? 0 : pubDateMs
			})
		}
	}
	return items
}

// Fetch Liverpool news from all RSS feeds
async function fetchNews() {
	const allItems = []

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

	// Filter out Women's, Academy, and Youth team news to keep only Men's First Team
	const excludeKeywords = [
		'women', 'ladies', 'u21', 'u18', 'u-21', 'u-18',
		'academy', 'youth', 'lfc women', 'female', 'wsl',
		'bonner', 'ejupi', 'defined moments'
	]
	const firstTeamNews = allItems.filter(item => {
		const text = (item.title + ' ' + item.link).toLowerCase()
		return !excludeKeywords.some(kw => text.includes(kw))
	})

	// Filter out news older than 24 hours
	const now = Date.now()
	const twentyFourHours = 24 * 60 * 60 * 1000
	const freshNews = firstTeamNews.filter(item => {
		if (item.pubDateMs) {
			const age = now - item.pubDateMs
			if (age > twentyFourHours) {
				return false
			}
		}
		return true
	})

	return freshNews
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

// Find reference image from assets folder based on news title
function findReferenceImage(title) {
	const titleLower = title.toLowerCase()

	// Map names to filenames
	const playerMap = {
		'salah': 'Mohamed_Salah',
		'van dijk': 'Virgil_van_Dijk',
		'robertson': 'Andy_Robertson',
		'trent': 'Trent_Alexander-Arnold',
		'mac allister': 'Alexis_Mac_Allister',
		'szoboszlai': 'Dominik_Szoboszlai',
		'wirtz': 'Florian_Wirtz',
		'gravenberch': 'Ryan_Gravenberch',
		'gakpo': 'Cody_Gakpo',
		'chiesa': 'Federico_Chiesa',
		'elliott': 'Harvey_Elliott',
		'bradley': 'Conor_Bradley',
		'frimpong': 'Jeremie_Frimpong',
		'kerkez': 'Milos_Kerkez',
		'gomez': 'Joe_Gomez',
		'konate': 'Ibrahima_Konate',
		'endo': 'Wataru_Endo',
		'jones': 'Curtis_Jones',
		'ekitike': 'Hugo_Ekitike',
		'jota': 'Diogo_Jota',
		'leoni': 'Giovanni_Leoni',
		'mamardashvili': 'Giorgi_Mamardashvili',
		'woodman': 'Freddie_Woodman',
		'tsimikas': 'Kostas_Tsimikas',
		'ngumoha': 'Rio_Ngumoha',
		'slot': 'Arne_Slot',
		'van bronckhorst': 'Giovanni_van_Bronckhorst',
		'hulshoff': 'Sioke_Hulshoff',
	}

	// If transfer news about non-Liverpool player — use Anfield
	const transferKeywords = ['bowen', 'isak', 'xabi', 'rooney', 'carragher', 'gerrard', 'transfer', 'signing', 'bid', 'target', 'loan']
	for (const keyword of transferKeywords) {
		if (titleLower.includes(keyword)) {
			// Check if it's NOT a current Liverpool player
			const isLiverpoolPlayer = Object.keys(playerMap).some(k => titleLower.includes(k))
			if (!isLiverpoolPlayer) {
				console.log('⚽ Transfer news — using Anfield reference')
				const stadiumPath = path.resolve(process.cwd(), 'assets/stadium/Anfield.webp')
				if (existsSync(stadiumPath)) return stadiumPath
			}
		}
	}

	// Find matching player
	for (const [keyword, filename] of Object.entries(playerMap)) {
		if (titleLower.includes(keyword)) {
			const extensions = ['.webp', '.jpg', '.jpeg', '.png']
			for (const ext of extensions) {
				const filePath = path.resolve(process.cwd(), `assets/players/${filename}${ext}`)
				if (existsSync(filePath)) {
					console.log(`🖼️ Found reference: ${filename}`)
					return filePath
				}
				// Check staff folder
				const staffPath = path.resolve(process.cwd(), `assets/staff/${filename}${ext}`)
				if (existsSync(staffPath)) {
					console.log(`🖼️ Found staff reference: ${filename}`)
					return staffPath
				}
			}
		}
	}

	// Fallback to Anfield stadium
	const stadiumPath = path.resolve(process.cwd(), 'assets/stadium/Anfield.webp')
	if (existsSync(stadiumPath)) {
		console.log('🏟️ Using Anfield as reference')
		return stadiumPath
	}

	return null
}

// Generate image using Imagen via Vertex AI
async function generateImage(title, thaiSummary) {
	try {
		const client = await auth.getClient()
		const projectId = await auth.getProjectId()
		const location = 'us-central1'
		const refImagePath = findReferenceImage(title)

		let refBase64 = ''
		let mimeType = ''
		if (refImagePath) {
			const refBuffer = readFileSync(refImagePath)
			refBase64 = refBuffer.toString('base64')
			const ext = path.extname(refImagePath).toLowerCase()
			mimeType = ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg'
		}

		// Check for matched asset reference
		const matchedAsset = getMatchedAsset(title, thaiSummary)
		let imagePrompt = 'TRANSFER NEWS RULE: If the news is about a transfer target or non-Liverpool player, DO NOT draw any specific person. Instead draw: a red pen signing a contract, or Anfield stadium exterior, or a Liverpool FC shirt on a hanger.'
		let imagenUrl = ''
		let requestData = {}

		if (matchedAsset) {
			console.log(`ℹ️ Matched asset reference for image: ${matchedAsset.name} (${matchedAsset.type}/${matchedAsset.file})`)

			// For subject reference, we use imagen-3.0-capability-001
			imagenUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-capability-001:predict`

			const translateUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.0-flash-001:generateContent`
			const translateRes = await client.request({
				url: translateUrl,
				method: 'POST',
				data: {
					contents: [{
						role: 'user',
						parts: [{
							text: `You are a professional sports photographer AI.
Create a simple cinematic English image prompt (max 30 words) for a Liverpool FC news article featuring the subject [1] from the reference image.
Keep the prompt extremely simple, focusing on the portrait or action of [1] to preserve their likeness.

STRICT RULES:
1. Focus heavily on [1]. Describe only [1]'s facial expression or simple pose.
2. Refer to the subject in the reference image [1] as "[1]" (e.g. 'A portrait of [1] in a red kit looking determined').
3. DO NOT mention their real name ("${matchedAsset.name}") in the prompt, only refer to them as "[1]".
4. The subject [1] must wear the Liverpool FC bright red Nike kit (or manager attire if a manager).
5. Photorealistic DSLR sports photography, dramatic stadium lighting, bokeh background.
6. NO text, numbers, logos, or watermarks.
7. Match the emotional tone of this news: ${title}

Output ONLY the final prompt, no explanation.`}]
					}],
					generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
				}
			})

			imagePrompt = translateRes.data.candidates[0].content.parts[0].text.trim()

			// Replace any leaked name parts in case Gemini ignored the rule
			const nameParts = matchedAsset.name.toLowerCase().split(' ').filter(p => p.length > 2)
			for (const part of nameParts) {
				const regex = new RegExp(part, 'gi')
				imagePrompt = imagePrompt.replace(regex, '[1]')
			}
			console.log(`🎨 Image prompt with reference [1]: ${imagePrompt}`)

			requestData = {
				instances: [{
					prompt: imagePrompt,
					referenceImages: [
						{
							referenceId: 1,
							referenceType: 'REFERENCE_TYPE_SUBJECT',
							referenceImage: {
								bytesBase64Encoded: matchedAsset.base64
							}
						}
					]
				}],
				parameters: {
					sampleCount: 1,
					aspectRatio: '1:1',
					safetySetting: 'block_most',
				}
			}
		} else {
			console.log('ℹ️ No asset reference matched. Using standard text-to-image.')
			imagenUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`

			const translateUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.0-flash-001:generateContent`
			const translateRes = await client.request({
				url: translateUrl,
				method: 'POST',
				data: {
					contents: [{
						role: 'user',
						parts: [{
							text: `You are a professional sports photographer AI. Create a cinematic English image prompt (max 60 words) for a Liverpool FC news article.

STRICT RULES — follow every rule or the image will be rejected:
1. DO NOT mention any real person's name (no Salah, Slot, Van Dijk, etc.)
2. DO NOT generate faces of real people — use silhouettes, back views, or crowd shots instead
3. Focus ONLY on: stadium atmosphere, football action, crowd emotion, trophy, ball, boots, or pitch
4. Liverpool FC bright red Nike 2025-26 kit, Anfield stadium with expanded Anfield Road end
5. Photorealistic DSLR sports photography, dramatic stadium lighting, bokeh background
6. NO text, numbers, scoreboards, logos, or watermarks in the image
7. Match the emotional tone of this news: ${title}

Good examples:
- "A red-shirted player's boots striking a ball, dramatic Anfield floodlights, bokeh crowd background"
- "Anfield stadium aerial view at night, floodlights blazing, packed crowd in red"
- "Close-up of a Liverpool FC red jersey chest badge, rain droplets, dramatic lighting"

Output ONLY the final prompt, no explanation.`}]
					}],
					generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
				}
			})

			imagePrompt = translateRes.data.candidates[0].content.parts[0].text.trim()
			console.log(`🎨 Standard Image prompt: ${imagePrompt}`)

			if (refBase64) {
				requestData = {
					instances: [{
						prompt: imagePrompt,
						image: {
							bytesBase64Encoded: refBase64,
							mimeType: mimeType
						}
					}],
					parameters: {
						sampleCount: 1,
						aspectRatio: '1:1',
						safetySetting: 'block_most',
					}
				}
			} else {
				requestData = {
					instances: [{ prompt: imagePrompt }],
					parameters: {
						sampleCount: 1,
						aspectRatio: '1:1',
						safetySetting: 'block_most',
					}
				}
			}
		}

		// Generate image with Imagen
		const imagenRes = await client.request({
			url: imagenUrl,
			method: 'POST',
			data: requestData
		})

		const base64Image = imagenRes.data.predictions[0].bytesBase64Encoded
		console.log('🖼️ Image generated successfully')
		return base64Image
	} catch (err) {
		console.warn(`⚠️ Image generation failed: ${err.message}`)
		return null
	}
}

// Generate video script in Thai using Gemini
async function generateVideoScript(title, thaiSummary, matchedAsset = null) {
	try {
		const client = await auth.getClient()
		const projectId = await auth.getProjectId()
		const location = 'us-central1'
		const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.0-flash-001:generateContent`

		// Always use B-roll — never generate human faces (always looks wrong)
		let videoPromptRules
		if (matchedAsset && matchedAsset.type === 'stadium') {
			videoPromptRules = `Cinematic B-roll of Anfield stadium at night, floodlights blazing, packed red crowd, slow camera pan. ABSOLUTELY NO TEXT, NO letters, NO logos. Photorealistic, atmospheric.`
		} else {
			videoPromptRules = `A short English cinematic B-roll video (max 40 words) matching the news mood. ABSOLUTE RULES: NO human faces, NO people, NO players, NO coaches, NO text, NO letters, NO words, NO numbers, NO logos, NO crests, NO signs, NO banners. ONLY show: football rolling on wet grass, stadium floodlights at night, empty Anfield red seats, rain on pitch, close-up of football boots, net rippling, crowd silhouettes from behind. Photorealistic, cinematic slow motion, dramatic lighting.`
		}

		const response = await client.request({
			url,
			method: 'POST',
			data: {
				contents: [{
					role: 'user',
					parts: [{
						text: `สร้าง script สำหรับวิดีโอข่าวฟุตบอลลิเวอร์พูล ความยาว 20-25 วินาที

หัวข้อ: ${title}
สรุป: ${thaiSummary}

Video prompt rules: ${videoPromptRules}

ตอบเป็น JSON เท่านั้น ไม่มีคำอธิบาย ไม่มี markdown:
{
  "videoPrompt": "ใส่ video prompt ภาษาอังกฤษตาม rules ด้านบน",
  "subtitles": [
    { "start": 0, "end": 5, "text": "ข้อความภาษาไทย บรรทัดที่ 1" },
    { "start": 5, "end": 10, "text": "ข้อความภาษาไทย บรรทัดที่ 2" },
    { "start": 10, "end": 15, "text": "ข้อความภาษาไทย บรรทัดที่ 3" },
    { "start": 15, "end": 20, "text": "ข้อความภาษาไทย บรรทัดที่ 4" }
  ]
}` }]
				}],
				generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
			}
		})

		const raw = response.data.candidates[0].content.parts[0].text.trim()
		const clean = raw.replace(/```json|```/g, '').trim()
		return JSON.parse(clean)
	} catch (err) {
		console.warn(`⚠️ Script generation failed: ${err.message}`)
		return null
	}
}

// Generate video using Veo via Vertex AI
async function generateVideo(videoPrompt, refImageBase64 = null) {
	try {
		const { GoogleGenAI } = await import('@google/genai')
		const client = new GoogleGenAI({ vertexai: true, project: 'devakorn-creator-ai', location: 'us-central1' })

		console.log('🎬 Submitting video job to Veo...')
		const requestParams = {
			model: 'veo-2.0-generate-001',
			prompt: videoPrompt,
			config: { aspectRatio: '9:16', durationSeconds: 8 },
		}

		if (refImageBase64) {
			console.log('ℹ️ Attaching reference image to Veo video job...')
			requestParams.input = {
				image: {
					imageBytes: refImageBase64,
					mimeType: 'image/webp'
				}
			}
		}

		let operation = await client.models.generateVideos(requestParams)

		console.log('⏳ Waiting for Veo to render...')
		while (!operation.done) {
			await new Promise(resolve => setTimeout(resolve, 15000))
			operation = await client.operations.get({ operation })
			console.log('⏳ Still rendering...')
		}

		if (operation.error) {
			throw new Error(`Veo operation failed: ${JSON.stringify(operation.error)}`)
		}

		const videoData = operation.response?.generatedVideos?.[0]?.video
		if (!videoData) throw new Error('No video data received')

		if (videoData.videoBytes) {
			return typeof videoData.videoBytes === 'string'
				? videoData.videoBytes
				: Buffer.from(videoData.videoBytes).toString('base64')
		}

		throw new Error('No video bytes in response')
	} catch (err) {
		console.warn(`⚠️ Veo generation failed: ${err.message}`)
		return null
	}
}

// Generate Thai voiceover using Google Cloud TTS
async function generateVoiceover(text) {
	try {
		console.log('🗣️ Generating voiceover...')
		const client = new textToSpeech.TextToSpeechClient({ keyFilename: keyPath })
		const request = {
			input: { text },
			voice: { languageCode: 'th-TH', name: 'th-TH-Chirp3-HD-Puck' }, // High-quality Male voice
			audioConfig: { audioEncoding: 'MP3', speakingRate: 1.15 },
		}
		const [response] = await client.synthesizeSpeech(request)
		return response.audioContent.toString('base64')
	} catch (err) {
		console.warn(`⚠️ Voiceover generation failed: ${err.message}`)
		return null
	}
}

// Burn Thai subtitles and mix voiceover into video using ffmpeg
async function burnSubtitlesAndAudio(videoBase64, subtitles, audioBase64) {
	try {
		const tmpDir = path.join(process.cwd(), 'tmp')
		if (!existsSync(tmpDir)) mkdirSync(tmpDir)

		const inputPath = path.join(tmpDir, `input_${Date.now()}.mp4`)
		const srtPath = path.join(tmpDir, `subs_${Date.now()}.srt`)
		const audioPath = path.join(tmpDir, `audio_${Date.now()}.mp3`)
		const outputPath = path.join(tmpDir, `output_${Date.now()}.mp4`)

		// Write video file
		writeFileSync(inputPath, Buffer.from(videoBase64, 'base64'))

		// Write audio file if exists
		if (audioBase64) writeFileSync(audioPath, Buffer.from(audioBase64, 'base64'))

		// Write SRT subtitle file
		const srtContent = subtitles.map((sub, i) => {
			const toTime = (s) => {
				const h = Math.floor(s / 3600).toString().padStart(2, '0')
				const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
				const sec = (s % 60).toString().padStart(2, '0')
				return `${h}:${m}:${sec},000`
			}
			return `${i + 1}\n${toTime(sub.start)} --> ${toTime(sub.end)}\n${sub.text}\n`
		}).join('\n')

		writeFileSync(srtPath, srtContent, 'utf8')

		// Execute ffmpeg with audio and subtitles
		const bInputPath = path.basename(inputPath)
		const bSrtPath = path.basename(srtPath)
		const bAudioPath = path.basename(audioPath)
		const bOutputPath = path.basename(outputPath)

		let ffmpegCmd = ''

		if (audioBase64) {
			ffmpegCmd = `ffmpeg -stream_loop -1 -i "${bInputPath}" -i "${bAudioPath}" -map 0:v:0 -map 1:a:0 -c:v libx264 -c:a aac -shortest "${bOutputPath}" -y`
		} else {
			ffmpegCmd = `ffmpeg -i "${bInputPath}" -c:a copy "${bOutputPath}" -y`
		}

		console.log('🔄 Running FFMPEG...')
		execSync(ffmpegCmd, { cwd: tmpDir, stdio: 'pipe' })

		const outputBase64 = readFileSync(outputPath).toString('base64')

		// Cleanup temp files
		try { unlinkSync(inputPath) } catch { }
		try { unlinkSync(srtPath) } catch { }
		try { unlinkSync(audioPath) } catch { }
		try { unlinkSync(outputPath) } catch { }

		console.log('🎬 Subtitles and Audio processed successfully')
		return outputBase64
	} catch (err) {
		console.warn(`⚠️ Video processing failed: ${err.message}`)
		return videoBase64
	}
}

// Post Reels to Facebook
async function postReel(thaiSummary, link, videoBase64) {
	const pageId = process.env.PAGE_ID
	const accessToken = process.env.PAGE_ACCESS_TOKEN

	if (!pageId || !accessToken) throw new Error('PAGE_ID or PAGE_ACCESS_TOKEN not set')

	const caption = `${thaiSummary}

📖 อ่านต่อได้ที่: ${link}

#Liverpool #LFC #YNWA #คอบอลเดอะค็อป #ลิเวอร์พูล #Reels`

	const videoBuffer = Buffer.from(videoBase64, 'base64')
	const formData = new FormData()
	formData.append('description', caption)
	formData.append('source', videoBuffer, { filename: 'reel.mp4', contentType: 'video/mp4' })
	formData.append('access_token', accessToken)

	const response = await axios.post(
		`https://graph.facebook.com/v20.0/${pageId}/videos`,
		formData,
		{ headers: formData.getHeaders(), timeout: 120000 }
	)

	return response.data.id
}

// Core Reels bot function
async function runReelBot() {
	let post = null
	try {
		console.log('🎬 Starting Reels bot...')
		const news = await fetchNews()

		if (!news.length) {
			console.warn('⚠️ No news found for Reels')
			return
		}

		// Check duplicates against last 24h
		const recentPosts = await prisma.post.findMany({
			where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
			select: { title: true }
		})

		const isDuplicate = (newTitle) => {
			const newWords = newTitle.toLowerCase().split(/[\\W_]+/).filter(w => w.length > 3)
			return recentPosts.some(p => {
				const oldWords = p.title.toLowerCase().split(/[\\W_]+/).filter(w => w.length > 3)
				const matchCount = newWords.filter(w => oldWords.includes(w)).length
				return matchCount >= 4 // If 4+ significant words match, it's a duplicate
			})
		}

		// Pick latest unposted news
		let latest = null
		for (const item of news) {
			const existing = await prisma.post.findFirst({ where: { link: item.link } })
			if (!existing && !isDuplicate(item.title)) { latest = item; break }
		}

		if (!latest) {
			console.warn('⚠️ No unposted articles for Reels')
			return
		}

		// Check matched asset reference
		const matchedAsset = getMatchedAsset(latest.title, null)

		// Generate Thai summary and video script
		console.log('🤖 Generating video script...')
		const thaiSummary = await summarizeThai(latest.title, latest.description)
		const script = await generateVideoScript(latest.title, thaiSummary, matchedAsset)

		if (!script) {
			console.warn('⚠️ No script generated')
			return
		}

		// Save to DB
		post = await prisma.post.create({
			data: {
				title: `[REEL] ${latest.title}`,
				content: thaiSummary,
				link: latest.link,
				status: 'PENDING',
			},
		})

		// Generate video with Veo
		console.log('🎬 Generating video with Veo...')
		const videoBase64 = await generateVideo(script.videoPrompt, matchedAsset ? matchedAsset.base64 : null)

		if (!videoBase64) {
			await prisma.post.update({ where: { id: post.id }, data: { status: 'FAILED' } })
			return
		}

		// Generate Voiceover with Google Cloud TTS
		const audioBase64 = await generateVoiceover(thaiSummary)

		// Burn Thai subtitles and Audio
		console.log('📝 Processing video with subtitles and voiceover...')
		const finalVideo = await burnSubtitlesAndAudio(videoBase64, script.subtitles, audioBase64)

		// Post as Reels
		console.log('📢 Posting Reels...')
		const fbPostId = await postReel(thaiSummary, latest.link, finalVideo)

		await prisma.post.update({
			where: { id: post.id },
			data: { status: 'POSTED', fbPostId, postedAt: new Date() },
		})

		console.log(`✅ Reel posted! FB Post ID: ${fbPostId}`)
	} catch (err) {
		console.error('❌ Reel bot error:', err.message)
		if (post?.id) {
			await prisma.post.update({
				where: { id: post.id },
				data: { status: 'FAILED' },
			})
		}
	}
}

// Fetch original article image (og:image)
async function getArticleImage(url) {
	try {
		const response = await axios.get(url, {
			timeout: 5000,
			headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
		})
		const match = response.data.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["'](.*?)["']/i)
		return match ? match[1] : null
	} catch (err) {
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
					<svg width="${width}" height="180">
						<!-- Broadcast Style Score Graphic (Bottom Left) -->
						<defs>
							<linearGradient id="darkBg" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" style="stop-color:#111111;stop-opacity:0.9" />
								<stop offset="100%" style="stop-color:#000000;stop-opacity:0.95" />
							</linearGradient>
							<linearGradient id="redAccent" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style="stop-color:#FF3333;stop-opacity:1" />
								<stop offset="100%" style="stop-color:#8B0000;stop-opacity:1" />
							</linearGradient>
							<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
								<feGaussianBlur stdDeviation="3" result="blur" />
								<feComposite in="SourceGraphic" in2="blur" operator="over"/>
							</filter>
						</defs>
						
						<!-- Main dark panel -->
						<rect x="40" y="40" width="340" height="100" fill="url(#darkBg)" rx="8" />
						
						<!-- Red accent line on the left -->
						<rect x="40" y="40" width="8" height="100" fill="url(#redAccent)" rx="4" />
						
						<!-- 'LIVERPOOL FC' text -->
						<text x="65" y="70" font-family="Arial, sans-serif" font-size="14" font-weight="bold"
						fill="#cccccc" letter-spacing="4">MATCH RESULT</text>
						
						<!-- SCORE text -->
						<text x="65" y="115" font-family="'Arial Black', Impact, sans-serif" font-size="42" font-weight="900"
						fill="#ffffff" letter-spacing="2" filter="url(#glow)">${score}</text>
						
						<!-- Little red dot / Live indicator -->
						<circle cx="350" cy="90" r="5" fill="#FF3333" filter="url(#glow)"/>
					</svg>`
			processor = processor.composite([{
				input: Buffer.from(svgOverlay),
				gravity: 'southwest',
			}])
			console.log(`🏆 Broadcast style score overlay added: ${score}`)
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

		// Summarize in Thai using Gemini
		console.log('🤖 Summarizing in Thai...')
		const thaiSummary = await summarizeThai(latest.title, latest.description)

		// Save to DB with PENDING status
		post = await prisma.post.create({
			data: {
				title: latest.title,
				content: thaiSummary,
				link: latest.link,
				status: 'PENDING',
			},
		})

		// Try article image from ANY source first, then 50/50 AI mix
		let imageBase64 = null
		const articleImageUrl = await getArticleImage(latest.link)
		if (articleImageUrl) {
			try {
				const imgRes = await axios.get(articleImageUrl, { responseType: 'arraybuffer', timeout: 10000 })
				const articleBase64 = Buffer.from(imgRes.data).toString('base64')
				// 50/50 chance between article image and AI generated
				if (Math.random() < 0.5) {
					imageBase64 = articleBase64
					console.log(`✅ Using article image`)
				} else {
					console.log('🎨 Using AI image (random mix)')
				}
			} catch (err) {
				console.warn('⚠️ Failed to download article image')
			}
		}

		if (!imageBase64) {
			console.log('🎨 Generating AI image...')
			imageBase64 = await generateImage(latest.title, thaiSummary)
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

let lastNewsRunTime = null
let lastReelsRunTime = null

async function checkAndRunSchedules() {
	try {
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: 'Asia/Bangkok',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23'
		})
		const timeStr = formatter.format(new Date())
		const dateStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok' })
		const runKey = `${dateStr} ${timeStr}`

		let newsTimes = ['08:00', '11:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
		let reelsTimes = ['09:30', '13:30', '17:30', '19:30', '21:30', '23:30']

		try {
			const dbNewsSetting = await prisma.setting.findUnique({ where: { key: 'news_schedule' } })
			if (dbNewsSetting) {
				newsTimes = JSON.parse(dbNewsSetting.value)
			}
			const dbReelsSetting = await prisma.setting.findUnique({ where: { key: 'reels_schedule' } })
			if (dbReelsSetting) {
				reelsTimes = JSON.parse(dbReelsSetting.value)
			}
		} catch (dbErr) {
			console.warn(`⚠️ Failed to fetch schedules from database: ${dbErr.message}. Using defaults.`)
		}

		// Check News
		if (newsTimes.includes(timeStr)) {
			if (lastNewsRunTime !== runKey) {
				lastNewsRunTime = runKey
				console.log(`⏰ [Scheduler] Matching News schedule at ${timeStr}. Running runBot...`)
				runBot()
			}
		}

		// Check Reels
		if (reelsTimes.includes(timeStr)) {
			if (lastReelsRunTime !== runKey) {
				lastReelsRunTime = runKey
				console.log(`⏰ [Scheduler] Matching Reels schedule at ${timeStr}. Running runReelBot...`)
				runReelBot()
			}
		}
	} catch (err) {
		console.error(`❌ Error in schedule checker: ${err.message}`)
	}
}

// Check every minute
cron.schedule('* * * * *', checkAndRunSchedules, { timezone: "Asia/Bangkok" })

// Auto-refresh token every 50 days
cron.schedule('0 0 */50 * *', refreshFacebookToken, { timezone: "Asia/Bangkok" })

console.log('🔴 The Kop Bot started...')