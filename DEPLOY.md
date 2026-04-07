# AskBall UAT Portal — Deployment Guide

## Option A: Railway (Recommended — 5 minutes)

1. Go to **github.com** → create free account → New repository → name it `askball-uat`
2. Upload all files from this folder (drag & drop into GitHub)
3. Go to **railway.app** → Login with GitHub → New Project → Deploy from GitHub repo
4. Select `askball-uat` → Railway detects Node.js automatically → Deploy
5. Click **Settings → Networking → Generate Domain**
6. Your URL appears: `https://askball-uat-xxxx.railway.app`
7. Share that URL with all testers — anyone worldwide can access it

**Dashboard URL:** `https://your-url.railway.app` → click Dashboard tab

---

## Option B: Run locally (for testing)

```bash
npm install
npm start
# Open http://localhost:3000
```

---

## How data is stored
- All responses saved to `uat_data.json` on the server
- Every keypress auto-saves to the server database
- Dashboard tab shows ALL testers' responses in real time
- Export button downloads full Excel with all 33 testers' data

---

## Files in this package
- `server.js` — Node.js backend (Express + JSON database)
- `public/index.html` — Full portal frontend (all 12 sections)
- `package.json` — Dependencies (express, cors only)
- `railway.json` — Railway deployment config
