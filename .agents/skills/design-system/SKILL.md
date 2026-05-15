# DESIGN SYSTEM SKILLS — Devakorn Creator AI

> Strict guidelines for spacing, typography, and component states.

---

## 1. Spacing & Layout
- **Grid & Flexbox:** Always use Flexbox (`flex`) or CSS Grid (`grid`) for layout. Avoid absolute positioning unless necessary.
- **Consistent Gaps:** Use consistent spacing tokens: `gap-2` (8px), `gap-4` (16px) for normal spacing, and `gap-6` or `gap-8` for larger sections.
- **Padding:** Use `p-4` or `p-6` for cards and panels.
- **Container Widths:** Ensure content does not stretch infinitely on large screens. Use `max-w-7xl` or similar constraints with `mx-auto` for main content areas.

## 2. Typography
- **Font Family:** The default font is 'Inter'. Do not override it unless specifically requested.
- **Headings:**
  - H1: `text-3xl font-bold` or `text-4xl font-extrabold`
  - H2: `text-2xl font-semibold`
  - H3: `text-xl font-medium`
- **Body Text:** Use `text-base` or `text-sm` for standard content. Use `text-text-main` or DaisyUI base text color.

## 3. Borders & Shadows (Depth)
- **Rounded Corners:** Modern UI uses softer corners. Use `rounded-xl` or `rounded-2xl` for large cards/modals, and `rounded-lg` for buttons/inputs.
- **Shadows:** Use subtle shadows for depth in the dark theme context (e.g., `shadow-md` or `shadow-lg`). Avoid harsh, unnatural shadows.
- **Borders:** When separating content, use a subtle border like `border border-base-300` or `border-white/10`.

## 4. Component States (Interaction)
Every interactive element MUST have defined states:
- **Hover (`hover:`):** Slightly lighten/darken the background, or add a subtle transform (`hover:-translate-y-0.5`).
- **Focus (`focus:` / `focus-visible:`):** Ensure keyboard accessibility with focus rings (e.g., `focus-visible:ring-2 focus-visible:ring-primary-red`).
- **Disabled (`disabled:`):** Lower opacity (`opacity-50`) and set cursor to `cursor-not-allowed`.
- **Active (`active:`):** Scale down slightly (`active:scale-95`) to give tactile feedback.

## 5. Responsive Design (Mobile-First)
- Build for mobile first by default.
- Use `md:` and `lg:` prefixes to adjust layouts for tablets and desktops.
- Example: Stack items vertically on mobile (`flex-col`), then side-by-side on desktop (`md:flex-row`).
