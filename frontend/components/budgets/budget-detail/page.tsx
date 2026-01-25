'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBudget } from '@/hooks/use-budgets';
import { useBudgetProgress } from '@/hooks/use-budget-progress';
import { useBudgetAlerts } from '@/hooks/use-budget-alerts';
import { useBudgetVariance } from '@/hooks/use-budget-variance';
import { useDeleteBudget } from '@/hooks/use-budgets';
import { ProgressBar } from '../progress-bar/progress-bar';
import { AlertCenter } from '../alert-center/alert-center';
import { VarianceReport } from '../variance-report/variance-report';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Calendar, DollarSign, Edit, Trash2, AlertTriangle } from 'lucide-react';
import type { Budget } from '@/types';

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params.id as string;

  const { data: budget, isLoading: budgetLoading, error: budgetError } = useBudget(budgetId);
  const { data: progress, isLoading: progressLoading } = useBudgetProgress(budgetId);
  const { data: alerts } = useBudgetAlerts({ budget_id: budgetId });
  const { data: variance } = useBudgetVariance(budgetId);
  const deleteBudget = useDeleteBudget();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (budgetLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (budgetError || !budget) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Budget not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const b = budget as Budget;
  const progressData = progress;
  const pendingAlerts = alerts?.total || 0;

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget.mutateAsync(budgetId);
      router.push('/budgets');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const percentageUsed = b.amount > 0 
    ? (Number(b.spent_amount) / Number(b.amount)) * 100 
    : 0;
  
  const remaining = Number(b.amount) - Number(b.spent_amount);
  const isExceeded = remaining < 0;
  const isWarning = percentageUsed >= 80 && !isExceeded;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{b.name}</h1>
            {b.description && (
              <p className="text-muted-foreground">{b.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {isExceeded && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="font-medium">
            Budget exceeded by {formatCurrency(Math.abs(remaining), b.currency)}
          </span>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Budget Amount</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(Number(b.amount), b.currency)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Spent</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(Number(b.spent_amount), b.spent_currency || b.currency)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Remaining</span>
            </div>
            <p className={`text-2xl font-bold ${remaining < 0 ? 'text-destructive' : ''}`}>
              {formatCurrency(remaining, b.currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Usage</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{percentageUsed.toFixed(1)}%</p>
              <Badge variant={isExceeded ? 'destructive' : isWarning ? 'secondary' : 'default'}>
                {isExceeded ? 'Exceeded' : isWarning ? 'Warning' : 'On Track'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {pendingAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="variance">Variance Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Progress Section */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Spent: {formatCurrency(Number(b.spent_amount), b.spent_currency || b.currency)}</span>
                <span>Budget: {formatCurrency(Number(b.amount), b.currency)}</span>
              </div>
              <ProgressBar
                value={percentageUsed}
                max={100}
                status={isExceeded ? 'exceeded' : isWarning ? 'warning' : 'normal'}
                size="lg"
                showLabel
              />
              
              {progressData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Days Remaining</p>
                    <p className="font-semibold">{progressData.days_remaining || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Rate</p>
                    <p className="font-semibold">{formatCurrency(progressData.daily_spending_rate || 0, b.currency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Projected End</p>
                    <p className="font-semibold">{formatCurrency(progressData.projected_end_balance || 0, b.currency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Period End</p>
                    <p className="font-semibold">
                      {new Date(progressData.period_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Details */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Type</dt>
                  <dd className="font-medium capitalize">{b.type.replace('_', ' ')}</dd>
                </div>
                {b.period_type && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Period</dt>
                    <dd className="font-medium capitalize">{b.period_type}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted-foreground">Start Date</dt>
                  <dd className="font-medium">{new Date(b.start_date).toLocaleDateString()}</dd>
                </div>
                {b.end_date && (
                  <div>
                    <dt className="text-sm text-muted-foreground">End Date</dt>
                    <dd className="font-medium">{new Date(b.end_date).toLocaleDateString()}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted-foreground">Currency</dt>
                  <dd className="font-medium">{b.currency}</dd>
                </div>
                {b.alert_threshold && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Alert Threshold</dt>
                    <dd className="font-medium">{(b.alert_threshold * 100).toFixed(0)}%</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <AlertCenter budgetId={budgetId} />
        </TabsContent>

        <TabsContent value="variance">
          <VarianceReport budgetId={budgetId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
