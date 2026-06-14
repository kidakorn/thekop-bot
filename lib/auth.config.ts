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
    authorized({ auth }) {
      return !!auth?.user
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}
