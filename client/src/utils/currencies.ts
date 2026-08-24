export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

// Small fallback in case Intl.supportedValuesOf isn't available (very old
// browser) - the previous hardcoded list, kept only as a safety net.
const FALLBACK_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

let cached: CurrencyOption[] | null = null;

// Every ISO 4217 currency the browser knows about, with its real symbol and
// display name derived from the same ICU data Intl.NumberFormat itself
// uses - no hand-maintained list to go stale or mistype a symbol on.
// Widely supported since ~2022 (Intl.supportedValuesOf), so this only ever
// falls back on a genuinely ancient browser.
export function getAllCurrencies(): CurrencyOption[] {
  if (cached) return cached;
  try {
    const codes = (Intl as unknown as { supportedValuesOf(key: string): string[] }).supportedValuesOf('currency');
    const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });
    cached = codes
      .map(code => {
        let symbol = code;
        try {
          const parts = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'symbol' }).formatToParts(1);
          symbol = parts.find(p => p.type === 'currency')?.value || code;
        } catch { /* some codes (e.g. fund/precious-metal codes) can't format - keep code as symbol */ }
        let name = code;
        try { name = displayNames.of(code) || code; } catch {}
        return { code, symbol, name };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    cached = FALLBACK_CURRENCIES;
  }
  return cached;
}
