import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const pat = process.env.GITHUB_PAT
    if (!pat) {
      return NextResponse.json({ error: 'GITHUB_PAT is not set' }, { status: 500 })
    }

    // Trigger GitHub Action repository_dispatch
    const res = await fetch('https://api.github.com/repos/kidakorn/thekop-bot/dispatches', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${pat}`
      },
      body: JSON.stringify({ event_type: 'run-news' })
    })

    if (res.ok || res.status === 204) {
      return NextResponse.json({ success: true })
    }
    
    const errText = await res.text()
    console.error('GitHub API Error:', errText)
    return NextResponse.json({ error: 'GitHub Actions trigger failed' }, { status: res.status })
  } catch (err) {
    console.error('Trigger News Error:', err)
    return NextResponse.json({ error: 'Failed to trigger bot' }, { status: 500 })
  }
}
