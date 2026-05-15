# DEPLOYMENT & CI/CD SKILLS — Devakorn Creator AI

> Rules regarding environments, builds, and server infrastructure.

---

## 1. Environment Variables Validation
- Never push code that breaks if an optional environment variable is missing.
- Use a central file (e.g., `src/env.mjs` with Zod) to validate that all required environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, etc.) are present at build time.

## 2. Build Process
- Ensure TypeScript (`tsc --noEmit`) and ESLint (`next lint`) pass before generating production builds.
- Fix all warnings; do not ignore them unless strictly necessary. Do not use `@ts-ignore` without a very detailed explanatory comment.

## 3. Caching & Edge Functions
- Be extremely careful when using `export const runtime = 'edge'`. Ensure the libraries you are using are Edge-compatible (e.g., standard Prisma client is not Edge-compatible without Accelerate).
- For data that rarely changes, leverage Next.js ISR (Incremental Static Regeneration) via `revalidate` options in `fetch`.
