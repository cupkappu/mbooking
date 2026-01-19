import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { Budget, BudgetType } from './budget.entity';
import { TenantContext } from '../common/context/tenant.context';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
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

  async update(id: string, data: Partial<Budget>): Promise<Budget> {
    const budget = await this.findById(id);
    Object.assign(budget, data);
    return this.budgetRepository.save(budget);
  }

  async delete(id: string): Promise<void> {
    const budget = await this.findById(id);
    budget.is_active = false;
    await this.budgetRepository.save(budget);
  }

  async getProgress(id: string): Promise<{
    budget: Budget;
    progress: number;
    remaining: number;
    is_exceeded: boolean;
    is_alert: boolean;
  }> {
    const budget = await this.findById(id);
    const progress = Number(budget.spent_amount) / Number(budget.amount);
    const remaining = Number(budget.amount) - Number(budget.spent_amount);
    const threshold = budget.alert_threshold || 0.8;

    return {
      budget,
      progress: Math.min(progress, 1) * 100,
      remaining: Math.max(remaining, 0),
      is_exceeded: Number(budget.spent_amount) > Number(budget.amount),
      is_alert: progress >= threshold,
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
}
