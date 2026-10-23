import { summarizePortfolio } from './pricing';

describe('summarizePortfolio', () => {
  it('totals value, cost and profit in exact cents', () => {
    const s = summarizePortfolio([
      { quantity: 3, unitMarketValue: '0.10', unitCost: '0.05' },
      { quantity: 1, unitMarketValue: 118, unitCost: 95.5 },
    ]);
    expect(s.marketValue).toBe(118.3);
    expect(s.costBasis).toBe(95.65);
    expect(s.profitLoss).toBe(22.65);
    expect(s.profitLossPercent).toBeCloseTo(23.68, 2);
  });

  it('leaves unpriced and uncosted holdings out of profit/loss and counts them', () => {
    const s = summarizePortfolio([
      { quantity: 1, unitMarketValue: 100, unitCost: 80 },
      { quantity: 2, unitMarketValue: null, unitCost: 10 },
      { quantity: 1, unitMarketValue: 50, unitCost: null },
    ]);
    expect(s.marketValue).toBe(150);
    expect(s.costBasis).toBe(100);
    expect(s.profitLoss).toBe(20);
    expect(s.profitLossPercent).toBe(25);
    expect(s.unpricedCount).toBe(1);
    expect(s.uncostedCount).toBe(1);
  });

  it('has no percentage without a comparable cost basis', () => {
    expect(summarizePortfolio([]).profitLossPercent).toBeNull();
    expect(summarizePortfolio([{ quantity: 1, unitMarketValue: 10, unitCost: null }]).profitLossPercent).toBeNull();
  });

  it('rejects quantities the database would reject', () => {
    expect(() => summarizePortfolio([{ quantity: 0, unitMarketValue: 1, unitCost: 1 }])).toThrow('invalid quantity');
    expect(() => summarizePortfolio([{ quantity: 1.5, unitMarketValue: 1, unitCost: 1 }])).toThrow('invalid quantity');
  });
});
