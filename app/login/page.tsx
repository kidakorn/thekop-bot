'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'register') {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        setLoading(false)
        return
      }
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)
    if (result?.error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 selection:bg-red-500/20">
      {/* Very soft ambient background glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-100 rounded-full blur-[100px] pointer-events-none opacity-60" />

      <div className="w-full max-w-[400px] z-10 relative">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/20 mb-5">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">The Kop Bot</h1>
          <p className="text-gray-500 text-sm mt-1.5">Auto-posting system สำหรับเพจฟุตบอล</p>
        </div>

        {/* Clean Light Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-gray-200/50">
          {/* Subtle Tab Switcher */}
          <div className="flex gap-2 mb-8 border-b border-gray-100 pb-4">
            <button
              onClick={() => { setMode('login'); setError('') }}
              className={`pb-2 text-sm font-medium transition-all relative ${
                mode === 'login' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              เข้าสู่ระบบ
              {mode === 'login' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600 rounded-t-full" />}
            </button>
            <div className="w-4" />
            <button
              onClick={() => { setMode('register'); setError('') }}
              className={`pb-2 text-sm font-medium transition-all relative ${
                mode === 'register' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              สร้างบัญชีใหม่
              {mode === 'register' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600 rounded-t-full" />}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-600">ชื่อของคุณ</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:bg-white transition-all"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-600">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-600">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:bg-white transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl text-[13px]">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium py-2.5 rounded-xl transition-all shadow-sm shadow-red-600/20 mt-4 text-[14px]"
            >
              {loading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>

          {/* Minimal Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200" />
            <span className="text-gray-400 text-[11px] uppercase tracking-wider font-medium">Or continue with</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200" />
          </div>

          {/* Minimalist Google Login */}
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition-all text-[14px] shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
        </div>

        <div className="flex flex-col items-center gap-1 mt-8 text-gray-400 text-[12px]">
          <p>The Kop Bot © {new Date().getFullYear()}</p>
          <p>System running securely.</p>
        </div>
      </div>
    </div>
  )
}
