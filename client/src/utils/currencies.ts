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

// The 'en' locale only knows a bare 3-letter code for many currencies people
// actually invoice in (NGN, GHS, ZAR, ZMW...), which would print as
// "NGN1,000.00" instead of "₦1,000.00". narrowSymbol has the local one, so
// prefer it whenever the normal symbol is just the code. Dollar-family
// currencies keep their disambiguated form (CA$, A$).
export function getCurrencySymbol(code: string): string {
  const part = (display: 'symbol' | 'narrowSymbol') => {
    try {
      const parts = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: display }).formatToParts(1);
      return parts.find(p => p.type === 'currency')?.value || code;
    } catch { return code; }
  };
  const symbol = part('symbol');
  return symbol !== code ? symbol : part('narrowSymbol');
}

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
        let name = code;
        try { name = displayNames.of(code) || code; } catch {}
        return { code, symbol: getCurrencySymbol(code), name };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    cached = FALLBACK_CURRENCIES;
  }
  return cached;
}
