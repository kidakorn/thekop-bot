---
metadata:
  version: 1.2.0
  description: "Central Registry and Instructions for Devakorn Creator AI Skills"
  author: "Devakorn Architecture"
  last_updated: "2026-05-14"
---

# 🎯 Master Skills Requirement & Registry

This file acts as the central hub (`requirement.md`) defining the metadata, instructions, and usage triggers for all AI Skills within the `.agents/skills/` directory.

> **Instruction for AI Agents:**
> When assigned a new task, first refer to this registry to determine which specific skill files (`SKILL.md`) you need to load into your context before modifying code.

## 📦 Skills Inventory & Metadata

### 1. Frontend Core (`/frontend/SKILL.md`)
- **Triggers:** Modifying `page.tsx`, `layout.tsx`, React Context, Client/Server components.
- **Instruction:** Enforces Next.js App Router rules, `"use client"` minimization, and URL state management over `useState`.

### 2. Backend & API (`/backend/SKILL.md`)
- **Triggers:** Modifying `src/app/api/`, route handlers, NextAuth sessions.
- **Instruction:** Enforces session validation, `isBanned` checks, input validation (zod), and secure coin deduction patterns.

### 3. Database (`/database/SKILL.md`)
- **Triggers:** Modifying Prisma/Drizzle schema, writing SQL, handling migrations.
- **Instruction:** Enforces transactions, connection pooling, soft deletes, and forbids auto-running migrations.

### 4. UI & UX (`/ui-ux/SKILL.md`)
- **Triggers:** Writing Tailwind classes, adding buttons, structuring visual layout.
- **Instruction:** Enforces dark theme tokens, `lucide-react` icons, loading states, and prohibits emojis/placeholders.

### 5. Design System (`/design-system/SKILL.md`)
- **Triggers:** Creating new reusable UI components, defining layout structures.
- **Instruction:** Enforces Flexbox/Grid, specific Typography (`Inter`), subtle borders/shadows, and strict interactive states.

### 6. Security Review (`/security-review/SKILL.md`)
- **Triggers:** Handling API keys, `.env` files, data sanitization, authentication flows.
- **Instruction:** Strictly forbids touching/reading `.env` files and enforces zero-trust data validation.

### 7. Performance & SEO (`/performance-seo/SKILL.md`)
- **Triggers:** Adding images, optimizing load times, setting `generateMetadata()`.
- **Instruction:** Enforces `<Image />` usage, dynamic imports, and minimizing bundle sizes.

### 8. Testing (`/testing/SKILL.md`)
- **Triggers:** Writing unit/e2e tests (Jest, Playwright).
- **Instruction:** Enforces mocking of AI APIs, test naming conventions, prioritizing critical paths, and E2E `data-testid` usage.

### 9. Code Review (`/code-review/SKILL.md`)
- **Triggers:** Refactoring code, performing code reviews, splitting large files.
- **Instruction:** Focuses on code readability, removing unused imports, and flagging hardcoded strings that need translation.

### 10. Git Conventions (`/git/SKILL.md`)
- **Triggers:** Writing commit messages, pushing code.
- **Instruction:** Enforces Conventional Commits and strict `.gitignore` rules.

### 11. AI Integration (`/ai-integration/SKILL.md`)
- **Triggers:** Connecting to OpenAI, Replicate, or handling AI Prompts.
- **Instruction:** Enforces strict API timeouts, JSON mode validation via Zod, and UI streaming patterns.

### 12. Accessibility / A11y (`/accessibility/SKILL.md`)
- **Triggers:** Building custom UI components, modals, inputs.
- **Instruction:** Enforces Semantic HTML, ARIA attributes, focus management, and proper color contrast.

### 13. Deployment & CI/CD (`/deployment/SKILL.md`)
- **Triggers:** Updating Next.js config, environment variables, build scripts.
- **Instruction:** Enforces strict TS/ESLint checks before build, Edge runtime compatibility checks, and env validation.

### 14. DB Diagram (`/db-diagram/SKILL.md`)
- **Triggers:** Designing new database tables, modifying schema relations.
- **Instruction:** Enforces the use of Mermaid.js ER diagrams to visualize schema changes and get user approval before writing actual ORM code.

---

## 🛠️ How to Apply Multiple Skills
If a task crosses multiple domains (e.g., "Build a new AI API endpoint and connect it to a UI button"), the agent MUST load:
- `backend/SKILL.md` & `ai-integration/SKILL.md` (for the API)
- `frontend/SKILL.md` (for connecting the UI)
- `ui-ux/SKILL.md` & `accessibility/SKILL.md` (for styling the button)
