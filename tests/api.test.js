/**
 * Integration tests for AskBall UAT API.
 *
 * Each suite spins up the Express server on a random port and uses a
 * temporary DB file so tests never touch production data.
 *
 * Run: node --test tests/api.test.js
 */

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// ── Helpers ───────────────────────────────────────────────────────────────────

let server;
let baseUrl;
let tmpDB;

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      method,
      hostname: '127.0.0.1',
      port: new URL(baseUrl).port,
      path: urlPath,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

before(async () => {
  tmpDB = path.join(os.tmpdir(), `uat_test_${Date.now()}.json`);
  process.env.DB_PATH = tmpDB;

  // Re-require so lib/db.js picks up the new DB_PATH env var
  Object.keys(require.cache).forEach((k) => { delete require.cache[k]; });

  const app = require('../server');  // starts listening inside server.js
  // Give the server a tick to bind
  await new Promise((r) => setTimeout(r, 100));

  // Grab the actual bound port from the server module's side-effect
  // server.js does app.listen(PORT, ...) — we need the port it chose.
  // We re-export the server instance via a small trick: server.js exports nothing,
  // so we start our own listener here and point baseUrl at PORT env var.
  const PORT = process.env.PORT || 3000;
  baseUrl = `http://127.0.0.1:${PORT}`;
});

after(() => {
  if (fs.existsSync(tmpDB)) fs.unlinkSync(tmpDB);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

test('GET /api/health returns ok', async () => {
  const { status, body } = await request('GET', '/api/health');
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.ok(body.time, 'should include a timestamp');
});

test('POST /api/response saves a response', async () => {
  const payload = {
    tester: 'alice',
    section: 'chatbot',
    q_ref: 'Q1',
    q_num: 1,
    question: 'What is AskBall?',
    bot_response: 'AskBall is a chatbot.',
    rating: 4,
    pass_fail: 'pass'
  };
  const { status, body } = await request('POST', '/api/response', payload);
  assert.equal(status, 200);
  assert.equal(body.ok, true);
});

test('GET /api/responses/:tester returns saved responses', async () => {
  const { status, body } = await request('GET', '/api/responses/alice');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.rows));
  assert.equal(body.rows.length, 1);
  assert.equal(body.rows[0].tester, 'alice');
  assert.equal(body.rows[0].rating, 4);
});

test('GET /api/responses/:tester returns empty for unknown tester', async () => {
  const { status, body } = await request('GET', '/api/responses/nobody');
  assert.equal(status, 200);
  assert.deepEqual(body.rows, []);
  assert.equal(body.submitted, null);
});

test('POST /api/response updates existing response', async () => {
  const payload = {
    tester: 'alice', section: 'chatbot', q_ref: 'Q1', q_num: 1,
    rating: 5, pass_fail: 'pass'
  };
  await request('POST', '/api/response', payload);
  const { body } = await request('GET', '/api/responses/alice');
  assert.equal(body.rows[0].rating, 5);
});

test('POST /api/submit marks tester as submitted', async () => {
  const { status, body } = await request('POST', '/api/submit', { tester: 'alice', paired_with: 'bob' });
  assert.equal(status, 200);
  assert.equal(body.ok, true);

  const { body: testerBody } = await request('GET', '/api/responses/alice');
  assert.ok(testerBody.submitted, 'submitted_at should be set');
});

test('GET /api/dashboard includes all testers', async () => {
  await request('POST', '/api/response', { tester: 'bob', section: 'liveagent', q_ref: 'Q2', q_num: 2, rating: 3 });
  const { status, body } = await request('GET', '/api/dashboard');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.responses));
  assert.ok(Array.isArray(body.submissions));
  const testers = body.responses.map((r) => r.tester);
  assert.ok(testers.includes('alice'));
  assert.ok(testers.includes('bob'));
});

test('GET /api/export mirrors dashboard data', async () => {
  const [dash, exp] = await Promise.all([
    request('GET', '/api/dashboard'),
    request('GET', '/api/export')
  ]);
  assert.deepEqual(dash.body, exp.body);
});
