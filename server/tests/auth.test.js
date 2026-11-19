// Accounts, sessions, the email-code gate, admin access and stored secrets.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { startServer, call, createOrg, createMember, tokenFor, setCode, uniqueEmail, ADMIN_TOKEN } = require('./helpers');

let srv;
before(async () => { srv = await startServer({ port: 4101 }); });
after(async () => { await srv?.stop(); });

const SECRET_FIELDS = ['password_hash', 'reset_token', 'email_code_hash', 'email_verify_token_hash', 'smtp_pass', 'dkim_private_key'];

test('signup creates a pending account, sends only the code, rejects duplicate emails', async () => {
  const email = uniqueEmail('signup');
  const s = await call(srv.base, 'POST', '/organizations', {
    body: { name: 'Signup Co', email, phone: '+233241234567', country: 'GH', turnstile_unavailable: true },
  });
  assert.equal(s.status, 201, JSON.stringify(s.body));
  assert.equal(s.body.verification_status, 'pending_verification');
  const row = srv.db.prepare('SELECT welcome_email_sent, email_code_sent_at FROM organizations WHERE id = ?').get(s.body.id);
  assert.ok(row.email_code_sent_at, 'a code was issued');
  assert.ok(!row.welcome_email_sent, 'no welcome email before verification');

  const dup = await call(srv.base, 'POST', '/organizations', {
    body: { name: 'X', email: email.toUpperCase(), phone: '+233241234567', country: 'GH', turnstile_unavailable: true },
  });
  assert.equal(dup.status, 409);
});

test('unverified accounts can only read their own organization', async () => {
  const org = createOrg(srv.db, { status: 'pending_verification', reason: 'reverify' });
  const t = tokenFor({ orgId: org.id });
  const inv = await call(srv.base, 'GET', '/invoices', { token: t });
  assert.equal(inv.status, 403);
  assert.equal(inv.body.code, 'verification_required');
  assert.equal((await call(srv.base, 'GET', `/organizations/${org.id}`, { token: t })).status, 200);
  assert.equal((await call(srv.base, 'PUT', `/organizations/${org.id}`, { token: t, body: { email: 'victim@gmail.com' } })).status, 403);
});

test('the right code unlocks the account; wrong codes count down', async () => {
  const org = createOrg(srv.db, { status: 'pending_verification', reason: 'signup' });
  const t = tokenFor({ orgId: org.id });
  setCode(srv.db, org.id, '123456');
  const wrong = await call(srv.base, 'POST', '/auth/verify-code', { token: t, body: { code: '000000' } });
  assert.equal(wrong.status, 400);
  assert.match(wrong.body.error, /4 tries left/);
  const ok = await call(srv.base, 'POST', '/auth/verify-code', { token: t, body: { code: '123456' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.org.verification_status, 'verified');
  assert.equal(srv.db.prepare('SELECT email_code_hash FROM organizations WHERE id = ?').get(org.id).email_code_hash, null);
  assert.equal((await call(srv.base, 'GET', '/invoices', { token: t })).status, 200);
});

test('five wrong codes burn the code, and the daily send cap holds', async () => {
  const org = createOrg(srv.db, { status: 'pending_verification', reason: 'signup' });
  const t = tokenFor({ orgId: org.id });
  setCode(srv.db, org.id, '654321');
  for (let i = 0; i < 5; i++) await call(srv.base, 'POST', '/auth/verify-code', { token: t, body: { code: '999999' } });
  const burned = await call(srv.base, 'POST', '/auth/verify-code', { token: t, body: { code: '654321' } });
  assert.equal(burned.body.code, 'too_many_attempts');

  srv.db.prepare('UPDATE organizations SET email_code_send_count = 5, email_code_window_start = ?, email_code_sent_at = ? WHERE id = ?')
    .run(new Date().toISOString(), new Date(Date.now() - 120000).toISOString(), org.id);
  const capped = await call(srv.base, 'POST', '/auth/send-code', { token: t });
  assert.equal(capped.status, 429);
});

test('changing the account email requires a new code', async () => {
  const org = createOrg(srv.db);
  const t = tokenFor({ orgId: org.id });
  const r = await call(srv.base, 'PUT', `/organizations/${org.id}`, { token: t, body: { email: uniqueEmail('changed') } });
  assert.equal(r.status, 200);
  assert.equal(r.body.verification_status, 'pending_verification');
  assert.equal(r.body.verify_reason, 'email_change');
});

test('sign-in responses never include secrets, and failures do not reveal whether an email exists', async () => {
  const org = createOrg(srv.db);
  const ok = await call(srv.base, 'POST', '/auth/login', { body: { email: org.email, password: org.password } });
  assert.equal(ok.status, 200);
  for (const f of SECRET_FIELDS) assert.ok(!(f in ok.body.org), `${f} leaked`);

  const wrongPw = await call(srv.base, 'POST', '/auth/login', { body: { email: org.email, password: 'nope-nope' } });
  const noUser = await call(srv.base, 'POST', '/auth/login', { body: { email: uniqueEmail('nobody'), password: 'nope-nope' } });
  assert.equal(wrongPw.status, 401);
  assert.equal(noUser.status, 401);
  assert.equal(wrongPw.body.error, noUser.body.error);
});

test('team members: only the owner gets the code; removal and role changes apply immediately', async () => {
  const org = createOrg(srv.db);
  const m = createMember(srv.db, org.id, { role: 'staff' });
  const mt = tokenFor({ orgId: org.id, userId: m.id, role: 'staff' });

  srv.db.prepare("UPDATE organizations SET verification_status = 'pending_verification', verify_reason = 'reverify' WHERE id = ?").run(org.id);
  const sc = await call(srv.base, 'POST', '/auth/send-code', { token: mt });
  assert.equal(sc.status, 403);
  assert.equal(sc.body.code, 'owner_only');
  srv.db.prepare("UPDATE organizations SET verification_status = 'verified' WHERE id = ?").run(org.id);

  // Demoted to accountant (read-only): the token still says staff, the database wins.
  srv.db.prepare("UPDATE team_members SET role = 'accountant' WHERE id = ?").run(m.id);
  const write = await call(srv.base, 'POST', '/clients', { token: mt, body: { name: 'Should not save' } });
  assert.equal(write.status, 403, JSON.stringify(write.body));

  // Staff can create documents but not change business settings.
  const staff = createMember(srv.db, org.id, { role: 'staff' });
  const st = tokenFor({ orgId: org.id, userId: staff.id, role: 'staff' });
  assert.equal((await call(srv.base, 'POST', '/clients', { token: st, body: { name: 'Saved by staff' } })).status, 201);
  assert.equal((await call(srv.base, 'PUT', `/organizations/${org.id}`, { token: st, body: { bank_account: '123' } })).status, 403);

  srv.db.prepare('DELETE FROM team_members WHERE id = ?').run(m.id);
  assert.equal((await call(srv.base, 'GET', '/invoices', { token: mt })).status, 401);
});

test('"sign out of all devices" ends existing sessions', async () => {
  const org = createOrg(srv.db);
  const login = await call(srv.base, 'POST', '/auth/login', { body: { email: org.email, password: org.password } });
  const t = login.body.token;
  assert.equal((await call(srv.base, 'GET', '/invoices', { token: t })).status, 200);
  assert.equal((await call(srv.base, 'POST', '/auth/logout-all', { token: t })).status, 200);
  assert.equal((await call(srv.base, 'GET', '/invoices', { token: t })).status, 401);
  const again = await call(srv.base, 'POST', '/auth/login', { body: { email: org.email, password: org.password } });
  assert.equal((await call(srv.base, 'GET', '/invoices', { token: again.body.token })).status, 200);
});

test('a password reset signs out other sessions and confirms the email', async () => {
  const org = createOrg(srv.db, { status: 'pending_verification', reason: 'reverify' });
  const oldToken = tokenFor({ orgId: org.id });
  srv.db.prepare('UPDATE organizations SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
    .run(bcrypt.hashSync('112233', 4), new Date(Date.now() + 3600000).toISOString(), org.id);
  const r = await call(srv.base, 'POST', '/auth/reset', { body: { email: org.email, code: '112233', password: 'newpassword1' } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.org.verification_status, 'verified');
  assert.equal((await call(srv.base, 'GET', '/invoices', { token: oldToken })).status, 401);
  assert.equal((await call(srv.base, 'GET', '/invoices', { token: r.body.token })).status, 200);
});

test('tokens issued before session versions existed keep working', async () => {
  const org = createOrg(srv.db);
  const legacy = tokenFor({ orgId: org.id }); // no tv claim
  assert.equal((await call(srv.base, 'GET', '/invoices', { token: legacy })).status, 200);
});

test('PDF routes: statements need a signed-in account, the open preview route is gone', async () => {
  assert.equal((await call(srv.base, 'GET', '/pdf/statement/some-client')).status, 401);
  const org = createOrg(srv.db);
  const st = await call(srv.base, 'GET', '/pdf/statement/no-such-client', { token: tokenFor({ orgId: org.id }) });
  assert.equal(st.status, 404, 'authenticated request reaches the route');
  const pv = await call(srv.base, 'POST', '/pdf/preview', { body: { invoiceData: {} } });
  assert.notEqual(pv.status, 200);
});

test('stored SMTP passwords are encrypted, hidden, and not wiped by a settings save', async () => {
  const org = createOrg(srv.db);
  const t = tokenFor({ orgId: org.id });
  await call(srv.base, 'PUT', `/organizations/${org.id}`, { token: t, body: { smtp_host: 'smtp.example.com', smtp_pass: 'hunter2-secret' } });
  const stored = srv.db.prepare('SELECT smtp_pass FROM organizations WHERE id = ?').get(org.id).smtp_pass;
  assert.match(stored, /^enc:v1:/);
  assert.ok(!stored.includes('hunter2'));
  const got = await call(srv.base, 'GET', `/organizations/${org.id}`, { token: t });
  assert.ok(!('smtp_pass' in got.body));
  await call(srv.base, 'PUT', `/organizations/${org.id}`, { token: t, body: { name: 'Renamed Co', smtp_pass: '' } });
  assert.equal(srv.db.prepare('SELECT smtp_pass FROM organizations WHERE id = ?').get(org.id).smtp_pass, stored);
});

test('admin: wrong secret refused, right secret works, backup download is a real database', async () => {
  assert.equal((await call(srv.base, 'GET', '/admin/maintenance', { headers: { 'x-admin-token': 'wrong' } })).status, 401);
  assert.equal((await call(srv.base, 'GET', '/admin/maintenance', { headers: { 'x-admin-token': ADMIN_TOKEN } })).status, 200);
  const r = await fetch(`${srv.base}/admin/backup`, { headers: { 'x-admin-token': ADMIN_TOKEN } });
  assert.equal(r.status, 200);
  const buf = Buffer.from(await r.arrayBuffer());
  assert.equal(buf.subarray(0, 15).toString(), 'SQLite format 3');
});
