# BACKEND SKILLS — Devakorn Creator AI

> This file contains strict rules for the Next.js App Router Backend (API Routes / Route Handlers) and Server Actions. Read before modifying any backend code.

---

## 1. API Route Structure
- All endpoints are located in `src/app/api/`.
- Use the new App Router syntax: `export async function GET(req: Request)`, `POST(req: Request)`, etc.
- Always return standard JSON responses using `NextResponse.json({ ... }, { status: ... })`.

## 2. Authentication & Authorization
- **Session Check:** Every protected endpoint MUST verify the user session via NextAuth.
```ts
import { getServerSession } from "next-auth";
const session = await getServerSession(authOptions);
if (!session || !session.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```
- **Banned Check:** Always check if the user `isBanned` before processing any generation.

## 3. Input Validation
- Always validate incoming JSON body or query parameters before processing.
- Do NOT trust client input.
- Use `zod` (if available) or manual type checking to ensure the request body matches expected shapes.

## 4. Coin System (Deduction)
- The transaction for deducting coins must be robust.
- Fetch current balance -> Check if sufficient -> Process AI Generation -> Deduct balance -> Return success.
- If generation fails, do NOT deduct the user's coins.

## 5. Error Handling
- Never expose raw database errors or API keys in the response.
- Use a `try...catch` block around the main logic.
- Log the real error to the server console (`console.error`), but return a clean error message to the client (e.g., `{ error: "Failed to generate image. Please try again later." }`).
