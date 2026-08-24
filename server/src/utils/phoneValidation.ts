import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

// Confirms a phone number is genuinely valid FOR THE SPECIFIC COUNTRY the
// signup claims - not just "looks like a phone number somewhere". A number
// with its own explicit country code (e.g. "+1 555..." while the form says
// Ghana) parses to its real country regardless of what region we pass as a
// hint, so checking parsed.country against the claimed country (rather than
// just parsed.isValid()) is what actually catches a mismatch instead of
// silently accepting any valid number from anywhere.
//
// This is format/region validation only - it cannot tell a real mobile line
// from a VoIP/burner number, which needs a paid carrier-lookup API (Twilio
// Lookup or similar). It catches "made up" or "wrong country" numbers, not
// "real number, rented for five minutes."
export function isValidPhoneForCountry(phone: string, countryCode: string): boolean {
  if (!phone || !countryCode) return false;
  try {
    const parsed = parsePhoneNumberFromString(phone, countryCode as CountryCode);
    return !!parsed && parsed.isValid() && parsed.country === countryCode;
  } catch {
    return false;
  }
}
