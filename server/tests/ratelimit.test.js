// Rate limits in production mode: keyed on the real client IP, not on a
// header the client can fake.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, call, uniqueEmail } = require('./helpers');

let srv;
before(async () => { srv = await startServer({ port: 4102, prod: true }); });
after(async () => { await srv?.stop(); });

const signup = (headers) => call(srv.base, 'POST', '/organizations', {
  headers,
  body: { name: 'Spoof', email: uniqueEmail('spoof'), phone: '+233241234567', country: 'GH', turnstile_unavailable: true },
});

test('a forged X-Forwarded-For does not get around the signup limit', async () => {
  const codes = [];
  for (let i = 1; i <= 6; i++) {
    codes.push((await signup({ 'CF-Connecting-IP': '203.0.113.7', 'X-Forwarded-For': `198.51.100.${i}` })).status);
  }
  assert.deepEqual(codes.slice(0, 5), [201, 201, 201, 201, 201]);
  assert.equal(codes[5], 429);
  assert.equal((await signup({ 'CF-Connecting-IP': '203.0.113.99' })).status, 201, 'a different visitor is unaffected');
  const ips = srv.db.prepare("SELECT DISTINCT signup_ip FROM organizations WHERE name = 'Spoof'").all().map(r => r.signup_ip).sort();
  assert.deepEqual(ips, ['203.0.113.7', '203.0.113.99']);
});

test('rotating IPv6 addresses inside one network does not help', async () => {
  const codes = [];
  for (let i = 1; i <= 6; i++) codes.push((await signup({ 'CF-Connecting-IP': `2001:db8:1:${i}::1` })).status);
  assert.equal(codes[5], 429);
});

test('repeated wrong admin secrets are throttled', async () => {
  let last;
  for (let i = 0; i < 21; i++) {
    last = await call(srv.base, 'GET', '/admin/maintenance', { headers: { 'x-admin-token': `guess-${i}`, 'CF-Connecting-IP': '203.0.113.50' } });
  }
  assert.equal(last.status, 429);
});

test('pages carry a Content-Security-Policy that blocks inline script; API responses do not', async () => {
  const page = await fetch(srv.base.replace('/api', '/'));
  const csp = page.headers.get('content-security-policy') || '';
  assert.match(csp, /script-src 'self'/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  assert.match(csp, /object-src 'none'/);
  const api = await fetch(`${srv.base}/health`);
  assert.equal(api.headers.get('content-security-policy'), null);
});
