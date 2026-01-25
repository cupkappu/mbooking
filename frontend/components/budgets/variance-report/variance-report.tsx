'use client';

import { useBudgetVariance } from '@/hooks/use-budget-variance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '../progress-bar/progress-bar';
import { VarianceChart } from './variance-chart';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { VarianceReport as VarianceType } from '@/types';
import { useState } from 'react';

interface VarianceReportProps {
  budgetId: string;
  className?: string;
}

export function VarianceReport({ budgetId, className }: VarianceReportProps) {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const { data, isLoading, error } = useBudgetVariance(budgetId, { granularity });

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Error loading variance report</p>
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

  const report = data as VarianceType;
  const isFavorable = report.budget_variance >= 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Variance Analysis</CardTitle>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Budget</p>
            <p className="text-lg font-bold">
              {report.currency} {report.original_budget.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Actual</p>
            <p className="text-lg font-bold">
              {report.currency} {report.actual_spending.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Variance</p>
            <div className="flex items-center justify-center gap-1">
              {isFavorable ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-500" />
              )}
              <p className={`text-lg font-bold ${isFavorable ? 'text-green-500' : 'text-red-500'}`}>
                {report.currency} {Math.abs(report.budget_variance).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Variance %</p>
            <Badge variant={isFavorable ? 'default' : 'destructive'}>
              {report.budget_variance_percentage.toFixed(1)}%
            </Badge>
          </div>
        </div>

        {/* Favorable vs Unfavorable */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-700 dark:text-green-400">Favorable</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {report.currency} {report.favorable_variance.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Under budget</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-700 dark:text-red-400">Unfavorable</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {report.currency} {report.unfavorable_variance.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Over budget</p>
          </div>
        </div>

        {/* Spending Velocity */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Daily Spending Rate</p>
              <p className="text-xl font-bold">
                {report.currency} {report.spending_velocity.toFixed(2)} / day
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={
                report.budget_variance_percentage > 0 ? 'default' :
                report.budget_variance_percentage > -10 ? 'secondary' : 'destructive'
              }>
                {report.budget_variance_percentage >= 0 ? 'On Track' :
                 report.budget_variance_percentage >= -10 ? 'At Risk' : 'Over Budget'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Chart */}
        {report.daily_trends && report.daily_trends.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Budget vs Actual Trends</h4>
            <VarianceChart data={report.daily_trends} currency={report.currency} />
          </div>
        )}

        {/* Period Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <span>Period: {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
