import 'dotenv/config'
import cron from 'node-cron'
import { fetchLiverpoolNews } from './newsFetcher'
import { postToFacebook } from './fbPoster'
import { prisma } from '../../lib/db'

console.log('🔴 The Kop Bot started...')

/**
 * Core bot function: fetch news → save to DB → post to Facebook
 */
async function runBot(): Promise<void> {
	try {
		console.log('📰 Fetching Liverpool news...')
		const news = await fetchLiverpoolNews()

		if (!news || news.length === 0) {
			console.warn('⚠️ No new articles found')
			return
		}

		const latest = news[0]

		// Save to DB with PENDING status before posting
		// Note: scheduler uses system owner - will be migrated in Phase 4
		const systemUser = await prisma.user.findFirst()
		if (!systemUser) throw new Error('No user found in DB. Please create an account first.')

		const post = await prisma.post.create({
			data: {
				userId: systemUser.id,
				title: latest.title,
				content: latest.description,
				link: latest.link,
				status: 'PENDING',
			},
		})

		console.log(`📢 Posting: ${latest.title}`)

		// Post to Facebook
		const fbPostId = await postToFacebook(latest)

		// Update status to POSTED
		await prisma.post.update({
			where: { id: post.id },
			data: {
				status: 'POSTED',
				fbPostId,
				postedAt: new Date(),
			},
		})

		console.log(`✅ Posted successfully! FB Post ID: ${fbPostId}`)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		console.error('❌ Bot error:', message)
	}
}

// Schedule posts at 08:00, 12:00, 20:00 (UTC+7)
cron.schedule('0 1 * * *', runBot) // 08:00 TH
cron.schedule('0 5 * * *', runBot) // 12:00 TH
cron.schedule('0 13 * * *', runBot) // 20:00 TH

// Run immediately on startup
runBot()