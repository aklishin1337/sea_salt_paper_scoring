# Sea Salt & Paper — Score Tracker

A PWA score tracker for the board game Sea Salt & Paper.

## Deploy to Vercel (recommended)

1. Create a free account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI: `npm i -g vercel`
3. In this folder, run: `vercel`
4. Follow the prompts — choose defaults for everything
5. Your app will be live at a `*.vercel.app` URL in ~60 seconds

**Or drag & drop:** Go to [vercel.com/new](https://vercel.com/new), drag this entire folder in, done.

## Install on iPhone

1. Open your Vercel URL in Safari
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Done — it will appear as a full-screen app with its own icon

## Local development

```bash
npm install
npm run dev
```

## Features

- Roster management (unlimited players)
- 2–4 players per game with auto thresholds (40 / 35 / 30 pts)
- Per-round score entry with numpad
- Undo last entry
- Game history with delete
- Stats & leaderboard (wins, best score, best round, fastest win, avg score)
- Fully offline after first load
- Data persists in localStorage
