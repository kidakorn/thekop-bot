# Disable AI APIs Feature

This plan outlines the steps to add a new system feature that allows you to temporarily disable all AI generation APIs (Text, Image, Video, Voiceover) to save on free-tier quotas. When disabled, the bot will fall back to basic operations like pulling original news text and article images.

## User Review Required

> [!WARNING]
> Disabling AI APIs will completely disable the **Reels Bot** since Reels are fundamentally generated using AI video and voiceover. The News Bot will continue to function but will post in English (original text) instead of Thai summaries, and will exclusively use the original article images.

## Open Questions

> [!IMPORTANT]
> 1. **News Text Fallback:** When the AI text summarizer (Gemini) is disabled, the bot cannot translate the news to Thai. Is it acceptable to post the original English title and a short excerpt of the English description?
> 2. **Default State:** Should the AI be disabled immediately upon applying these changes, or would you prefer to keep it enabled until you manually toggle it off in the Dashboard settings?

## Proposed Changes

### Database & Settings
The application already has a `Setting` table (key-value pair) in the database. We will introduce a new setting key: `disable_ai` (string `'true'` or `'false'`).

### UI (Dashboard Settings)
#### [MODIFY] [page.tsx](file:///d:/Coding/DEVAKORN/project_page/thekop-bot/app/page.tsx)
- Add a new "AI API Generation" toggle switch in the Settings tab.
- This toggle will visually indicate whether the AI APIs are active or suspended to save quota.

#### [MODIFY] [route.ts](file:///d:/Coding/DEVAKORN/project_page/thekop-bot/app/api/settings/route.ts)
- Update the settings API to accept and save the `disable_ai` setting to the database.

---

### Bot Logic
#### [MODIFY] [run.mjs](file:///d:/Coding/DEVAKORN/project_page/thekop-bot/server/bot/run.mjs)
- Fetch the `disable_ai` setting at the beginning of the bot process.
- **If AI is disabled:**
  - `runBot` (News): Skip `summarizeThai` and use the raw English description instead.
  - `runBot` (News): Skip the `generateImage` check entirely and strictly use `articleBase64` (the original image from the news site).
  - `runReelBot`: Skip execution entirely and log a warning that Reels generation is paused to save AI quota.

## Verification Plan

### Manual Verification
1. Open the Dashboard Settings and turn OFF the AI APIs.
2. Manually trigger the News Bot from the UI.
3. Verify that the newly posted content on Facebook uses the original English text and the original article image, and check the logs to ensure no Google AI APIs were called.
4. Manually trigger the Reels Bot and verify that it skips execution properly.
