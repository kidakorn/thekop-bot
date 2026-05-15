# PERFORMANCE & SEO SKILLS — Devakorn Creator AI

> Guidelines for making the app fast and search-engine friendly.

---

## 1. Next.js Image Optimization
- **Always use `<Image />`:** Never use the standard HTML `<img>` tag for local or remote assets. Always use `next/image` to prevent unoptimized loading.
- **Sizing:** Provide exact `width` and `height`, or use `fill` with a relative parent container to prevent Cumulative Layout Shift (CLS).
- **Remote Domains:** If fetching images from AI APIs, ensure the remote host domain is configured in `next.config`.

## 2. SEO & Metadata (App Router)
- **Metadata API:** Use Next.js 14 Metadata API (`export const metadata: Metadata = {}`) in `page.tsx` or `layout.tsx`.
- **Dynamic Metadata:** For pages like user profiles or public galleries, use `export async function generateMetadata()`.
- **Multi-language SEO:** If applicable, ensure `<html>` lang attributes update or alternate canonical links are present.

## 3. Bundle Size
- **Avoid Heavy Libraries:** Do not install massive libraries (like `lodash` or `moment`) if a lightweight alternative exists (like native JS or `date-fns`).
- **Dynamic Imports:** For heavy components (like complex charts or video players), use `next/dynamic` to load them only when needed on the client.
