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
import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'

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

	return firstTeamNews
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
					parts: [{
						text: `You are a professional sports photographer AI. Create a cinematic English image prompt (max 60 words) for Liverpool FC news only.
						Rules:
						- IDENTIFY SUBJECTS: Extract specific CURRENT Liverpool players or manager from the news topic. EXPLICITLY include their full names in your image prompt.
						- PUNDITS & RIVALS RULE: If the news is about a pundit, legend, or rival (e.g., Wayne Rooney, Jamie Carragher, Xabi Alonso), DO NOT EVER draw them in a Liverpool kit. Instead, draw the CURRENT Liverpool player they are talking about (e.g., draw Mohamed Salah if Rooney is talking about Salah).
						- STRICT SUBJECT RULE: Focus on a SINGLE primary Liverpool player or manager Arne Slot. DO NOT draw multiple players. If no specific current Liverpool player is mentioned, default to drawing Mohamed Salah or Arne Slot.
						- Squad Reference for 25/26: Manager Arne Slot, Alisson, Mamardashvili, Van Dijk, Konate, Gomez, Robertson, Frimpong, Kerkez, Bradley, Mac Allister, Szoboszlai, Wirtz, Gravenberch, Jones, Endo, Salah, Isak, Gakpo, Chiesa, Ekitike.
						- STRICT KIT RULE: The Liverpool player MUST wear a BRIGHT RED ADIDAS football jersey with 3 distinct white stripes on the shoulders. The jersey MUST have the Adidas logo on the right chest, and the 'Standard Chartered' sponsor logo in the center. (If drawing Manager Arne Slot, he should wear a red Adidas manager's polo or jacket).
						- ABSOLUTELY NO NAMES OR NUMBERS: DO NOT show the back of the jersey. Front or side profile ONLY. Do not generate any names or large numbers on the shirt (to avoid spelling errors).
						- Modern Anfield stadium, capacity 61,000.
						- Photorealistic DSLR sports photography, dramatic lighting, highly detailed.
						- NO floating text, scoreboards, or watermarks.
						- Emotion and action matching: ${title}

						Output ONLY the prompt.` }]
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

// Generate video script in Thai using Gemini
async function generateVideoScript(title, thaiSummary) {
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
					parts: [{
						text: `สร้าง script สำหรับวิดีโอข่าวฟุตบอลลิเวอร์พูล ความยาว 20-25 วินาที

หัวข้อ: ${title}
สรุป: ${thaiSummary}

format ที่ต้องการ (JSON เท่านั้น ไม่มีคำอธิบาย):
{
  "videoPrompt": "A short English cinematic B-roll description matching the news topic. STRICT RULES: NO human faces, NO specific players, ABSOLUTELY NO TEXT, NO letters, NO words, NO logos, NO crests, NO scarves with writing. E.g. if press conference: 'Cinematic close up of microphones on a red table'. If transfer rumor: 'A red pen signing a contract'. If match: 'Cinematic wide shot of Anfield stadium at night'. Must be atmospheric, photorealistic.",
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
async function generateVideo(videoPrompt) {
	try {
		const { GoogleGenAI } = await import('@google/genai')
		const client = new GoogleGenAI({ vertexai: true, project: 'devakorn-creator-ai', location: 'us-central1' })

		console.log('🎬 Submitting video job to Veo...')
		let operation = await client.models.generateVideos({
			model: 'veo-2.0-generate-001',
			prompt: videoPrompt,
			config: { aspectRatio: '9:16', durationSeconds: 8 },
		})

		console.log('⏳ Waiting for Veo to render...')
		while (!operation.done) {
			await new Promise(resolve => setTimeout(resolve, 15000))
			operation = await client.operations.get({ operation })
			console.log('⏳ Still rendering...')
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

		// Execute ffmpeg with or without audio merging
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

		// Generate Thai summary and video script
		console.log('🤖 Generating video script...')
		const thaiSummary = await summarizeThai(latest.title, latest.description)
		const script = await generateVideoScript(latest.title, thaiSummary)

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
		const videoBase64 = await generateVideo(script.videoPrompt)

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

		// Use official article image for liverpoolfc.com, fallback to AI
		let imageBase64 = null
		if (latest.link.includes('liverpoolfc.com')) {
			const articleImageUrl = await getArticleImage(latest.link)
			if (articleImageUrl) {
				try {
					const imgRes = await axios.get(articleImageUrl, { responseType: 'arraybuffer', timeout: 10000 })
					imageBase64 = Buffer.from(imgRes.data).toString('base64')
					console.log(`✅ Using official article image`)
				} catch (err) {
					console.warn('⚠️ Failed to download article image')
				}
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

// News posts: (Asia/Bangkok)
cron.schedule('0 8 * * *', runBot, { timezone: "Asia/Bangkok" })
cron.schedule('0 11 * * *', runBot, { timezone: "Asia/Bangkok" })
cron.schedule('0 12 * * *', runBot, { timezone: "Asia/Bangkok" })
cron.schedule('0 14 * * *', runBot, { timezone: "Asia/Bangkok" })
cron.schedule('0 16 * * *', runBot, { timezone: "Asia/Bangkok" })
cron.schedule('0 18 * * *', runBot, { timezone: "Asia/Bangkok" })
cron.schedule('0 20 * * *', runBot, { timezone: "Asia/Bangkok" })
cron.schedule('0 22 * * *', runBot, { timezone: "Asia/Bangkok" })

// Reels posts: (Asia/Bangkok)
cron.schedule('30 9 * * *', runReelBot, { timezone: "Asia/Bangkok" })
cron.schedule('30 13 * * *', runReelBot, { timezone: "Asia/Bangkok" })
cron.schedule('30 17 * * *', runReelBot, { timezone: "Asia/Bangkok" })
cron.schedule('30 19 * * *', runReelBot, { timezone: "Asia/Bangkok" })
cron.schedule('30 21 * * *', runReelBot, { timezone: "Asia/Bangkok" })
cron.schedule('30 23 * * *', runReelBot, { timezone: "Asia/Bangkok" })

// Auto-refresh token every 50 days
cron.schedule('0 0 */50 * *', refreshFacebookToken, { timezone: "Asia/Bangkok" })

console.log('🔴 The Kop Bot started...')
// runBot()

// Temporary test — remove after testing
// runReelBot()