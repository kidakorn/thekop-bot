import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { exec } from 'child_process'
import util from 'util'

const execAsync = util.promisify(exec)

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('🚀 Running bot locally (Development Mode)...')
      // Run it in the background so it doesn't block the API response
      execAsync('node server/bot/run.mjs --news').catch(e => console.error('Local bot error:', e))
      return NextResponse.json({ success: true, mode: 'local' })
    }

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
      return NextResponse.json({ success: true, mode: 'github' })
    }
    
    const errText = await res.text()
    console.error('GitHub API Error:', errText)
    return NextResponse.json({ error: `GitHub API: ${errText}` }, { status: res.status })
  } catch (err) {
    console.error('Trigger News Error:', err)
    return NextResponse.json({ error: 'Failed to trigger bot' }, { status: 500 })
  }
}
