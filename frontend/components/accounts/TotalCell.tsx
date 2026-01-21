'use client';

import type { CurrencyBalance } from '@/types';
import { setCurrenciesCache } from '@/lib/currency-formatter';
import { useCurrencies } from '@/hooks/use-currencies';
import { useEffect } from 'react';

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
  const { data: currenciesData } = useCurrencies();

  useEffect(() => {
    if (currenciesData) {
      setCurrenciesCache(currenciesData);
    }
  }, [currenciesData]);
  // Show total only if there are subtree currencies (has children)
  if (!subtreeCurrencies || subtreeCurrencies.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Show individual currencies if available, otherwise show converted total
  const totalItems = subtreeCurrencies && subtreeCurrencies.length > 0
    ? subtreeCurrencies.map((c) => `${formatNumber(c.amount)} ${c.currency}`)
    : convertedSubtreeTotal
      ? [`${formatNumber(convertedSubtreeTotal)} ${displayCurrency}`]
      : [];

  return (
    <div className="flex flex-col">
      {totalItems.map((text, index) => (
        <span key={index} className="font-mono text-sm">
          {text}
        </span>
      ))}
    </div>
  );
}
