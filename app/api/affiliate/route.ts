import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.pageSetting.findUnique({
    where: { userId: session.user.id },
    select: { affiliateEnabled: true, affiliateLinks: true, affiliateMode: true, affiliateTag: true }
  })

  return NextResponse.json(settings || {})
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await request.json()

  const updated = await prisma.pageSetting.update({
    where: { userId: session.user.id },
    data: {
      affiliateEnabled: data.affiliateEnabled,
      affiliateLinks: data.affiliateLinks,
      affiliateMode: data.affiliateMode,
      affiliateTag: data.affiliateTag,
    }
  })

  return NextResponse.json({ success: true })
}
