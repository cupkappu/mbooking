export interface RateProvider {
  id: string;
  name: string;
  type: 'builtin' | 'api' | 'file' | 'custom';
  config: Record<string, any>;
  is_active: boolean;
  is_default: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProviderRequest {
  name: string;
  type: 'builtin' | 'api' | 'file' | 'custom';
  config: Record<string, any>;
  is_default?: boolean;
  priority?: number;
}

export interface UpdateProviderRequest {
  name?: string;
  config?: Record<string, any>;
  is_active?: boolean;
  is_default?: boolean;
  priority?: number;
}
