import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string, linkId: string }> }
) {
  const { userId, linkId } = await params

  try {
    // Find user's affiliate settings
    const settings = await prisma.pageSetting.findUnique({
      where: { userId },
      select: { affiliateLinks: true }
    })

    if (!settings || !settings.affiliateLinks) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Parse links and find the target
    const links = JSON.parse(settings.affiliateLinks)
    const targetLink = links.find((l: any) => l.id === linkId)

    if (!targetLink || !targetLink.url) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Record the click
    const url = new URL(request.url)
    const postId = url.searchParams.get('p') || undefined
    
    // Non-blocking click record
    prisma.affiliateClick.create({
      data: {
        userId,
        linkId,
        postId,
        platform: targetLink.platform || 'shopee',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    }).catch((err: any) => console.error('Failed to record affiliate click:', err))

    // Redirect to the actual affiliate link
    return NextResponse.redirect(targetLink.url)
    
  } catch (err) {
    console.error('Redirect error:', err)
    return NextResponse.redirect(new URL('/', request.url))
  }
}
