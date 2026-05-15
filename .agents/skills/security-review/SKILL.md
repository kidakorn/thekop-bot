# SECURITY & SECRETS SKILLS — Devakorn Creator AI

> CRITICAL RULES regarding project security, secrets, and environment variables.

---

## 1. DO NOT TOUCH SECRET FILES
- **NEVER** read, modify, or output the contents of `.env`, `.env.local`, `.env.production`, or any file containing API keys/secrets.
- If the user asks you to modify an environment variable, tell them to do it manually. Do NOT write the command to `cat` or `echo` into `.env` files.
- Treat `nextauth.secret`, database connection strings, and AI API keys as highly confidential.

## 2. API Security
- **Authentication Check:** Ensure every sensitive API route uses NextAuth session checking.
- **Authorization Check:** Check `isBanned` state before processing any AI generation request. Do not allow generations if banned.
- **Data Leakage:** Ensure API responses only return necessary fields to the client. Do NOT return full user objects that might contain passwords, tokens, or sensitive internal IDs.

## 3. Input Validation
- Prevent Injection: Always validate and sanitize user inputs before sending them to the database or external APIs.
- Use `zod` for strict schema validation on all POST/PUT/PATCH endpoints.
- **Coin System Integrity:** Ensure coin deduction logic happens securely on the server-side, never trust a client-side "cost" parameter.
