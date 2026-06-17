import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get clicks from the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const clicks = await prisma.affiliateClick.findMany({
    where: { 
      userId: session.user.id,
      clickedAt: { gte: thirtyDaysAgo }
    },
    orderBy: { clickedAt: 'asc' }
  })

  // Group by date
  const chartData: Record<string, number> = {}
  
  // Group by linkId
  const linkStats: Record<string, number> = {}

  clicks.forEach((click: any) => {
    const dateStr = click.clickedAt.toISOString().split('T')[0]
    chartData[dateStr] = (chartData[dateStr] || 0) + 1

    const linkId = click.linkId || 'unknown'
    linkStats[linkId] = (linkStats[linkId] || 0) + 1
  })

  // Fill in missing dates for the last 7 days for the chart
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    last7Days.push({
      date: dateStr,
      clicks: chartData[dateStr] || 0
    })
  }

  return NextResponse.json({
    totalClicks: clicks.length,
    chartData: last7Days,
    linkStats
  })
}
