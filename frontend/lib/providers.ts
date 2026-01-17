import { apiClient } from './api';
import type { RateProvider, CreateProviderRequest, UpdateProviderRequest } from '@/types/provider';

export const providersApi = {
  async getAll(): Promise<RateProvider[]> {
    return apiClient.get<RateProvider[]>('/api/v1/providers');
  },

  async getById(id: string): Promise<RateProvider> {
    return apiClient.get<RateProvider>(`/api/v1/providers/${id}`);
  },

  async create(data: CreateProviderRequest): Promise<RateProvider> {
    return apiClient.post<RateProvider>('/api/v1/providers', data);
  },

  async update(id: string, data: UpdateProviderRequest): Promise<RateProvider> {
    return apiClient.put<RateProvider>(`/api/v1/providers/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/providers/${id}`);
  },

  async setDefault(id: string): Promise<RateProvider> {
    return apiClient.post<RateProvider>(`/api/v1/providers/${id}/set-default`, {});
  },

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(`/api/v1/providers/${id}/test`, {});
  },
};
