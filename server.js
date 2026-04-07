const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_PATH || './uat_data.json';

// ── Simple JSON file database ─────────────────────────────
function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch(e) {}
  return { responses: {}, submissions: {} };
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Key: "tester|section|qref|qnum"
function makeKey(tester, section, q_ref, q_num) {
  return [tester, section, q_ref||'', q_num||''].join('|');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Save/update a response ────────────────────────────────
app.post('/api/response', (req, res) => {
  try {
    const r = req.body;
    const db = readDB();
    const key = makeKey(r.tester, r.section, r.q_ref, r.q_num);
    db.responses[key] = {
      tester:r.tester, section:r.section, q_num:r.q_num||null, q_ref:r.q_ref||null,
      question:r.question||null, bot_response:r.bot_response||null, source_ref:r.source_ref||null,
      q1:r.q1||null, q2:r.q2||null, q3:r.q3||null, q4:r.q4||null,
      q5:r.q5||null, q6:r.q6||null, q7:r.q7||null, q8:r.q8||null,
      result:r.result||null, rating:r.rating||null, pass_fail:r.pass_fail||null,
      comments:r.comments||null, updated_at: new Date().toISOString()
    };
    writeDB(db);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Submit tester ─────────────────────────────────────────
app.post('/api/submit', (req, res) => {
  try {
    const db = readDB();
    db.submissions[req.body.tester] = {
      tester: req.body.tester,
      submitted_at: new Date().toISOString(),
      paired_with: req.body.paired_with || ''
    };
    writeDB(db);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Get responses for one tester ─────────────────────────
app.get('/api/responses/:tester', (req, res) => {
  try {
    const db = readDB();
    const rows = Object.values(db.responses).filter(r => r.tester === req.params.tester);
    const sub = db.submissions[req.params.tester];
    res.json({ rows, submitted: sub ? sub.submitted_at : null });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Full dashboard data ───────────────────────────────────
app.get('/api/dashboard', (req, res) => {
  try {
    const db = readDB();
    res.json({
      responses: Object.values(db.responses),
      submissions: Object.values(db.submissions)
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/export', (req, res) => {
  try {
    const db = readDB();
    res.json({ responses: Object.values(db.responses), submissions: Object.values(db.submissions) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log('AskBall UAT running on port ' + PORT));
