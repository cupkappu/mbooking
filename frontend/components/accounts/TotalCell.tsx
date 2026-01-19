'use client';

import type { CurrencyBalance } from '@/types';

interface TotalCellProps {
  subtreeCurrencies?: CurrencyBalance[];
  convertedSubtreeTotal?: number;
  displayCurrency: string;
}

function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function TotalCell({
  subtreeCurrencies,
  convertedSubtreeTotal,
  displayCurrency,
}: TotalCellProps) {
  // Show total only if there are subtree currencies (has children)
  if (!subtreeCurrencies || subtreeCurrencies.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  const totalText = convertedSubtreeTotal
    ? `${formatNumber(convertedSubtreeTotal)} ${displayCurrency}`
    : subtreeCurrencies
        .map((c) => `${formatNumber(c.amount)} ${c.currency}`)
        .join(' + ');

  return (
    <span className="font-mono text-sm">
      {totalText}
    </span>
  );
}
