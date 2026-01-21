'use client';

import type { CurrencyBalance } from '@/types';
import { setCurrenciesCache } from '@/lib/currency-formatter';
import { useCurrencies } from '@/hooks/use-currencies';
import { useEffect } from 'react';

interface BalanceDisplayProps {
  currencies: CurrencyBalance[];
  convertedTotal?: number;
  displayCurrency: string;
  showConvertedTotal?: boolean;
}

function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function BalanceDisplay({
  currencies,
  convertedTotal,
  displayCurrency,
  showConvertedTotal = true,
}: BalanceDisplayProps) {
  const { data: currenciesData } = useCurrencies();

  useEffect(() => {
    if (currenciesData) {
      setCurrenciesCache(currenciesData);
    }
  }, [currenciesData]);

  const hasCurrencies = currencies && currencies.length > 0;
  const shouldShowConverted = convertedTotal !== undefined && convertedTotal !== null && !Number.isNaN(convertedTotal);

  const displayConverted = showConvertedTotal && shouldShowConverted;

  return (
    <div className="flex flex-col">
      {hasCurrencies ? (
        currencies.map((c) => (
          <span key={c.currency} className="font-mono">
            {formatNumber(c.amount)} {c.currency}
          </span>
        ))
      ) : (
        <span className="font-mono">0.00</span>
      )}
      
      {displayConverted && (
        <span className="text-xs text-muted-foreground font-mono">
          = {formatNumber(convertedTotal!)} {displayCurrency}
        </span>
      )}
    </div>
  );
}
