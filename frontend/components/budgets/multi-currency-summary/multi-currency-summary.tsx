'use client';

import { useState } from 'react';
import { useMultiCurrencySummary } from '@/hooks/use-multi-currency-summary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ProgressBar } from '../progress-bar/progress-bar';
import type { MultiCurrencySummary as SummaryType } from '@/types';

interface MultiCurrencySummaryProps {
  className?: string;
}

export function MultiCurrencySummary({ className }: MultiCurrencySummaryProps) {
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const { data, isLoading, error } = useMultiCurrencySummary({
    base_currency: baseCurrency,
  });

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Error loading currency summary</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const summary = data as SummaryType;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200';
      default: return 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200';
    }
  };

  const getRiskStatus = (risk: string): 'normal' | 'warning' | 'exceeded' => {
    switch (risk) {
      case 'high': return 'exceeded';
      case 'medium': return 'warning';
      default: return 'normal';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Multi-Currency Summary</CardTitle>
          <Select value={baseCurrency} onValueChange={setBaseCurrency}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="HKD">HKD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="JPY">JPY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-xl font-bold">
              {baseCurrency} {summary.total_budget.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-xl font-bold">
              {baseCurrency} {summary.total_spent.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`text-xl font-bold ${
              summary.total_remaining < 0 ? 'text-destructive' : ''
            }`}>
              {baseCurrency} {summary.total_remaining.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Utilization Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Utilization</span>
            <span className="font-medium">{summary.utilization_percentage.toFixed(1)}%</span>
          </div>
          <ProgressBar
            value={summary.utilization_percentage}
            max={100}
            status={summary.utilization_percentage >= 100 ? 'exceeded' : summary.utilization_percentage >= 80 ? 'warning' : 'normal'}
            size="sm"
          />
        </div>

        {/* Exposure Risk */}
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${getRiskColor(summary.exposure_risk)}`}>
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Exposure Risk: <span className="capitalize">{summary.exposure_risk}</span>
          </span>
        </div>

        {/* Currency Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">By Currency</h4>
          {summary.by_currency.map((item) => (
            <div key={item.currency} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.currency}</span>
                <span className="text-muted-foreground">
                  {item.converted_amount.toLocaleString()} {baseCurrency}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ProgressBar
                  value={item.percentage_of_total}
                  max={100}
                  status="normal"
                  size="sm"
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {item.percentage_of_total.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Rate: 1 {item.currency} = {item.exchange_rate.toFixed(4)} {baseCurrency}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
