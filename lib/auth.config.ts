// Lightweight auth config for Edge Runtime (middleware)
// Does NOT use PrismaAdapter to avoid Node.js crypto dependency
import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize is intentionally omitted here — 
      // actual verification happens in auth.ts (Node.js runtime only)
      async authorize() { return null },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth')
      const isApiRegisterRoute = nextUrl.pathname.startsWith('/api/register')
      const isAuthRoute = nextUrl.pathname === '/login'

      // Allow API routes to function normally
      if (isApiAuthRoute || isApiRegisterRoute) {
        return true
      }

      // If user is logged in and trying to access login page, redirect to home
      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/', nextUrl))
        }
        return true
      }

      // Require authentication for all other routes
      if (!isLoggedIn) {
        // Redirect manually without appending ?callbackUrl=
        return Response.redirect(new URL('/login', nextUrl))
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}
