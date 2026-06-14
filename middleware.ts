import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

// Use the lightweight edge-safe config (no PrismaAdapter / Node.js crypto)
const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
