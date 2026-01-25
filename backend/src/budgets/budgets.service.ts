import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Budget, BudgetType } from './entities/budget.entity';
import { TenantContext } from '../common/context/tenant.context';
import { BudgetAmountValidator } from './validators/budget-amount.validator';

export interface BudgetListParams {
  offset?: number;
  limit?: number;
  is_active?: boolean;
  status?: string;
  type?: string;
  search?: string;
}

export interface PaginatedBudgetResult {
  data: Budget[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    private budgetAmountValidator: BudgetAmountValidator,
  ) {}

  private getTenantId(): string {
    return TenantContext.requireTenantId();
  }

  async findAll(): Promise<Budget[]> {
    const tenantId = this.getTenantId();
    return this.budgetRepository.find({
      where: { tenant_id: tenantId, is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Budget> {
    const tenantId = this.getTenantId();
    const budget = await this.budgetRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }
    return budget;
  }

  async create(data: Partial<Budget>): Promise<Budget> {
    const tenantId = this.getTenantId();
    const budget = this.budgetRepository.create({
      ...data,
      tenant_id: tenantId,
      spent_amount: 0,
    });
    return this.budgetRepository.save(budget);
  }

  async update(id: string, data: Partial<Budget>, isAdminOverride: boolean = false): Promise<Budget> {
    const budget = await this.findById(id);
    
    // FR-C001: Validate that amount cannot be reduced below spent amount
    // FR-C002: Validation error message in Chinese with spent amount
    if (data.amount !== undefined && !isAdminOverride) {
      const spentAmount = Number(budget.spent_amount) || 0;
      if (data.amount < spentAmount) {
        throw new BadRequestException(`预算金额不能低于已花费金额 ${spentAmount}`);
      }
    }
    
    Object.assign(budget, data);
    return this.budgetRepository.save(budget);
  }

  /**
   * FR-C003: Administrator override for budget amount validation
   * Allows admin to reduce budget below spent amount with audit logging
   */
  async adminUpdate(id: string, data: Partial<Budget>, adminUserId: string): Promise<Budget> {
    // Log the admin override action for audit purposes
    console.log(`[AUDIT] Admin ${adminUserId} override update for budget ${id}:`, {
      originalAmount: (await this.findById(id)).amount,
      newAmount: data.amount,
      timestamp: new Date().toISOString(),
    });
    
    return this.update(id, data, true);
  }

  async delete(id: string): Promise<void> {
    const budget = await this.findById(id);
    budget.is_active = false;
    await this.budgetRepository.save(budget);
  }

  async findWithPagination(params: BudgetListParams): Promise<PaginatedBudgetResult> {
    const tenantId = this.getTenantId();
    const page = params.offset ? Math.floor(params.offset / (params.limit || 20)) + 1 : 1;
    const limit = params.limit || 20;
    const skip = params.offset || 0;

    const queryBuilder = this.budgetRepository
      .createQueryBuilder('budget')
      .where('budget.tenant_id = :tenantId', { tenantId });

    if (params.is_active !== undefined) {
      queryBuilder.andWhere('budget.is_active = :isActive', { isActive: params.is_active });
    }

    if (params.status) {
      queryBuilder.andWhere('budget.status = :status', { status: params.status });
    }

    if (params.type) {
      queryBuilder.andWhere('budget.type = :type', { type: params.type });
    }

    if (params.search) {
      queryBuilder.andWhere(
        '(budget.name ILIKE :search OR budget.description ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    queryBuilder
      .orderBy('budget.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getDetailedProgress(id: string, targetCurrency?: string): Promise<{
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
  }> {
    const budget = await this.findById(id);
    
    const budgetAmount = Number(budget.amount);
    const spentAmount = Number(budget.spent_amount);
    const percentageUsed = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
    const remainingAmount = budgetAmount - spentAmount;
    
    // Calculate days remaining
    const now = new Date();
    const endDate = budget.end_date ? new Date(budget.end_date) : new Date(budget.start_date);
    endDate.setMonth(endDate.getMonth() + 1); // Default to 1 month if no end date
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate total period days
    const startDate = new Date(budget.start_date);
    const totalPeriodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = totalPeriodDays - daysRemaining;
    
    // Calculate daily spending rate
    const dailySpendingRate = daysElapsed > 0 ? spentAmount / daysElapsed : 0;
    
    // Calculate projected end balance
    const projectedEndBalance = spentAmount + (dailySpendingRate * daysRemaining);
    
    // Determine status
    let status: 'normal' | 'warning' | 'exceeded' = 'normal';
    const threshold = budget.alert_threshold || 0.8;
    
    if (percentageUsed >= 100) {
      status = 'exceeded';
    } else if (percentageUsed >= threshold * 100) {
      status = 'warning';
    }
    
    return {
      budget_id: budget.id,
      name: budget.name,
      budget_amount: budgetAmount,
      currency: budget.currency,
      spent_amount: spentAmount,
      remaining_amount: remainingAmount,
      percentage_used: percentageUsed,
      days_remaining: daysRemaining,
      projected_end_balance: projectedEndBalance,
      daily_spending_rate: dailySpendingRate,
      status,
      period_start: new Date(budget.start_date).toISOString(),
      period_end: budget.end_date ? new Date(budget.end_date).toISOString() : endDate.toISOString(),
    };
  }

  async getActiveBudgets(date: Date): Promise<Budget[]> {
    const tenantId = this.getTenantId();
    return this.budgetRepository.find({
      where: {
        tenant_id: tenantId,
        is_active: true,
        start_date: LessThanOrEqual(date),
      },
    });
  }

  async updateSpentAmount(id: string, spentAmount: number, currency: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({ where: { id } });
    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }
    budget.spent_amount = spentAmount;
    budget.spent_currency = currency;
    return this.budgetRepository.save(budget);
  }

  async getMultiCurrencySummary(baseCurrency: string = 'USD'): Promise<{
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
  }> {
    const tenantId = this.getTenantId();
    const budgets = await this.budgetRepository.find({
      where: { tenant_id: tenantId, is_active: true },
    });

    const byCurrency: Record<string, { original: number; spent: number }> = {};
    let totalBudget = 0;
    let totalSpent = 0;

    for (const budget of budgets) {
      const amount = Number(budget.amount);
      const spent = Number(budget.spent_amount);
      
      if (!byCurrency[budget.currency]) {
        byCurrency[budget.currency] = { original: 0, spent: 0 };
      }
      byCurrency[budget.currency].original += amount;
      byCurrency[budget.currency].spent += spent;
      
      totalBudget += amount;
      totalSpent += spent;
    }

    // Calculate exposure risk based on number of currencies
    const exposureRisk = Object.keys(byCurrency).length > 3 ? 'high' : 
                         Object.keys(byCurrency).length > 1 ? 'medium' : 'low';

    // Convert to base currency (simplified - in production, use RateGraphEngine)
    const convertedByCurrency = Object.entries(byCurrency).map(([currency, data]) => {
      // In production, get actual rate from RateGraphEngine
      const exchangeRate = currency === baseCurrency ? 1 : this.getExchangeRate(currency, baseCurrency);
      const convertedAmount = data.original * exchangeRate;
      const convertedSpent = data.spent * exchangeRate;
      
      return {
        currency,
        original_amount: data.original,
        converted_amount: convertedAmount,
        exchange_rate: exchangeRate,
        percentage_of_total: totalBudget > 0 ? (convertedAmount / totalBudget) * 100 : 0,
      };
    });

    return {
      base_currency: baseCurrency,
      total_budget: totalBudget,
      total_spent: totalSpent,
      total_remaining: totalBudget - totalSpent,
      utilization_percentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      exposure_risk: exposureRisk,
      by_currency: convertedByCurrency,
    };
  }

  private getExchangeRate(from: string, to: string): number {
    // Placeholder - in production, use RateGraphEngine
    // This would be injected via constructor
    return 1; // For now, return 1:1
  }

  async getVarianceReport(budgetId: string, options: {
    granularity?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<{
    budget_id: string;
    budget_name: string;
    period_start: string;
    period_end: string;
    original_budget: number;
    actual_spending: number;
    budget_variance: number;
    budget_variance_percentage: number;
    favorable_variance: number;
    unfavorable_variance: number;
    spending_velocity: number;
    currency: string;
    daily_trends?: Array<{ date: string; budget: number; actual: number; variance: number }>;
  }> {
    const budget = await this.findById(budgetId);
    const budgetAmount = Number(budget.amount);
    const spentAmount = Number(budget.spent_amount);
    
    const variance = budgetAmount - spentAmount;
    const variancePercentage = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
    
    // Calculate daily spending rate
    const startDate = new Date(budget.start_date);
    const endDate = budget.end_date ? new Date(budget.end_date) : new Date();
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const spendingVelocity = daysDiff > 0 ? spentAmount / daysDiff : 0;

    return {
      budget_id: budget.id,
      budget_name: budget.name,
      period_start: new Date(budget.start_date).toISOString(),
      period_end: budget.end_date ? new Date(budget.end_date).toISOString() : endDate.toISOString(),
      original_budget: budgetAmount,
      actual_spending: spentAmount,
      budget_variance: variance,
      budget_variance_percentage: variancePercentage,
      favorable_variance: variance > 0 ? variance : 0,
      unfavorable_variance: variance < 0 ? Math.abs(variance) : 0,
      spending_velocity: spendingVelocity,
      currency: budget.currency,
    };
  }
}
