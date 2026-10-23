import { formatMoney, formatPercent, formatSignedMoney, toNumber } from './format';

describe('format', () => {
  it('formats numeric(12,2) strings and numbers as USD', () => {
    expect(formatMoney('1353.8')).toBe('$1,353.80');
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(null)).toBe('$0.00');
    expect(formatMoney(1630.72, { whole: true })).toBe('$1,631');
  });

  it('signs gains and losses with a true minus sign', () => {
    expect(formatSignedMoney(110.87)).toBe('+$110.87');
    expect(formatSignedMoney('-3')).toBe('−$3.00');
    expect(formatPercent(8.94)).toBe('+8.9%');
    expect(formatPercent(-2)).toBe('−2.0%');
    expect(formatPercent(null)).toBe('—');
  });

  it('refuses values that are not numbers', () => {
    expect(() => toNumber('abc')).toThrow('not a number');
  });
});
