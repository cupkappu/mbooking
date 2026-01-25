'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Budget } from '@/types';
import { Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  pendingAlerts?: number;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function BudgetCard({
  budget,
  onClick,
  onEdit,
  onDelete,
  showActions = true,
  pendingAlerts = 0,
}: BudgetCardProps) {
  const percentageUsed = budget.amount > 0 
    ? (Number(budget.spent_amount) / Number(budget.amount)) * 100 
    : 0;
  
  const remaining = Number(budget.amount) - Number(budget.spent_amount);
  const isExceeded = remaining < 0;
  const isWarning = percentageUsed >= 80 && !isExceeded;

  const getStatusBadge = () => {
    if (isExceeded) {
      return <Badge variant="destructive">Exceeded</Badge>;
    }
    if (isWarning) {
      return <Badge variant="secondary">Warning</Badge>;
    }
    return <Badge>On Track</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            {budget.name}
          </CardTitle>
          {getStatusBadge()}
        </div>
        {budget.description && (
          <p className="text-sm text-muted-foreground truncate">
            {budget.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{budget.currency}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(budget.start_date)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{percentageUsed.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${isExceeded ? 'bg-destructive' : isWarning ? 'bg-yellow-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="font-semibold">
              {formatCurrency(Number(budget.amount), budget.currency)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="font-semibold">
              {formatCurrency(Number(budget.spent_amount), budget.spent_currency || budget.currency)}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-2 text-sm ${isExceeded ? 'text-destructive' : isWarning ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
          {isExceeded ? (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>Over budget by {formatCurrency(Math.abs(remaining), budget.currency)}</span>
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              <span>{formatCurrency(remaining, budget.currency)} remaining</span>
            </>
          )}
        </div>

        {pendingAlerts > 0 && (
          <Badge variant="outline" className="w-full justify-center">
            {pendingAlerts} pending alert{pendingAlerts > 1 ? 's' : ''}
          </Badge>
        )}

        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
