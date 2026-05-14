import axios from 'axios'
import { NewsItem } from '../../types'

const FB_API_VERSION = 'v20.0'
const FB_API_BASE = `https://graph.facebook.com/${FB_API_VERSION}`

/**
 * Build Thai caption for Facebook post
 */
function buildCaption(news: NewsItem): string {
	return `🔴 ${news.title}

${news.description ? news.description + '\n\n' : ''}📖 Read more: ${news.link}

#Liverpool #LFC #YNWA #คอบอลเดอะค็อป #ลิเวอร์พูล #แฟนบอล`
}

/**
 * Post news to Facebook Page
 * @returns Facebook Post ID
 */
export async function postToFacebook(news: NewsItem): Promise<string> {
	const pageId = process.env.PAGE_ID
	const accessToken = process.env.PAGE_ACCESS_TOKEN

	if (!pageId || !accessToken) {
		throw new Error('PAGE_ID or PAGE_ACCESS_TOKEN is not set in .env')
	}

	const caption = buildCaption(news)

	const response = await axios.post<{ id: string }>(
		`${FB_API_BASE}/${pageId}/feed`,
		{
			message: caption,
			link: news.link,
			access_token: accessToken,
		}
	)

	if (!response.data?.id) {
		throw new Error('Unexpected response from Facebook API')
	}

	return response.data.id
}