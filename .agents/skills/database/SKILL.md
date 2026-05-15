# DATABASE SKILLS (PostgreSQL) — Devakorn Creator AI

> Strict guidelines for interacting with PostgreSQL.

---

## 1. Schema & Migrations
- **Schema Source:** Always refer to the central schema file (e.g., `prisma/schema.prisma` or Drizzle schema) when writing queries.
- **Migrations:** Do NOT run database migrations (like `migrate dev` or `db push`) automatically without asking the user first, to prevent accidental data loss.
- **Naming Conventions:** Use `camelCase` for model/table fields. Tables should be plural (e.g., `users`, `transactions`).

## 2. Query Performance
- **N+1 Problem:** Avoid querying inside loops. Use proper JOINs or `include`/`with` relational queries provided by the ORM.
- **Indexing:** If you are adding a feature that searches or filters by a specific column (e.g., `userId`, `createdAt`), suggest adding an index (`@@index`) to that column.
- **Connection Pooling:** In serverless environments (Next.js API routes), ensure you are using a single database client instance to prevent connection exhaustion.

## 3. Data Integrity & Transactions
- **Transactions:** When performing operations that modify multiple tables (e.g., deducting coins AND inserting an AI generation record), ALWAYS use a database transaction. If one fails, both must rollback.
- **Soft Deletes:** Prefer soft deletes (e.g., setting `deletedAt` = `now()`) over hard deleting records, especially for financial or generation logs.
