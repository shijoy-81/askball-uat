# AskBall UAT Portal

Sprint 6 · Chatbot + Live Agent Hand Off UAT

## Local development
```bash
npm install
npm start
# Open http://localhost:3000
```

## Deploy to Railway
1. Go to railway.app → New Project → Deploy from GitHub
2. Connect this repo
3. Railway auto-detects Node.js and deploys
4. Get your public URL from the Railway dashboard

## Environment variables (optional)
- `PORT` — defaults to 3000
- `DB_PATH` — path to SQLite file, defaults to ./uat.db
