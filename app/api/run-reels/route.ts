import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Reels feature has been removed as per the new 100% Free Serverless architecture.' }, { status: 400 })
}
