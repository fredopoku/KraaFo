// Server-side twin of client/src/utils/currencies.ts's getCurrencySymbol, so an
// organisation saved with a currency but no (or a stale) symbol never silently
// falls back to "$". Node ships full ICU data, so this matches the browser.
function part(code: string, display: 'symbol' | 'narrowSymbol'): string {
  try {
    const parts = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: display }).formatToParts(1);
    return parts.find(p => p.type === 'currency')?.value || code;
  } catch {
    return code;
  }
}

// 'en' only knows a bare code for many currencies (NGN, GHS, ZAR...), which
// would print "NGN1,000.00"; the narrow symbol has the local one (₦, GH₵, R).
export function symbolForCurrency(code: string): string {
  const symbol = part(code, 'symbol');
  return symbol !== code ? symbol : part(code, 'narrowSymbol');
}

// Symbols that are legitimately correct for a currency (normal or narrow form).
export function isKnownSymbol(code: string, symbol: string): boolean {
  return symbol === part(code, 'symbol') || symbol === part(code, 'narrowSymbol');
}
