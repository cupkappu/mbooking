'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, Minus, Download, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface PeriodComparisonItem {
  path: string;
  name: string;
  current_amount: number;
  prior_amount: number;
  variance: number;
  variance_percent: number;
  currency: string;
}

interface PeriodComparisonSection {
  name: string;
  items: PeriodComparisonItem[];
  totals: {
    current: number;
    prior: number;
    variance: number;
    variance_percent: number;
  };
}

interface IncomeStatementComparison {
  title: string;
  periods: {
    current: { from: string; to: string };
    prior: { from: string; to: string };
  };
  generated_at: string;
  sections: {
    revenue: PeriodComparisonSection;
    expenses: PeriodComparisonSection;
  };
  totals: {
    revenue: PeriodComparisonSection['totals'];
    expenses: PeriodComparisonSection['totals'];
    net_income: {
      current: number;
      prior: number;
      variance: number;
      variance_percent: number;
    };
    currency: string;
  };
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function VarianceCell({ value, percent }: { value: number; percent: number }) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  if (isNeutral) {
    return (
      <div className="flex items-center gap-2">
        <Minus className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">-</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isPositive ? (
        <ArrowUp className="h-4 w-4 text-green-600" />
      ) : (
        <ArrowDown className="h-4 w-4 text-red-600" />
      )}
      <div className="flex flex-col">
        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
          {formatCurrency(Math.abs(value))}
        </span>
        <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {formatPercent(percent)}
        </span>
      </div>
    </div>
  );
}

function ComparisonTable({ 
  title, 
  data, 
  currency 
}: { 
  title: string; 
  data: PeriodComparisonSection;
  currency: string;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Account</th>
              <th className="text-right p-3 text-sm font-medium">Current Period</th>
              <th className="text-right p-3 text-sm font-medium">Prior Period</th>
              <th className="text-right p-3 text-sm font-medium">Variance</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.path} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.path}</div>
                </td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(item.current_amount, currency)}
                </td>
                <td className="p-3 text-right text-muted-foreground">
                  {formatCurrency(item.prior_amount, currency)}
                </td>
                <td className="p-3 text-right">
                  <VarianceCell value={item.variance} percent={item.variance_percent} />
                </td>
              </tr>
            ))}
            <tr className="border-t bg-muted/50 font-semibold">
              <td className="p-3">Total {title}</td>
              <td className="p-3 text-right">{formatCurrency(data.totals.current, currency)}</td>
              <td className="p-3 text-right">{formatCurrency(data.totals.prior, currency)}</td>
              <td className="p-3 text-right">
                <VarianceCell value={data.totals.variance} percent={data.totals.variance_percent} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function IncomeStatementComparisonPage() {
  const [periodType, setPeriodType] = useState('month');
  const [customCurrentFrom, setCustomCurrentFrom] = useState('');
  const [customCurrentTo, setCustomCurrentTo] = useState('');
  const [customPriorFrom, setCustomPriorFrom] = useState('');
  const [customPriorTo, setCustomPriorTo] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['income-statement-comparison', periodType, customCurrentFrom, customCurrentTo, customPriorFrom, customPriorTo],
    queryFn: () => {
      const params = new URLSearchParams();
      
      if (customCurrentFrom) params.append('current_from_date', customCurrentFrom);
      if (customCurrentTo) params.append('current_to_date', customCurrentTo);
      if (customPriorFrom) params.append('prior_from_date', customPriorFrom);
      if (customPriorTo) params.append('prior_to_date', customPriorTo);
      
      return apiClient.get<IncomeStatementComparison>(`/reports/income-statement/compare?${params.toString()}`);
    },
  });

  const handlePresetChange = (preset: string) => {
    setPeriodType(preset);
    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let periodLength: number;

    switch (preset) {
      case 'month':
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = now;
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        currentStart = new Date(now.getFullYear(), quarter * 3, 1);
        currentEnd = now;
        break;
      case 'year':
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = now;
        break;
      default:
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = now;
    }

    periodLength = currentEnd.getTime() - currentStart.getTime();
    const priorEnd = new Date(currentStart.getTime() - 1);
    const priorStart = new Date(priorEnd.getTime() - periodLength);

    setCustomCurrentFrom(currentStart.toISOString().split('T')[0]);
    setCustomCurrentTo(currentEnd.toISOString().split('T')[0]);
    setCustomPriorFrom(priorStart.toISOString().split('T')[0]);
    setCustomPriorTo(priorEnd.toISOString().split('T')[0]);
  };

  const exportData = () => {
    if (!data) return;
    
    const exportObj = {
      title: data.title,
      periods: data.periods,
      generated_at: data.generated_at,
      sections: data.sections,
      totals: data.totals,
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income_statement_comparison_${data.periods.current.from}_to_${data.periods.current.to}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Income Statement - Period Comparison</h1>
          <p className="text-muted-foreground">Compare financial performance across periods</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {data && (
            <Button onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Period Selection</CardTitle>
          <CardDescription>Choose comparison periods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Preset Period</Label>
              <Select value={periodType} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Current Month</SelectItem>
                  <SelectItem value="quarter">Current Quarter</SelectItem>
                  <SelectItem value="year">Current Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Current Period</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Input
                    type="date"
                    value={customCurrentFrom}
                    onChange={(e) => setCustomCurrentFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input
                    type="date"
                    value={customCurrentTo}
                    onChange={(e) => setCustomCurrentTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Prior Period</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Input
                    type="date"
                    value={customPriorFrom}
                    onChange={(e) => setCustomPriorFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input
                    type="date"
                    value={customPriorTo}
                    onChange={(e) => setCustomPriorTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Comparison
          </Button>
        </CardContent>
      </Card>

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{data.title}</CardTitle>
              <CardDescription>
                Current: {data.periods.current.from} to {data.periods.current.to} | 
                Prior: {data.periods.prior.from} to {data.periods.prior.to}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComparisonTable title="Revenue" data={data.sections.revenue} currency={data.totals.currency} />
              <ComparisonTable title="Expenses" data={data.sections.expenses} currency={data.totals.currency} />

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Net Income</span>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Current</div>
                      <div className="font-semibold">{formatCurrency(data.totals.net_income.current, data.totals.currency)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Prior</div>
                      <div className="font-semibold">{formatCurrency(data.totals.net_income.prior, data.totals.currency)}</div>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <div className="text-sm text-muted-foreground">Variance</div>
                      <VarianceCell value={data.totals.net_income.variance} percent={data.totals.net_income.variance_percent} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground text-center">
            Generated at: {new Date(data.generated_at).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}
