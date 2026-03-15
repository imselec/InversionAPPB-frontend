/** Format a number as USD currency */
export function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** Format a number as a percentage */
export function formatPct(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

/** Format a large number with K/M/B suffix */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

/** Return 'value-gain', 'value-loss', or 'value-neutral' CSS class */
export function gainLossClass(value: number): string {
  if (value > 0) return 'value-gain'
  if (value < 0) return 'value-loss'
  return 'value-neutral'
}

/** Format ISO date string to locale date */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
