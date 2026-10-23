// Display formatting. Money comes from Postgres numeric(12,2) as a string or number; never do
// arithmetic on formatted values.
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdWhole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) throw new Error(`not a number: ${String(value)}`);
  return n;
}

export function formatMoney(value: number | string | null | undefined, opts: { whole?: boolean } = {}): string {
  return (opts.whole ? usdWhole : usd).format(toNumber(value));
}

/** "+$12.50" / "−$3.00" (true minus sign), for gains and losses. */
export function formatSignedMoney(value: number | string): string {
  const n = toNumber(value);
  return `${n < 0 ? '−' : '+'}${usd.format(Math.abs(n))}`;
}

/** "+8.9%" / "−2.0%". Returns "—" when there is no basis to compare against. */
export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(1)}%`;
}
