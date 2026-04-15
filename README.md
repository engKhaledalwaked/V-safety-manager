<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1fM9ssY0cudoVEN1nduo1GBz0R-1ohIe3

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Important: where edits are actually loaded from

- The running app currently imports pages from `pages/` (not `src/pages/`).
- Example: `App.tsx` uses imports like `./pages/client/Home`.
- If you edit files under `src/...` only, those changes may not appear in the running site.

## Deploy without stale build

- Use:
   `npm run deploy:hosting`
- This command always runs a fresh build first (`predeploy:hosting`), then deploys to Firebase Hosting.
