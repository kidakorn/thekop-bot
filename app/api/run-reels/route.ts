import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Call the local bot process (running on port 4000 via PM2)
    const res = await fetch('http://127.0.0.1:4000/api/run-reels', { method: 'POST' })
    if (res.ok) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Bot API returned an error' }, { status: res.status })
  } catch (err) {
    console.error('Trigger Reels Error:', err)
    return NextResponse.json({ error: 'Bot server is offline' }, { status: 500 })
  }
}
