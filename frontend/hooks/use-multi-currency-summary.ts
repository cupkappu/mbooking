import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { MultiCurrencySummary } from '@/types';

export interface MultiCurrencySummaryParams {
  base_currency?: string;
  include_inactive?: boolean;
}

export function useMultiCurrencySummary(params: MultiCurrencySummaryParams = {}) {
  return useQuery({
    queryKey: ['budgets', 'summary', 'multicurrency', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params.base_currency) searchParams.set('base_currency', params.base_currency);
      if (params.include_inactive) searchParams.set('include_inactive', 'true');
      return apiClient.get<MultiCurrencySummary>(`/budgets/summary/multicurrency?${searchParams}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
