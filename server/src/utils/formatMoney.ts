export function formatMoney(amount: number, symbol = '$'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  // Symbols that are letters ("KES", "FCFA") need a gap or they read "KES1,000.00"
  const sp = /[A-Za-z]{2,}$/.test(symbol) ? `${symbol} ` : symbol;
  return `${sp}${formatted}`;
}
