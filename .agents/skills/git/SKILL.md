# GIT CONVENTIONS — Devakorn Creator AI

> Read this before proposing a commit message.

## 1. Commit Message Format
We use Conventional Commits. The format MUST be:
`<type>: <description>`

Types allowed:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Example:
`feat: add language toggle switch to dashboard header`
`fix: prevent negative coin balance on fast double-clicks`

## 2. Language
- Commit messages MUST be in English.
- Keep them concise but descriptive.

## 3. .gitignore Rules & Tracking
- **Never commit secrets:** Ensure `.env`, `.env.local`, and any credential files are NEVER committed. Always verify they are in `.gitignore` before proposing a commit.
- **Dependencies & Build:** Do not commit `node_modules/`, `.next/`, or build artifacts.
- **Agent Rules:** The `.agents/` folder and `CLAUDE.md` **SHOULD** be committed to the repository. This ensures all developers and AI agents working on this project share the exact same context. Do NOT add them to `.gitignore`.
