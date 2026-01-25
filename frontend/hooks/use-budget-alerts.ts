import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { BudgetAlert, PaginatedResponse } from '@/types';

export interface AlertListParams {
  status?: 'pending' | 'sent' | 'acknowledged' | 'dismissed';
  alert_type?: string;
  budget_id?: string;
  min_threshold?: number;
  page?: number;
  limit?: number;
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

export function useBudgetAlerts(params: AlertListParams = {}) {
  return useQuery({
    queryKey: ['budgets', 'alerts', params],
    queryFn: () => {
      const queryParts: string[] = [];
      if (params.status) queryParts.push(`status=${params.status}`);
      if (params.alert_type) queryParts.push(`alert_type=${params.alert_type}`);
      if (params.budget_id) queryParts.push(`budget_id=${params.budget_id}`);
      if (params.min_threshold !== undefined) queryParts.push(`min_threshold=${params.min_threshold}`);
      if (params.page !== undefined) queryParts.push(`page=${params.page}`);
      if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      return apiClient.get<PaginatedResponse<BudgetAlert>>(`/budgets/alerts${queryString}`);
    },
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient.post<BudgetAlert>(`/budget-alerts/${id}/acknowledge`, notes ? { notes } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', 'alerts'] });
    },
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post<BudgetAlert>(`/budget-alerts/${id}/dismiss`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', 'alerts'] });
    },
  });
}

export function usePendingAlertCount() {
  return useQuery({
    queryKey: ['budgets', 'alerts', 'count'],
    queryFn: () => {
      const queryString = buildQueryString({ status: 'pending' });
      return apiClient.get<{ count: number }>(`/budgets/alerts/count?${queryString}`);
    },
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
  });
}
