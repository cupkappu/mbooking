'use client';

import { useState } from 'react';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/use-budgets';
import { BudgetCard } from '../budget-card/budget-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, Search, Loader2 } from 'lucide-react';
import type { Budget, BudgetListParams } from '@/types';

interface BudgetListProps {
  onCreateNew?: () => void;
  onEditBudget?: (budget: Budget) => void;
}

export function BudgetList({ onCreateNew, onEditBudget }: BudgetListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  const params: BudgetListParams = {
    offset: 0,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  };

  const { data, isLoading, error, refetch } = useBudgets(params);
  const deleteBudget = useDeleteBudget();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget.mutateAsync(id);
      refetch();
    }
  };

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">Error loading budgets</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search budgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="periodic">Periodic</SelectItem>
              <SelectItem value="non_periodic">Non-Periodic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Budget
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onClick={() => onEditBudget?.(budget)}
              onEdit={() => onEditBudget?.(budget)}
              onDelete={() => handleDelete(budget.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No budgets found</p>
          <Button onClick={onCreateNew} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Create your first budget
          </Button>
        </Card>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {((data.page - 1) * data.limit) + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total}
          </span>
        </div>
      )}
    </div>
  );
}
