import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { BudgetProgress } from '@/types';

export function useBudgetProgress(budgetId: string, options?: { target_currency?: string }) {
  return useQuery({
    queryKey: ['budgets', budgetId, 'progress', options],
    queryFn: () => {
      const params = new URLSearchParams();
      if (options?.target_currency) {
        params.set('target_currency', options.target_currency);
      }
      return apiClient.get<BudgetProgress>(`/budgets/${budgetId}/progress?${params}`);
    },
    enabled: !!budgetId,
    staleTime: 60 * 1000, // 1 minute TTL as per spec
    refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
  });
}
