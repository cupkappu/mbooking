export interface Account {
  id: string;
  name: string;
  type: 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expense';
  currency: string;
  path: string;
  depth: number;
  parent_id?: string;
  children?: Account[];
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference_id?: string;
  lines: JournalLine[];
  created_at: string;
}

export interface JournalLine {
  id: string;
  account_id: string;
  amount: number;
  currency: string;
  exchange_rate?: number;
  converted_amount?: number;
  tags: string[];
  remarks?: string;
}

export interface CurrencyBalance {
  currency: string;
  amount: number;
}

export interface AccountBalance {
  account: Account;
  currencies: CurrencyBalance[];
  converted_amount?: number;
  subtree_currencies?: CurrencyBalance[];
  converted_subtree_total?: number;
  converted_subtree_currency?: string;
}

export interface Budget {
  id: string;
  tenant_id: string;
  account_id?: string;
  name: string;
  description?: string;
  type: 'periodic' | 'non_periodic';
  amount: number;
  currency: string;
  start_date: string;
  end_date?: string;
  period_type?: 'monthly' | 'weekly' | 'yearly';
  spent_amount: number;
  spent_currency: string;
  alert_threshold?: number;
  status: 'active' | 'archived' | 'completed';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetProgress {
  budget_id: string;
  name: string;
  budget_amount: number;
  currency: string;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  days_remaining?: number;
  projected_end_balance?: number;
  daily_spending_rate?: number;
  status: 'normal' | 'warning' | 'exceeded';
  period_start: string;
  period_end: string;
}

export interface BudgetAlert {
  id: string;
  budget_id: string;
  budget_name: string;
  alert_type: 'budget_warning' | 'budget_exceeded' | 'budget_depleted' | 'budget_period_end';
  status: 'pending' | 'sent' | 'acknowledged' | 'dismissed';
  threshold_percent: number;
  spent_amount: number;
  budget_amount: number;
  currency: string;
  message?: string;
  created_at: string;
  acknowledged_at?: string;
}

export interface BudgetTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  category: 'personal' | 'business' | 'savings' | 'expense' | 'custom';
  is_system_template: boolean;
  account_pattern?: string;
  account_type?: string;
  default_period_type: 'monthly' | 'weekly' | 'yearly';
  default_amount?: number;
  default_currency: string;
  default_alert_threshold?: number;
  suggested_categories?: string[];
  metadata?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VarianceReport {
  budget_id: string;
  budget_name: string;
  period_start: string;
  period_end: string;
  original_budget: number;
  revised_budget?: number;
  actual_spending: number;
  budget_variance: number;
  budget_variance_percentage: number;
  favorable_variance: number;
  unfavorable_variance: number;
  spending_velocity: number;
  projected_end_balance?: number;
  currency: string;
  daily_trends?: Array<{
    date: string;
    budget: number;
    actual: number;
    variance: number;
  }>;
}

export interface MultiCurrencySummary {
  base_currency: string;
  total_budget: number;
  total_spent: number;
  total_remaining: number;
  utilization_percentage: number;
  exposure_risk: 'low' | 'medium' | 'high';
  by_currency: Array<{
    currency: string;
    original_amount: number;
    converted_amount: number;
    exchange_rate: number;
    percentage_of_total: number;
  }>;
}

export interface BudgetListParams {
  offset?: number;
  limit?: number;
  is_active?: boolean;
  status?: string;
  type?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
