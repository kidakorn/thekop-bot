# AI INTEGRATION SKILLS — Devakorn Creator AI

> Strict guidelines for integrating and communicating with External LLMs and Image/Video Generative APIs (OpenAI, Replicate, Stability, etc.).

---

## 1. API Reliability & Timeouts
- **Timeout Handling:** AI APIs can be slow. Ensure your fetch requests or SDK calls have proper timeout limits (e.g., 30-60 seconds).
- **Error States:** If the AI API fails (500/429/Timeout), return a graceful translation key (e.g., `error_ai_timeout`) to the user. Do NOT crash the Next.js API route.

## 2. Streaming Responses
- **Text Generation:** For text-based tasks (like Prompt Enhancer or Campaign Builder), prefer using standard Web Streams or Next.js AI SDK (`ai` package) to stream responses chunk-by-chunk. This significantly improves perceived performance.

## 3. Prompt Engineering Guidelines
- **System Prompts:** Keep system prompts clean and securely stored on the server-side. Never send the master system prompt from the client to the server.
- **JSON Mode:** If expecting a structured response from an LLM, enforce JSON mode (e.g., `response_format: { type: "json_object" }`) and validate the output structure with Zod before using it.
