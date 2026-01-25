'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VarianceChartProps {
  data: Array<{
    date: string;
    budget: number;
    actual: number;
    variance: number;
  }>;
  currency: string;
  className?: string;
}

export function VarianceChart({ data, currency, className }: VarianceChartProps) {
  const maxValue = useMemo(() => {
    const values = data.flatMap(d => [d.budget, d.actual]);
    return Math.max(...values) * 1.1;
  }, [data]);

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      index,
      budgetPercentage: (item.budget / maxValue) * 100,
      actualPercentage: (item.actual / maxValue) * 100,
    }));
  }, [data, maxValue]);

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          No trend data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Budget vs Actual Trends</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Budget</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span>Actual</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[200px] w-full">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground py-2">
            <span>{maxValue.toLocaleString()}</span>
            <span>{(maxValue * 0.75).toLocaleString()}</span>
            <span>{(maxValue * 0.5).toLocaleString()}</span>
            <span>{(maxValue * 0.25).toLocaleString()}</span>
            <span>0</span>
          </div>

          {/* Chart area */}
          <div className="absolute left-8 right-0 top-0 h-full">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="w-full border-t border-dashed border-muted" />
              ))}
            </div>

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-between gap-1 px-1">
              {chartData.map((item) => (
                <div
                  key={item.date}
                  className="flex-1 flex flex-col items-center gap-0.5"
                >
                  {/* Budget bar */}
                  <div
                    className="w-full bg-primary rounded-t"
                    style={{ height: `${item.budgetPercentage}%`, minHeight: '2px' }}
                  />
                  {/* Actual bar */}
                  <div
                    className="w-full bg-muted-foreground/30 rounded-b"
                    style={{ height: `${item.actualPercentage}%`, minHeight: '2px' }}
                  />
                  {/* Date label */}
                  <div className="text-[8px] text-muted-foreground mt-1 truncate w-full text-center">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Variance summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Net Variance</span>
            <Badge variant={
              data.reduce((sum, d) => sum + d.variance, 0) >= 0 ? 'default' : 'destructive'
            }>
              {data.reduce((sum, d) => sum + d.variance, 0) >= 0 ? '+' : ''}
              {currency} {data.reduce((sum, d) => sum + d.variance, 0).toLocaleString()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
