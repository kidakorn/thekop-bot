# CODE REVIEW SKILLS — Devakorn Creator AI

> AI Code Review Guidelines. Read this before reviewing or refactoring code.

---

## 1. Review Principles
- **Functionality First:** Does the code solve the problem without breaking existing features?
- **Readability:** Is the code clean, well-named, and easy to maintain? 
- **No Over-Engineering:** Avoid creating overly complex abstractions unless necessary.

## 2. Next.js App Router specific checks
- **Client vs Server Components:** Ensure `"use client"` is only used when strictly required (hooks, event listeners). If a component doesn't need interactivity, it should be a Server Component.
- **Data Fetching:** Are we using SWR for client-side fetching correctly? Are mutations optimistic where applicable?
- **Translations:** Did the author hardcode strings? Flag any hardcoded Thai or English strings in the UI. They must use the `useLanguage` hook.

## 3. Performance & Clean Code
- **Unused Imports:** Remove unused variables and imports.
- **Component Size:** If a file exceeds 300 lines, suggest breaking it down into smaller sub-components.
- **Console Logs:** Ensure no `console.log()` statements are left in production-ready code (except `console.error` for caught exceptions).
