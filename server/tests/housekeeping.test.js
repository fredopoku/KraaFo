// Backups, the abandoned-signup purge and secret encryption, tested
// directly against a throwaway database.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { SERVER_DIR, JWT_SECRET, createOrg } = require('./helpers');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kraafo-hk-'));
process.env.DB_PATH = path.join(dir, 'krafo.db');
process.env.JWT_SECRET = JWT_SECRET;
process.env.NODE_ENV = 'test';

let db, hk, box;
before(() => {
  db = require(path.join(SERVER_DIR, 'dist/db/schema.js')).default;
  hk = require(path.join(SERVER_DIR, 'dist/services/housekeeping.js'));
  box = require(path.join(SERVER_DIR, 'dist/utils/secretBox.js'));
});
after(() => { db.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test('purge removes only old, empty, never-verified signups', () => {
  const bot = createOrg(db, { status: 'pending_verification', reason: 'signup', createdDaysAgo: 40 });
  const withClient = createOrg(db, { status: 'pending_verification', reason: 'signup', createdDaysAgo: 40 });
  db.prepare("INSERT INTO clients (id, org_id, name) VALUES ('c1', ?, 'A client')").run(withClient.id);
  const existingCustomer = createOrg(db, { status: 'pending_verification', reason: 'reverify', createdDaysAgo: 400 });
  const recent = createOrg(db, { status: 'pending_verification', reason: 'signup', createdDaysAgo: 5 });
  const verified = createOrg(db, { createdDaysAgo: 90 });

  assert.equal(hk.purgeAbandonedSignups(), 1);
  const left = id => !!db.prepare('SELECT 1 FROM organizations WHERE id = ?').get(id);
  assert.equal(left(bot.id), false);
  for (const o of [withClient, existingCustomer, recent, verified]) assert.equal(left(o.id), true);
});

test('daily backup writes one usable copy per day', () => {
  const first = hk.runDailyBackup();
  assert.ok(first.file && fs.existsSync(first.file));
  assert.equal(fs.readFileSync(first.file).subarray(0, 15).toString(), 'SQLite format 3');
  assert.ok(hk.runDailyBackup().skipped, 'second run the same day is skipped');
});

test('secrets: sealed values round-trip, tampering is detected, legacy plain text is sealed', () => {
  const sealed = box.sealSecret('smtp-password');
  assert.match(sealed, /^enc:v1:/);
  assert.equal(box.openSecret(sealed), 'smtp-password');
  assert.notEqual(box.sealSecret('smtp-password'), sealed, 'fresh IV each time');
  const tampered = sealed.slice(0, -4) + (sealed.endsWith('AAAA') ? 'BBBB' : 'AAAA');
  assert.equal(box.openSecret(tampered), null);
  assert.equal(box.openSecret('legacy-plain'), 'legacy-plain');

  const org = createOrg(db);
  db.prepare("UPDATE organizations SET smtp_pass = 'plain-old', dkim_private_key = 'plain-key' WHERE id = ?").run(org.id);
  assert.ok(box.sealLegacySecrets() >= 1);
  const row = db.prepare('SELECT smtp_pass, dkim_private_key FROM organizations WHERE id = ?').get(org.id);
  assert.match(row.smtp_pass, /^enc:v1:/);
  assert.equal(box.openSecret(row.smtp_pass), 'plain-old');
  assert.equal(box.openSecret(row.dkim_private_key), 'plain-key');
  assert.equal(box.sealLegacySecrets(), 0, 'nothing left to seal');
});
