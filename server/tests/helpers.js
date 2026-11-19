// Shared helpers for the server test suite (node:test). Each test file
// starts the compiled server (dist/) on its own port against a fresh,
// throwaway database, and seeds data straight into that database.
// Run `npm run build` first; `npm test` does both.
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SERVER_DIR = path.resolve(__dirname, '..');
const JWT_SECRET = 'test-jwt-secret-not-for-production';
const ADMIN_TOKEN = 'test-admin-token';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function startServer({ port, prod = false, env: extraEnv = {} }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kraafo-test-'));
  const env = {
    ...process.env,
    NODE_ENV: prod ? 'production' : 'test',
    PORT: String(port),
    DB_PATH: path.join(dir, 'krafo.db'),
    UPLOAD_DIR: path.join(dir, 'uploads'),
    JWT_SECRET,
    ADMIN_TOKEN,
    RESEND_API_KEY: '', TURNSTILE_SECRET: '', ANTHROPIC_API_KEY: '', GROQ_API_KEY: '', SENTRY_DSN: '',
    DATA_ENCRYPTION_KEY: '',
    ...extraEnv,
  };
  const child = spawn(process.execPath, [path.join(SERVER_DIR, 'dist/index.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  child.stdout.on('data', d => { log += d; });
  child.stderr.on('data', d => { log += d; });

  const base = `http://127.0.0.1:${port}/api`;
  let up = false;
  for (let i = 0; i < 150 && !up; i++) {
    try { up = (await fetch(`${base}/health`)).ok; } catch { /* not yet */ }
    if (!up) await sleep(200);
  }
  if (!up) { child.kill(); throw new Error(`server did not start:\n${log}`); }

  const db = new Database(env.DB_PATH);
  return {
    base, db, dir, env,
    log: () => log,
    async stop() {
      db.close();
      child.kill();
      await new Promise(r => child.once('exit', r));
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

async function call(base, method, p, { body, token, headers = {} } = {}) {
  const h = { 'Content-Type': 'application/json', ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const r = await fetch(base + p, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null;
  try { json = await r.json(); } catch { /* not JSON */ }
  return { status: r.status, body: json, headers: r.headers };
}

let n = 0;
function uniqueEmail(tag = 'user') {
  return `kraafo.test.${tag}.${Date.now()}.${n++}@gmail.com`;
}

// Inserts an organisation directly. status: verified | pending_verification | held_for_review
function createOrg(db, { email = uniqueEmail('org'), password = 'password123', status = 'verified', reason = null, name = 'Test Co', createdDaysAgo = 0 } = {}) {
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO organizations (id, name, email, password_hash, verification_status, verify_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))`)
    .run(id, name, email, bcrypt.hashSync(password, 4), status, reason, `-${createdDaysAgo} days`);
  return { id, email, password };
}

function createMember(db, orgId, { email = uniqueEmail('member'), password = 'password123', role = 'staff' } = {}) {
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO team_members (id, org_id, name, email, password_hash, role, invite_accepted)
    VALUES (?, ?, 'Member', ?, ?, ?, 1)`).run(id, orgId, email, bcrypt.hashSync(password, 4), role);
  return { id, email, password, role };
}

// A token as the server would issue it (session version 0 unless given).
function tokenFor({ orgId, userId = orgId, role = 'owner', email = 'x@example.com', tv }) {
  return jwt.sign({ orgId, userId, role, email, ...(tv === undefined ? {} : { tv }) }, JWT_SECRET, { expiresIn: '1h' });
}

// Puts a known 6-digit code on an account, stored the way the server stores it.
function setCode(db, orgId, code) {
  const h = crypto.createHmac('sha256', JWT_SECRET).update(`${orgId}:${code}`).digest('hex');
  db.prepare('UPDATE organizations SET email_code_hash = ?, email_code_expires = ?, email_code_attempts = 0 WHERE id = ?')
    .run(h, new Date(Date.now() + 600000).toISOString(), orgId);
}

module.exports = { startServer, call, createOrg, createMember, tokenFor, setCode, uniqueEmail, sleep, JWT_SECRET, ADMIN_TOKEN, SERVER_DIR };
