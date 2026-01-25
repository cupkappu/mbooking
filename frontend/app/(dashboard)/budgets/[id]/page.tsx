'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBudget } from '@/hooks/use-budgets';
import { useBudgetProgress } from '@/hooks/use-budget-progress';
import { useBudgetAlerts } from '@/hooks/use-budget-alerts';
import { BudgetCard } from '@/components/budgets/budget-card/budget-card';
import { AlertCenter } from '@/components/budgets/alert-center/alert-center';
import { ProgressBar } from '@/components/budgets/progress-bar/progress-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Edit2, Trash2, Loader2, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import type { Budget, BudgetProgress, BudgetAlert } from '@/types';

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params.id as string;

  const { data: budget, isLoading: budgetLoading, error: budgetError, refetch: refetchBudget } = useBudget(budgetId);
  const { data: progress, isLoading: progressLoading, refetch: refetchProgress } = useBudgetProgress(budgetId);
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useBudgetAlerts({ budget_id: budgetId });

  const [activeTab, setActiveTab] = useState('overview');

  // Auto-refresh progress data every 60 seconds
  useEffect(() => {
    if (!budgetId) return;
    
    const progressInterval = setInterval(() => {
      refetchProgress();
    }, 60000);

    const alertsInterval = setInterval(() => {
      refetchAlerts();
    }, 15000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(alertsInterval);
    };
  }, [budgetId, refetchProgress, refetchAlerts]);

  const handleRefresh = () => {
    refetchBudget();
    refetchProgress();
    refetchAlerts();
  };

  if (budgetLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span>Loading budget...</span>
        </div>
      </div>
    );
  }

  if (budgetError || !budget) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Budget Not Found</h1>
            <p className="text-muted-foreground">The requested budget could not be loaded.</p>
          </div>
        </div>
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive">Error loading budget</p>
          <Button variant="outline" onClick={handleRefresh} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const currentProgress = progress || {
    spent_amount: budget.spent_amount || 0,
    remaining_amount: Number(budget.amount) - Number(budget.spent_amount || 0),
    percentage_used: budget.amount > 0 ? (Number(budget.spent_amount) / Number(budget.amount)) * 100 : 0,
    days_remaining: 30,
    projected_end_balance: 0,
    status: 'normal',
    daily_spending_rate: 0,
    period_start: budget.start_date,
    period_end: budget.end_date,
  };

  const percentageUsed = currentProgress.percentage_used || 0;
  const isExceeded = currentProgress.remaining_amount < 0;
  const isWarning = percentageUsed >= 80 && !isExceeded;

  const alerts = alertsData?.data || [];
  const pendingAlerts = alerts.filter((a: BudgetAlert) => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/budgets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{budget.name}</h1>
              {isExceeded ? (
                <Badge variant="destructive">Exceeded</Badge>
              ) : isWarning ? (
                <Badge variant="secondary">Warning</Badge>
              ) : (
                <Badge>On Track</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {formatDate(budget.start_date)} - {formatDate(budget.end_date || budget.start_date)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {pendingAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Budget Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Budget Summary</CardTitle>
                <CardDescription>
                  {budget.type === 'periodic' ? 'Periodic budget' : 'Non-periodic budget'} in {budget.currency}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{percentageUsed.toFixed(1)}%</span>
                  </div>
                  <ProgressBar 
                    value={percentageUsed}
                    className="h-3"
                    status={isExceeded ? 'exceeded' : isWarning ? 'warning' : 'normal'}
                  />
                </div>

                {/* Amount Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Budget Amount</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(Number(budget.amount), budget.currency)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Spent</p>
                    <p className={`text-2xl font-bold ${isExceeded ? 'text-destructive' : ''}`}>
                      {formatCurrency(Number(currentProgress.spent_amount), budget.currency)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className={`text-2xl font-bold ${isExceeded ? 'text-destructive' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(currentProgress.remaining_amount), budget.currency)}
                      {isExceeded ? ' over' : ''}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {budget.description && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">{budget.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Daily Burn Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {currentProgress.daily_spending_rate && currentProgress.daily_spending_rate > 0 ? (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    )}
                    <span className="text-2xl font-bold">
                      {formatCurrency(Math.abs(currentProgress.daily_spending_rate || 0), budget.currency)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">per day</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Days Remaining
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold">{currentProgress.days_remaining}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">of budget period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Projected Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${currentProgress.projected_end_balance && currentProgress.projected_end_balance > Number(budget.amount) ? 'text-destructive' : ''}`}>
                    {formatCurrency(Number(currentProgress.projected_end_balance || 0), budget.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    based on current spending
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending Progress</CardTitle>
              <CardDescription>
                Detailed breakdown of your budget progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Percentage Used</p>
                  <p className={`text-3xl font-bold ${isExceeded ? 'text-destructive' : isWarning ? 'text-yellow-600' : ''}`}>
                    {percentageUsed.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Days into Period</p>
                  <p className="text-3xl font-bold">
                    {30 - (currentProgress.days_remaining || 0)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Should Have Spent</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(
                      (Number(budget.amount) * (1 - (currentProgress.days_remaining || 0) / 30)),
                      budget.currency
                    )}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Spending Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {currentProgress.status === 'normal' ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-lg font-semibold text-green-600">On Track</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <span className="text-lg font-semibold text-destructive">
                          {currentProgress.status === 'exceeded' ? 'Exceeded' : 'Warning'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-4">
          <AlertCenter budgetId={budgetId} />
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-4">
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Transaction history coming soon</p>
            <p className="text-sm text-muted-foreground">
              View all transactions that contribute to this budget
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
