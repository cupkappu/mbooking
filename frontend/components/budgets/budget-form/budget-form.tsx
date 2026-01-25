'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useCreateBudget, useUpdateBudget } from '@/hooks/use-budgets';
import { useToast } from '@/hooks/use-toast';
import type { Budget } from '@/types';

const budgetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().optional(),
  type: z.enum(['periodic', 'non_periodic']),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  period_type: z.enum(['monthly', 'weekly', 'yearly']).optional(),
  account_id: z.string().optional(),
  alert_threshold: z.number().min(0).max(1).optional(),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  budget?: Budget;
  onSuccess: () => void;
  onCancel: () => void;
}

const CURRENCIES = ['USD', 'HKD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'SGD'];

export function BudgetForm({ budget, onSuccess, onCancel }: BudgetFormProps) {
  const isEditing = !!budget;
  
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const { toast } = useToast();

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: budget?.name || '',
      description: budget?.description || '',
      type: (budget?.type as 'periodic' | 'non_periodic') || 'periodic',
      amount: budget?.amount ? Number(budget.amount) : undefined,
      currency: budget?.currency || 'USD',
      start_date: budget?.start_date ? budget.start_date.split('T')[0] : '',
      end_date: budget?.end_date ? budget.end_date.split('T')[0] : '',
      period_type: (budget?.period_type as 'monthly' | 'weekly' | 'yearly') || 'monthly',
      account_id: budget?.account_id || '',
      alert_threshold: budget?.alert_threshold || 0.8,
    },
  });

  const { register, control, handleSubmit, formState: { errors }, watch } = form;
  const budgetType = watch('type');
  const isSubmitting = createBudget.isPending || updateBudget.isPending;

  const onSubmit = async (data: BudgetFormData) => {
    try {
      if (isEditing && budget) {
        await updateBudget.mutateAsync({ id: budget.id, data });
        toast({
          title: 'Budget updated',
          description: 'Your budget has been updated successfully.',
        });
      } else {
        await createBudget.mutateAsync(data);
        toast({
          title: 'Budget created',
          description: 'Your new budget has been created successfully.',
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving budget:', error);
      // Extract error message from API response
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to save budget. Please try again.';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Budget' : 'Create New Budget'}</CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Update your budget details below' 
            : 'Fill in the details to create a new budget'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Budget Name</label>
            <Input 
              id="name"
              placeholder="e.g., Monthly Food Budget"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
            <Input 
              id="description"
              placeholder="Brief description of this budget"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">Budget Type</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="periodic">Periodic</SelectItem>
                      <SelectItem value="non_periodic">Non-Periodic</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium">Currency</label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">Budget Amount</label>
            <Input 
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {budgetType === 'periodic' && (
            <div className="space-y-2">
              <label htmlFor="period_type" className="text-sm font-medium">Period Type</label>
              <Controller
                name="period_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="period_type">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start_date" className="text-sm font-medium">Start Date</label>
              <Input 
                id="start_date"
                type="date"
                {...register('start_date')}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="end_date" className="text-sm font-medium">End Date (Optional)</label>
              <Input 
                id="end_date"
                type="date"
                {...register('end_date')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="alert_threshold" className="text-sm font-medium">Alert Threshold (80%)</label>
            <Input 
              id="alert_threshold"
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              {...register('alert_threshold', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Get notified when spending reaches this percentage
            </p>
          </div>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Budget' : 'Create Budget'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
