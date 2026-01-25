import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { VarianceReport } from '@/types';

export interface VarianceQueryParams {
  start_date?: string;
  end_date?: string;
  granularity?: 'daily' | 'weekly' | 'monthly';
}

export function useBudgetVariance(budgetId: string, params: VarianceQueryParams = {}) {
  return useQuery({
    queryKey: ['budgets', budgetId, 'variance', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params.start_date) searchParams.set('start_date', params.start_date);
      if (params.end_date) searchParams.set('end_date', params.end_date);
      if (params.granularity) searchParams.set('granularity', params.granularity);
      return apiClient.get<VarianceReport>(`/budgets/${budgetId}/variance?${searchParams}`);
    },
    enabled: !!budgetId,
    staleTime: 5 * 60 * 1000,
  });
}
