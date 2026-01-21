export interface Currency {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCurrencyRequest {
  code: string;
  name: string;
  symbol: string;
  is_default?: boolean;
}

export interface UpdateCurrencyRequest {
  name?: string;
  symbol?: string;
  is_active?: boolean;
  is_default?: boolean;
}
