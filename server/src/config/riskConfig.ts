import fs from 'fs';
import path from 'path';

// Signup risk-scoring weights and thresholds, kept in a JSON file outside the
// codebase so they can be tuned from real abuse patterns without a deploy.
// GET/PUT /api/admin/risk-config (see routes/admin.ts) read and persist this
// file, then call reloadRiskConfig() so a change takes effect immediately -
// no restart needed.
const DB_DIR = path.dirname(process.env.DB_PATH || './data/krafo.db');
const CONFIG_PATH = process.env.RISK_CONFIG_PATH || path.join(DB_DIR, 'risk-config.json');

export interface RiskWeights {
  repeatedFingerprint: number;
  repeatedNormalizedEmail: number;
  countryPhoneMismatch: number;
  proxyIp: number;
  hostingIp: number;
  highVelocity: number;
  turnstileUnavailable: number;
}

export interface RiskThresholds {
  // score >= hold -> block the account for manual review (verification_status = 'held_for_review')
  hold: number;
  // score >= friction and < hold -> allowed through, but treated as medium risk
  // (still logged/queryable in the admin flagged-signups view for review)
  friction: number;
}

export interface RiskConfig {
  weights: RiskWeights;
  thresholds: RiskThresholds;
}

const DEFAULT_CONFIG: RiskConfig = {
  weights: {
    repeatedFingerprint: 30,
    // Same real inbox behind a Gmail dot/plus variation - stronger evidence
    // than a repeated fingerprint (a fingerprint can coincide innocently;
    // this means the same person literally clicked verify from one inbox).
    repeatedNormalizedEmail: 40,
    // Deliberately NOT a hard block on its own - a diaspora business owner
    // (e.g. running Ghana mobile money from abroad) legitimately trips this
    // with zero other signals firing. Only actually blocks a signup when
    // combined with something else (see routes/organizations.ts).
    countryPhoneMismatch: 25,
    proxyIp: 25,
    hostingIp: 20,
    highVelocity: 35,
    // Legitimate visitors with strict privacy tools (Brave Shields, uBlock,
    // corporate filters) can trigger this too, so it's a moderate nudge
    // toward friction/review - not automatically a hold by itself.
    turnstileUnavailable: 20,
  },
  thresholds: {
    friction: 30,
    hold: 60,
  },
};

let current: RiskConfig = DEFAULT_CONFIG;

function ensureDir(): void {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

export function reloadRiskConfig(): RiskConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    current = {
      weights: { ...DEFAULT_CONFIG.weights, ...parsed.weights },
      thresholds: { ...DEFAULT_CONFIG.thresholds, ...parsed.thresholds },
    };
  } catch {
    // Missing or invalid file - fall back to defaults and write them out so
    // there's a real file for an operator to find and edit going forward.
    current = DEFAULT_CONFIG;
    try {
      ensureDir();
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
    } catch {}
  }
  return current;
}

export function getRiskConfig(): RiskConfig {
  return current;
}

export function saveRiskConfig(next: Partial<RiskConfig>): RiskConfig {
  const merged: RiskConfig = {
    weights: { ...current.weights, ...next.weights },
    thresholds: { ...current.thresholds, ...next.thresholds },
  };
  ensureDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2));
  return reloadRiskConfig();
}

// Load at module init so the very first signup after boot uses real (or
// default) config rather than waiting for an admin to hit reload.
reloadRiskConfig();
