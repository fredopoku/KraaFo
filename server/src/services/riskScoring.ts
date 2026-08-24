import { getRiskConfig } from '../config/riskConfig';

// Signals feeding the signup risk score. Each one is a weak, individually
// spoofable signal (see the comments at each signal's source in
// routes/organizations.ts and utils/geo.ts) - the score exists precisely so
// no single signal acts as a hard gate on its own.
export interface RiskSignals {
  repeatedFingerprint: boolean;
  repeatedNormalizedEmail: boolean;
  countryPhoneMismatch: boolean;
  proxyIp: boolean;
  hostingIp: boolean;
  highVelocity: boolean;
  turnstileUnavailable: boolean;
}

export type RiskAction = 'allow' | 'friction' | 'hold';

export interface RiskResult {
  score: number;
  action: RiskAction;
  firedSignals: (keyof RiskSignals)[];
}

export function calculateRiskScore(signals: RiskSignals): RiskResult {
  const { weights, thresholds } = getRiskConfig();
  let score = 0;
  const firedSignals: (keyof RiskSignals)[] = [];

  (Object.keys(signals) as (keyof RiskSignals)[]).forEach(key => {
    if (signals[key]) {
      score += weights[key] ?? 0;
      firedSignals.push(key);
    }
  });

  const action: RiskAction =
    score >= thresholds.hold ? 'hold' :
    score >= thresholds.friction ? 'friction' :
    'allow';

  return { score, action, firedSignals };
}
