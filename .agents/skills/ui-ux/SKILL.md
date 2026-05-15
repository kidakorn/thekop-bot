# UI & UX SKILLS — Devakorn Creator AI

> This file contains strict design rules for AI agents to follow.

---

## 1. Aesthetic & Color Rules
The app uses a specific theme defined in `client/src/app/globals.css`. We use Tailwind CSS v4 with DaisyUI.
**Strictly use these predefined color tokens:**
- `primary-red` (#D90429) / `daisy-primary` - Main accent color (e.g. CTA buttons)
- `secondary-red` (#EF233C) / `daisy-secondary` - Secondary accent
- `dark-bg` (#2B2D42) - Main dark background / dark text
- `text-main` (#2B2D42) - Default body text color
- `base-100` (#FFFFFF) / `base-200` / `base-300` - DaisyUI base background shades

**Rule:** Do NOT use generic colors like `bg-blue-500` or `text-gray-900`. Always map to the project's custom theme variables or DaisyUI semantic colors.

## 2. Component Design (DaisyUI)
- **DaisyUI First:** Leverage DaisyUI components (e.g., `btn btn-primary`, `card`, `input input-bordered`) before building raw Tailwind components from scratch.
- **No Emojis:** Do not use emojis anywhere in the UI or code.
- **Icons:** Always use `lucide-react` for icons. Do not import random SVG files unless necessary.
- **Loading States:** Every button that triggers an API call MUST have a loading state (e.g., showing a spinner using `<span className="loading loading-spinner"></span>` and disabling the button).
- **Placeholders:** Never use generic image placeholders (e.g., `via.placeholder.com`). If an image is missing, render a fallback UI using `lucide-react` icons.

## 3. Bilingual Support
- Text must NEVER be hardcoded. Always use the translation key system.
- Ensure that the UI does not break if English text is longer than Thai text. Use flexible widths and truncation (`truncate`, `line-clamp-2`) where necessary.
