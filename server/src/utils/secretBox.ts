import crypto from 'crypto';
import db from '../db/schema';
import { JWT_SECRET } from '../middleware/auth';

// Encryption at rest for secrets a business stores with us so we can send
// mail on its behalf: its SMTP password and DKIM private key. They are
// sealed with AES-256-GCM (confidentiality + tamper detection) and only
// opened at the moment they're used.
//
// Key: DATA_ENCRYPTION_KEY if set (any long random string), otherwise a key
// derived from JWT_SECRET with HKDF - so it works without new configuration.
// If the key ever changes, sealed values can't be opened and the business
// re-enters them; nothing else breaks.
const PREFIX = 'enc:v1:';

const KEY: Buffer = (() => {
  const material = process.env.DATA_ENCRYPTION_KEY || JWT_SECRET;
  return Buffer.from(crypto.hkdfSync('sha256', material, 'kraafo', 'stored-secret-fields:v1', 32));
})();

export function isSealed(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function sealSecret(plain: string | null | undefined): string | null {
  if (plain === null || plain === undefined || plain === '') return plain ?? null;
  if (isSealed(plain)) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64');
}

// Returns the plain value, or null if it can't be opened (wrong key or
// tampered). Values stored before encryption existed are returned as-is.
export function openSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!isSealed(stored)) return stored;
  try {
    const raw = Buffer.from(stored.slice(PREFIX.length), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export const SEALED_ORG_FIELDS = ['smtp_pass', 'dkim_private_key'] as const;

// Seals any secret still stored in plain text (rows saved before this
// existed). Safe to run on every boot - sealed values are skipped.
export function sealLegacySecrets(): number {
  let sealed = 0;
  const rows = db.prepare(
    "SELECT id, smtp_pass, dkim_private_key FROM organizations WHERE (smtp_pass IS NOT NULL AND smtp_pass != '' AND smtp_pass NOT LIKE 'enc:v1:%') OR (dkim_private_key IS NOT NULL AND dkim_private_key != '' AND dkim_private_key NOT LIKE 'enc:v1:%')"
  ).all() as { id: string; smtp_pass: string | null; dkim_private_key: string | null }[];
  const update = db.prepare('UPDATE organizations SET smtp_pass = ?, dkim_private_key = ? WHERE id = ?');
  for (const r of rows) {
    update.run(sealSecret(r.smtp_pass), sealSecret(r.dkim_private_key), r.id);
    sealed++;
  }
  return sealed;
}
