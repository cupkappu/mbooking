'use client';

import { useState } from 'react';
import { useBudgetAlerts, useAcknowledgeAlert, useDismissAlert } from '@/hooks/use-budget-alerts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Bell, Check, X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { BudgetAlert } from '@/types';

interface AlertCenterProps {
  budgetId?: string;
  compact?: boolean;
}

const alertTypeIcons: Record<string, typeof AlertCircle> = {
  budget_warning: AlertTriangle,
  budget_exceeded: AlertCircle,
  budget_depleted: AlertCircle,
  budget_period_end: Info,
};

const alertTypeColors: Record<string, string> = {
  budget_warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  budget_exceeded: 'border-destructive bg-destructive/5',
  budget_depleted: 'border-destructive bg-destructive/10',
  budget_period_end: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
};

export function AlertCenter({ budgetId, compact = false }: AlertCenterProps) {
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const params = {
    status: (statusFilter as 'pending' | 'sent' | 'acknowledged' | 'dismissed' | undefined) || undefined,
    budget_id: budgetId,
  };
  
  const { data, isLoading, error, refetch } = useBudgetAlerts(params);
  const acknowledgeAlert = useAcknowledgeAlert();
  const dismissAlert = useDismissAlert();

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlert.mutateAsync({ id });
    refetch();
  };

  const handleDismiss = async (id: string) => {
    await dismissAlert.mutateAsync({ id });
    refetch();
  };

  if (error) {
    return (
      <Card className="p-4 text-center">
        <p className="text-sm text-destructive">Error loading alerts</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const alerts = data?.data || [];
  const totalCount = data?.total || 0;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="text-sm font-medium">
            {totalCount} alert{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
        {alerts.slice(0, 3).map(alert => (
          <div 
            key={alert.id}
            className={`p-2 rounded border text-xs ${alertTypeColors[alert.alert_type] || ''}`}
          >
            <p className="font-medium">{alert.budget_name}</p>
            <p className="text-muted-foreground">{alert.alert_type.replace(/_/g, ' ')}</p>
          </div>
        ))}
        {totalCount > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{totalCount - 3} more
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Alert Center</h2>
          {totalCount > 0 && (
            <Badge variant="secondary">{totalCount}</Badge>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All alerts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All alerts</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {alerts.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No alerts</p>
          <p className="text-sm text-muted-foreground">You're all caught up!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onAcknowledge={() => handleAcknowledge(alert.id)}
              onDismiss={() => handleDismiss(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AlertItemProps {
  alert: BudgetAlert;
  onAcknowledge: () => void;
  onDismiss: () => void;
}

function AlertItem({ alert, onAcknowledge, onDismiss }: AlertItemProps) {
  const Icon = alertTypeIcons[alert.alert_type] || AlertCircle;
  const isPending = alert.status === 'pending';
  const isActionable = isPending || alert.status === 'sent';

  return (
    <Card className={`border-l-4 ${alertTypeColors[alert.alert_type] || ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${
            alert.alert_type === 'budget_exceeded' ? 'bg-destructive/10' : 
            alert.alert_type === 'budget_warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
            'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            <Icon className={`h-5 w-5 ${
              alert.alert_type === 'budget_exceeded' ? 'text-destructive' :
              alert.alert_type === 'budget_warning' ? 'text-yellow-600' :
              'text-blue-600'
            }`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium truncate">{alert.budget_name}</p>
              <Badge variant={
                alert.status === 'pending' ? 'destructive' :
                alert.status === 'acknowledged' ? 'default' :
                'secondary'
              }>
                {alert.status}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground capitalize">
              {alert.alert_type.replace(/_/g, ' ')}
            </p>
            
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span>
                Threshold: {alert.threshold_percent}%
              </span>
              <span>
                Spent: {alert.spent_amount} / {alert.budget_amount} {alert.currency}
              </span>
            </div>

            {alert.message && (
              <p className="text-sm mt-2">{alert.message}</p>
            )}

            {isActionable && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={onAcknowledge}
                >
                  <Check className="h-3 w-3" />
                  Acknowledge
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-muted-foreground"
                  onClick={onDismiss}
                >
                  <X className="h-3 w-3" />
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
