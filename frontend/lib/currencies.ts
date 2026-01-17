import { apiClient } from './api';
import type { Currency, CreateCurrencyRequest, UpdateCurrencyRequest } from '@/types/currency';

export const currenciesApi = {
  async getAll(): Promise<Currency[]> {
    return apiClient.get<Currency[]>('/api/v1/currencies');
  },

  async getById(id: string): Promise<Currency> {
    return apiClient.get<Currency>(`/api/v1/currencies/${id}`);
  },

  async create(data: CreateCurrencyRequest): Promise<Currency> {
    return apiClient.post<Currency>('/api/v1/currencies', data);
  },

  async update(id: string, data: UpdateCurrencyRequest): Promise<Currency> {
    return apiClient.put<Currency>(`/api/v1/currencies/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/currencies/${id}`);
  },

  async setDefault(id: string): Promise<Currency> {
    return apiClient.post<Currency>(`/api/v1/currencies/${id}/set-default`, {});
  },
};
