import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { Budget, BudgetType } from './budget.entity';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
  ) {}

  async findAll(tenantId: string): Promise<Budget[]> {
    return this.budgetRepository.find({
      where: { tenant_id: tenantId, is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }
    return budget;
  }

  async create(data: Partial<Budget>, tenantId: string): Promise<Budget> {
    const budget = this.budgetRepository.create({
      ...data,
      tenant_id: tenantId,
      spent_amount: 0,
    });
    return this.budgetRepository.save(budget);
  }

  async update(id: string, data: Partial<Budget>, tenantId: string): Promise<Budget> {
    const budget = await this.findById(id, tenantId);
    Object.assign(budget, data);
    return this.budgetRepository.save(budget);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const budget = await this.findById(id, tenantId);
    budget.is_active = false;
    await this.budgetRepository.save(budget);
  }

  async getProgress(id: string, tenantId: string): Promise<{
    budget: Budget;
    progress: number;
    remaining: number;
    is_exceeded: boolean;
    is_alert: boolean;
  }> {
    const budget = await this.findById(id, tenantId);
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

  async getActiveBudgets(tenantId: string, date: Date): Promise<Budget[]> {
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
