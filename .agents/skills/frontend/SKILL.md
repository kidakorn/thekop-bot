# FRONTEND SKILLS — Devakorn Creator AI

> This file is written for AI coding agents. It contains strict rules, patterns, and conventions for the FRONTEND (Next.js client/server components, UI, state) of this project. Read this before modifying any frontend code.

---

## 1. Tech Stack (Frontend)
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS (Custom Config)
- **Data Fetching:** SWR (`useSWR`) for real-time data
- **Icons:** `lucide-react`
- **Language:** TypeScript
- **State:** React Context API (Language), `useState` (Local), URL Search Params (Filters)

---

## 2. Next.js App Router Rules
- **Server vs Client Components:** 
  - By default, all components in App Router are Server Components.
  - Use `"use client"` at the very top of the file ONLY when you need React hooks (`useState`, `useEffect`), Event listeners (`onClick`), or browser APIs.
  - Keep `"use client"` components as low in the component tree as possible for better performance.
- **Routing:** Pages must be named `page.tsx` and placed in `src/app/`.

---

## 3. Bilingual System (TH/EN) — CRITICAL
The app supports Thai and English. Do NOT hardcode text in JSX.
- **Provider:** The app uses a root-level `<LanguageWrapper>` which wraps everything.
- **Usage:** Always use the `useLanguage` hook.
```tsx
import { useLanguage } from '@/lib/useLanguage';
const { t } = useLanguage();
<h1>{t('my_title_key')}</h1>
```
- **Adding Keys:** Add new translations in `src/lib/translations.ts`.
- **Dropdowns/Selects:** Never translate the `value` attribute of a dropdown (API needs English). Only translate the displayed text inside the `<option>`.

---

## 4. UI & Design Conventions
- **No Emojis:** Do NOT use emojis in the UI, code, or comments.
- **Dark/Professional Aesthetic:** Use our predefined Tailwind variables (e.g., `text-dark-bg`, `text-primary-red`, `bg-light-gray`).
- **No Placeholders:** Do not use generic placeholder images (like via.placeholder.com). Generate real-looking assets or use actual data.
- **Page Layout:** All dashboard pages must be wrapped with `<DashboardLayout>`.

---

## 5. State Management & URL Params
- **Filters and Searching:** If a page has a search box, tabs, or filters, **store the state in URL Query Parameters** (e.g., `?category=video`) instead of `useState`. This allows users to share links and preserves state on refresh.
- **Local State:** Use `useState` only for transient UI states (e.g., opening a modal, toggling a dropdown).

---

## 6. Data Fetching & SWR
- We use **SWR** for real-time fetching (e.g., Coin Balance).
- **Optimistic Updates:** When a user spends coins, use SWR's `mutate` to update the balance optimisticly before the API returns.
```tsx
const { data, mutate } = useSWR('/api/user/balance', fetcher);
// Update locally instantly:
mutate({ ...data, coinBalance: newBalance }, false);
```

---

## 7. Coin System & Button States
- Users pay with Coins for generations. (1 THB = 10 Coins).
- **Check Balance:** Always compare `currentCoins < currentCost` before enabling a "Generate" button.
- **Button UI:** The generate button must show the cost. Example: `t('generate') + ' (-10 Coins)'`.
- **Disable State:** If `isBanned === true` or balance is insufficient, disable the button and show a visual indicator.

---

## 8. Error Handling & Toast Notifications
- **API Failures:** Always wrap API calls in `try...catch`.
- **User Feedback:** Use Toast notifications to inform the user of errors.
- **Translation:** Pass translation keys to Toasts, do NOT show raw API error strings to users.
```tsx
catch (error) {
  toast.error(t('error_general')); // Don't show raw error to users
  console.error("API Error:", error);
}
```
