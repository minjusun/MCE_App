// Portfolio maths for the Portfolio screen. Works in integer cents so totals of numeric(12,2)
// values never pick up floating-point drift.
import { toNumber } from './format';

export type ValuedHolding = {
  quantity: number;
  /** Market price per unit; null when no price is known yet. */
  unitMarketValue: number | string | null;
  /** What the owner paid per unit; null when not recorded. */
  unitCost: number | string | null;
};

export type PortfolioSummary = {
  marketValue: number;
  /** Cost of the holdings that have a recorded cost. */
  costBasis: number;
  /** Market value minus cost, counting only holdings that have both a price and a cost. */
  profitLoss: number;
  /** Profit/loss as a percentage of that cost; null when nothing is comparable. */
  profitLossPercent: number | null;
  unpricedCount: number;
  uncostedCount: number;
};

const known = (v: number | string | null): v is number | string => v !== null && v !== '';
const cents = (v: number | string) => Math.round(toNumber(v) * 100);

export function summarizePortfolio(holdings: readonly ValuedHolding[]): PortfolioSummary {
  let value = 0, basis = 0, plValue = 0, plCost = 0, unpriced = 0, uncosted = 0;
  for (const h of holdings) {
    if (!Number.isInteger(h.quantity) || h.quantity <= 0) throw new Error(`invalid quantity: ${h.quantity}`);
    const v = known(h.unitMarketValue) ? cents(h.unitMarketValue) * h.quantity : null;
    const c = known(h.unitCost) ? cents(h.unitCost) * h.quantity : null;
    if (v === null) unpriced++; else value += v;
    if (c === null) uncosted++; else basis += c;
    if (v !== null && c !== null) { plValue += v; plCost += c; }
  }
  return {
    marketValue: value / 100,
    costBasis: basis / 100,
    profitLoss: (plValue - plCost) / 100,
    profitLossPercent: plCost > 0 ? ((plValue - plCost) / plCost) * 100 : null,
    unpricedCount: unpriced,
    uncostedCount: uncosted,
  };
}
