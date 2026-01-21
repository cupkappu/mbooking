import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import type { Account, JournalEntry, AccountBalance } from '@/types';

export function useAccounts() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient.get<Account[]>('/accounts/tree'),
    // Only fetch when session is loaded AND has accessToken
    enabled: status === 'authenticated' && !!session?.accessToken,
  });
}

export function useAccount(id: string) {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ['accounts', id],
    queryFn: () => apiClient.get<Account>(`/accounts/${id}`),
    enabled: !!id && status === 'authenticated' && !!session?.accessToken,
  });
}

export function useCreateAccount() {
  return useMutation({
    mutationFn: (data: Partial<Account>) =>
      apiClient.post<Account>('/accounts', data),
    onSuccess: () => {},
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<Account>(`/accounts/${id}`),
    onSuccess: () => {},
  });
}

export function useUpdateAccount() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Account> }) =>
      apiClient.put<Account>(`/accounts/${id}`, data),
    onSuccess: () => {},
  });
}

export function useJournalEntries(options?: { offset?: number; limit?: number }) {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ['journal-entries', options],
    queryFn: () =>
      apiClient.get<{ entries: JournalEntry[] }>(
        `/journal?offset=${options?.offset || 0}&limit=${options?.limit || 50}`
      ),
    enabled: status === 'authenticated' && !!session?.accessToken,
  });
}

export function useCreateJournalEntry() {
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post<JournalEntry>('/journal', data),
    onSuccess: () => {},
  });
}

export function useDeleteJournalEntry() {
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<JournalEntry>(`/journal/${id}`),
    onSuccess: () => {},
  });
}

export function useUpdateJournalEntry() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.put<JournalEntry>(`/journal/${id}`, data),
    onSuccess: () => {},
  });
}

export function useBalances(query: {
  depth?: number;
  convert_to?: string;
  date_range?: { from: string; to: string };
  include_subtree?: boolean;
}) {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ['balances', query],
    queryFn: () =>
      apiClient.post<{ balances: AccountBalance[] }>('/query/balances', query),
    enabled: status === 'authenticated' && !!session?.accessToken,
  });
}

export interface DashboardSummary {
  /** Per-currency assets, e.g. { HKD: 1000, USD: 50 } */
  assets: { [currency: string]: number } | null;
  /** Assets converted to default currency */
  converted_assets: number | null;
  /** Per-currency liabilities */
  liabilities: { [currency: string]: number } | null;
  /** Liabilities converted to default currency */
  converted_liabilities: number | null;
  /** Net worth in default currency */
  netWorth: number | null;
  recentTransactions: {
    id: string;
    date: string;
    description: string;
    amount: number | null;
    currency: string;
  }[];
}

export function useDashboardSummary() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient.get<DashboardSummary>('/query/summary'),
    // Only fetch when session is loaded AND has accessToken
    enabled: status === 'authenticated' && !!session?.accessToken,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}

export interface TenantInfo {
  id: string;
  name: string;
  settings?: {
    default_currency?: string;
    timezone?: string;
    [key: string]: any;
  };
}

export function useDefaultCurrency() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ['default-currency'],
    queryFn: () => apiClient.get<TenantInfo>('/tenants/current'),
    select: (data) => data.settings?.default_currency || 'USD',
    // Only fetch when session is loaded AND has accessToken
    enabled: status === 'authenticated' && !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
