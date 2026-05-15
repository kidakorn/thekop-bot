# TESTING SKILLS — Devakorn Creator AI

> Strict guidelines for writing, maintaining, and organizing tests.

---

## 1. Testing Philosophy & Scope
- **Critical Paths First:** The absolute highest priority for testing is the Coin Deduction logic, Wallet Balance, and User Authentication flows.
- **Unit Tests (`*.test.ts`):** Write unit tests for standalone utility functions (e.g., currency formatters, date parsers). Avoid testing implementation details; test inputs and outputs.
- **Component Tests (`*.test.tsx`):** Use React Testing Library. Do not test Tailwind classes. Test that elements render correct text, respect bilingual context (`useLanguage`), and trigger correct `onClick` events.

## 2. Naming & Organization
- Place test files next to the files they are testing (e.g., `Button.tsx` -> `Button.test.tsx`), OR in a dedicated `__tests__` folder.
- **Naming Conventions:** Use clear `describe` and `it` blocks.
  - Pattern: `it('should [expected behavior] when [condition]')`
  - Example: `it('should deduct 10 coins when the generate button is clicked')`

## 3. Mocking & External Services
- **Mock External APIs:** NEVER call real AI APIs (like OpenAI, Replicate, or Stripe) during automated tests. Always mock the HTTP responses using `jest.mock` or MSW (Mock Service Worker).
- **Database Testing:** Do not pollute the development database. Use a dedicated test database (e.g., SQLite in-memory or a separate Postgres test instance) or mock the ORM client.

## 4. End-to-End (E2E) Testing
- If using Playwright/Cypress, ensure you test the full user journey: Login -> Check Balance -> Generate Content -> Verify Balance Deduction.
- Use `data-testid` attributes on critical UI elements to select them robustly in E2E tests, rather than relying on brittle CSS selectors.
