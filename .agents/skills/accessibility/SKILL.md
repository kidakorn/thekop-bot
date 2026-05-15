# ACCESSIBILITY (A11y) SKILLS — Devakorn Creator AI

> Guidelines to ensure the application is usable by everyone, including those using assistive technologies.

---

## 1. Semantic HTML
- Always use correct HTML5 tags (`<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`) instead of just `<div>` everywhere.
- Headings (`<h1>` to `<h6>`) must be sequential and logical. Do not skip heading levels.

## 2. Interactive Elements
- **Buttons vs Links:** Use `<button>` for actions that change state or submit data. Use `<Link>` or `<a>` for navigation.
- **Focus Rings:** Never remove `outline` without providing an alternative focus state. Keyboard users must know which element is currently active.
- **Aria Attributes:** 
  - Provide `aria-label` for icon-only buttons (e.g., a "Generate" button that only has a wand icon).
  - Use `aria-expanded` and `aria-controls` for dropdowns and accordions.

## 3. Visual Accessibility
- **Images:** Every `<Image />` must have a meaningful `alt` attribute. If it's purely decorative, use `alt=""`.
- **Contrast:** Ensure text maintains sufficient contrast against the background colors, especially in dark mode.
