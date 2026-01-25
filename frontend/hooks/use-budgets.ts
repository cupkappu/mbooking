import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Budget, BudgetListParams, PaginatedResponse } from '@/types';

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

export function useBudgets(params: BudgetListParams = {}) {
  return useQuery({
    queryKey: ['budgets', params],
    queryFn: () => {
      const queryParts: string[] = [];
      if (params.offset !== undefined) queryParts.push(`offset=${params.offset}`);
      if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
      if (params.is_active !== undefined) queryParts.push(`is_active=${params.is_active}`);
      if (params.status) queryParts.push(`status=${params.status}`);
      if (params.type) queryParts.push(`type=${params.type}`);
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      return apiClient.get<PaginatedResponse<Budget>>(`/budgets${queryString}`);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ['budgets', id],
    queryFn: () => apiClient.get<Budget>(`/budgets/${id}`),
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Budget>) => 
      apiClient.post<Budget>('/budgets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Budget> }) =>
      apiClient.put<Budget>(`/budgets/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets', id] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/budgets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useBudgetsList() {
  return useQuery({
    queryKey: ['budgets', 'list'],
    queryFn: () => apiClient.get<Budget[]>('/budgets'),
    staleTime: 5 * 60 * 1000,
  });
}
