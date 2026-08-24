import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import db from '../db/schema';
import { sendOrgWelcome, sendAdminSignupAlert, sendVerificationEmail } from '../services/emailService';
import { verifyTurnstile } from '../utils/turnstile';
import { isValidEmailSyntax, domainAcceptsMail, getEmailDomain, normalizeEmailForAbuseCheck } from '../utils/emailValidation';
import { isDisposableEmailDomain, isDisposableEmailDomainLive } from '../utils/disposableEmail';
import { checkPhoneForCountry } from '../utils/phoneValidation';
import { geolocate } from '../utils/geo';
import { calculateRiskScore, RiskSignals } from '../services/riskScoring';

const router = Router();

const isProd = process.env.NODE_ENV === 'production';

function getIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '';
}

// Per-IP signup rate limit - tight, this is a single machine/account.
// requestPropertyName is set so both limiters' counters survive on the
// request (the default name would have the subnet limiter overwrite the
// IP limiter's stats) - the risk scorer reads both to flag high velocity.
const signupIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: getIp,
  requestPropertyName: 'rateLimitIp',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this address. Please try again later.' },
  skip: () => !isProd,
});

// Per-/24 subnet signup rate limit - looser, catches bulk signups spread
// across a small IP range (common with proxy pools) without punishing
// ordinary shared IPs (offices, campuses, mobile carriers use wider ranges).
const signupSubnetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req: Request) => getIp(req).split('.').slice(0, 3).join('.') || getIp(req),
  requestPropertyName: 'rateLimitSubnet',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this network. Please try again later.' },
  skip: () => !isProd,
});

const SENSITIVE = ['password_hash', 'smtp_pass', 'dkim_private_key'] as const;
const stripSensitive = (org: any) => {
  const safe = { ...org };
  SENSITIVE.forEach(k => delete safe[k]);
  return safe;
};

router.get('/:id', (req: Request, res: Response) => {
  if (req.params.id !== req.auth!.orgId) return res.status(403).json({ error: 'Forbidden' });
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  res.json(stripSensitive(org));
});

router.post('/', signupIpLimiter, signupSubnetLimiter, async (req: Request, res: Response) => {
  const id = uuidv4();
  const {
    name, email, phone, address, city, state, zip, country, website,
    logo_url, primary_color, secondary_color, accent_color,
    tax_name, tax_rate, currency, currency_symbol,
    invoice_prefix, receipt_prefix, quote_prefix, payment_terms, notes,
    bank_name, bank_account, bank_routing, signature_url,
    smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
    whatsapp_number, mpesa_number, mtn_number, airtel_number, telecel_number, paypal_email,
    dkim_domain, dkim_selector, dkim_private_key,
    cf_turnstile_response, fingerprint_hash, turnstile_unavailable,
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Organization name is required' });
  if (!email) return res.status(400).json({ error: 'Email address is required' });
  // Required (not just format-checked) specifically so it's meaningful as a
  // country-match signal below - an optional field nobody bothers filling
  // in doesn't tell you anything about who's actually signing up.
  if (!phone) return res.status(400).json({ error: 'Phone number is required.' });

  // turnstile_unavailable is only set by the client after it actually tried
  // to load the widget and timed out (see TurnstileWidget's onUnavailable) -
  // ad blockers/privacy extensions/corporate filters commonly block it for
  // real visitors. Rather than lock them out entirely, let them through
  // without a verified token but feed that into the risk score below, so it
  // adds friction/review instead of being either a free pass or a hard wall.
  let turnstileUnavailable = false;
  if (turnstile_unavailable) {
    turnstileUnavailable = true;
  } else {
    const human = await verifyTurnstile(cf_turnstile_response, getIp(req));
    if (!human) return res.status(403).json({ error: 'Security check failed. Please refresh and try again.' });
  }

  const trimmedEmail = String(email).trim();
  if (!isValidEmailSyntax(trimmedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  const emailDomain = getEmailDomain(trimmedEmail);
  // Static npm-package list first (instant, no network dependency), then a
  // free real-time API as a second layer that catches newer/rotating
  // disposable services before they'd land in a periodically-bumped
  // dependency - see utils/disposableEmail.ts for why this fails open.
  if (isDisposableEmailDomain(emailDomain) || (await isDisposableEmailDomainLive(emailDomain))) {
    return res.status(400).json({ error: "Please use a permanent email address - disposable/temporary addresses aren't supported." });
  }
  if (!(await domainAcceptsMail(emailDomain))) {
    return res.status(400).json({ error: "That email domain doesn't appear to accept mail. Please double-check for typos." });
  }

  const signupCountry = country || 'US';
  const phoneCheck = checkPhoneForCountry(phone, signupCountry);
  if (!phoneCheck.valid) {
    return res.status(400).json({ error: 'Please enter a valid phone number.' });
  }

  const signupIp = getIp(req);
  const geo = await geolocate(signupIp);

  // Repeated-fingerprint check - same device seen on another recent signup.
  // One signal among several (see the client-side note in Setup.tsx on why
  // this is weak/spoofable on its own); feeds the risk score, not a gate.
  const repeatedFingerprint = !!fingerprint_hash && !!db.prepare(
    "SELECT 1 FROM signup_fingerprints WHERE fingerprint_hash = ? AND created_at > datetime('now', '-30 days') LIMIT 1"
  ).get(fingerprint_hash);

  // Same real inbox behind a Gmail dot/plus variation seen on another recent
  // signup - see normalizeEmailForAbuseCheck for why this is a much stronger
  // signal than it looks (the two "different" emails both genuinely receive
  // mail at the same address, so both can complete real verification).
  const normalizedEmail = normalizeEmailForAbuseCheck(trimmedEmail);
  const repeatedNormalizedEmail = !!db.prepare(
    "SELECT 1 FROM organizations WHERE signup_email_normalized = ? AND created_at > datetime('now', '-30 days') LIMIT 1"
  ).get(normalizedEmail);

  // "Near its rate limit" = this request is the last one the window allows
  // (or already over, in the rare race where two requests land together).
  const rlIp = (req as any).rateLimitIp;
  const rlSubnet = (req as any).rateLimitSubnet;
  const highVelocity = [rlIp, rlSubnet].some(rl => rl && typeof rl.remaining === 'number' && rl.remaining <= 1);

  const signals: RiskSignals = {
    repeatedFingerprint,
    repeatedNormalizedEmail,
    countryPhoneMismatch: phoneCheck.countryMismatch,
    proxyIp: geo.isProxy,
    hostingIp: geo.isHosting,
    highVelocity,
    turnstileUnavailable,
  };
  const risk = calculateRiskScore(signals);
  const verificationStatus = risk.action === 'hold' ? 'held_for_review' : 'pending_verification';

  db.prepare(`
    INSERT INTO organizations (id, name, email, phone, address, city, state, zip, country, website,
      logo_url, primary_color, secondary_color, accent_color, tax_name, tax_rate, currency,
      currency_symbol, invoice_prefix, receipt_prefix, quote_prefix, payment_terms, notes,
      bank_name, bank_account, bank_routing, signature_url,
      smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
      whatsapp_number, mpesa_number, mtn_number, airtel_number, telecel_number, paypal_email,
      signup_ip, signup_asn, signup_country, signup_is_proxy, signup_is_hosting, fingerprint_hash,
      signup_email_normalized, verification_status, risk_score, risk_action)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, name, trimmedEmail, phone, address, city, state, zip, signupCountry, website,
    logo_url, primary_color || '#2563EB', secondary_color || '#1E40AF', accent_color || '#DBEAFE',
    tax_name || 'Tax', tax_rate || 0, currency || 'USD', currency_symbol || '$',
    invoice_prefix || 'INV', receipt_prefix || 'REC', quote_prefix || 'QUO',
    payment_terms || 'Net 30', notes,
    bank_name, bank_account, bank_routing, signature_url || null,
    smtp_host || null, smtp_port || 587, smtp_user || null, smtp_pass || null, smtp_from || null,
    whatsapp_number || null, mpesa_number || null, mtn_number || null, airtel_number || null, telecel_number || null, paypal_email || null,
    signupIp || null, geo.asn || null, geo.country || null, geo.isProxy ? 1 : 0, geo.isHosting ? 1 : 0,
    fingerprint_hash || null, normalizedEmail, verificationStatus, risk.score, risk.action);

  if (fingerprint_hash) {
    db.prepare('INSERT INTO signup_fingerprints (id, fingerprint_hash, org_id, ip) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), fingerprint_hash, id, signupIp || null);
  }

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(id) as any;
  res.status(201).json(stripSensitive(org));
  sendOrgWelcome(org).catch(console.error);
  sendVerificationEmail(org).catch(console.error);
  sendAdminSignupAlert(org).catch(console.error);
});

router.put('/:id', (req: Request, res: Response) => {
  if (req.params.id !== req.auth!.orgId) return res.status(403).json({ error: 'Forbidden' });
  const existing = db.prepare('SELECT id FROM organizations WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Organization not found' });

  const fields = [
    'name','email','phone','address','city','state','zip','country','website',
    'logo_url','primary_color','secondary_color','accent_color','tax_name','tax_rate',
    'currency','currency_symbol','invoice_prefix','receipt_prefix','quote_prefix','payment_terms',
    'notes','bank_name','bank_account','bank_routing','signature_url',
    'smtp_host','smtp_port','smtp_user','smtp_pass','smtp_from',
    'whatsapp_number','mpesa_number','mtn_number','airtel_number','telecel_number','paypal_email',
    'dkim_domain','dkim_selector','dkim_private_key',
  ];

  const updates = fields.filter(f => req.body[f] !== undefined);
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const setClauses = [...updates.map(f => `${f} = ?`), "updated_at = datetime('now')"].join(', ');
  const values = [...updates.map(f => req.body[f]), req.params.id];

  db.prepare(`UPDATE organizations SET ${setClauses} WHERE id = ?`).run(...values);
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  res.json(stripSensitive(org));
});

export default router;
