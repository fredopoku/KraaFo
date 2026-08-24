import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

export interface PhoneCheckResult {
  valid: boolean;          // is this a real, correctly-formatted number at all
  countryMismatch: boolean; // valid, but resolves to a different country than claimed
}

// A number with its own explicit country code (e.g. "+1 555..." on a
// signup that says Ghana) parses to its real country regardless of what
// region we pass as a hint, so comparing parsed.country against the claimed
// country (rather than just parsed.isValid()) is what actually detects a
// mismatch instead of silently accepting any valid number from anywhere.
//
// `valid` is a hard requirement (garbage/malformed numbers are always
// rejected) - `countryMismatch` is deliberately NOT, because a real and
// common case for this app's actual audience (mobile-money businesses
// across Ghana/Nigeria/Kenya etc.) is a diaspora owner whose phone's real
// country legitimately differs from where the business operates. It's fed
// into risk scoring instead (see routes/organizations.ts) so it only
// blocks a signup when stacked with another signal already firing, not on
// its own.
//
// This is format/region validation only - it cannot tell a real mobile
// line from a VoIP/burner number, which needs a paid carrier-lookup API
// (Twilio Lookup or similar).
export function checkPhoneForCountry(phone: string, claimedCountry: string): PhoneCheckResult {
  if (!phone || !claimedCountry) return { valid: false, countryMismatch: false };
  try {
    const parsed = parsePhoneNumberFromString(phone, claimedCountry as CountryCode);
    if (!parsed || !parsed.isValid()) return { valid: false, countryMismatch: false };
    return { valid: true, countryMismatch: parsed.country !== claimedCountry };
  } catch {
    return { valid: false, countryMismatch: false };
  }
}
