import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { BudgetTemplate, PaginatedResponse } from '@/types';

export interface TemplateListParams {
  category?: string;
  is_active?: boolean;
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

export function useBudgetTemplates(params: TemplateListParams = {}) {
  return useQuery({
    queryKey: ['budgets', 'templates', params],
    queryFn: () => {
      const queryParts: string[] = [];
      if (params.category) queryParts.push(`category=${params.category}`);
      if (params.is_active !== undefined) queryParts.push(`is_active=${params.is_active}`);
      if (params.page !== undefined) queryParts.push(`page=${params.page}`);
      if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      return apiClient.get<PaginatedResponse<BudgetTemplate>>(`/budget-templates${queryString}`);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useSystemTemplates() {
  return useQuery({
    queryKey: ['budgets', 'templates', 'system'],
    queryFn: () => {
      return apiClient.get<BudgetTemplate[]>('/budget-templates?is_system_template=true');
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<BudgetTemplate>) =>
      apiClient.post<BudgetTemplate>('/budget-templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', 'templates'] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetTemplate> }) =>
      apiClient.put<BudgetTemplate>(`/budget-templates/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', 'templates'] });
      queryClient.invalidateQueries({ queryKey: ['budgets', 'templates', id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/budget-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', 'templates'] });
    },
  });
}
