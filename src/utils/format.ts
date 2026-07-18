// Display formatting for money and dates. Values stay as the API's types (decimal / the
// "YYYY-MM-DD" string) everywhere else — format only at the point of display.

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    // Unknown/invalid currency code — fall back to a plain number with the code.
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatDate(isoDate: string): string {
  // isoDate is "YYYY-MM-DD"; render in the user's locale without timezone drift.
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
