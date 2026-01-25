import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Budget, BudgetType, PeriodType } from './budget.entity';
import { BudgetAlert, AlertType, AlertStatus } from './entities/budget-alert.entity';
import { JournalLine } from '../journal/journal-line.entity';
import { Account } from '../accounts/account.entity';
import { QueryService } from '../query/query.service';

export interface AlertResult {
  alerts: BudgetAlert[];
  checked: number;
  triggered: number;
}

@Injectable()
export class BudgetAlertService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(BudgetAlert)
    private alertRepository: Repository<BudgetAlert>,
    @InjectRepository(JournalLine)
    private journalLineRepository: Repository<JournalLine>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private queryService: QueryService,
  ) {}

  async checkBudgetAlerts(tenantId: string): Promise<AlertResult> {
    const budgets = await this.budgetRepository.find({
      where: { tenant_id: tenantId, is_active: true },
    });

    const alerts: BudgetAlert[] = [];
    let triggered = 0;

    for (const budget of budgets) {
      const spentAmount = await this.calculateSpentAmount(budget);
      const percentUsed = (spentAmount / Number(budget.amount)) * 100;

      // Check if alert should be triggered
      if (budget.alert_threshold !== null && percentUsed >= Number(budget.alert_threshold)) {
        const existingAlert = await this.findExistingAlert(budget.id, AlertType.BUDGET_WARNING);
        if (!existingAlert) {
          const alert = await this.createAlert(budget, spentAmount, percentUsed);
          alerts.push(alert);
          triggered++;
        }
      }

      // Check if budget is exceeded
      if (spentAmount > Number(budget.amount)) {
        const existingAlert = await this.findExistingAlert(budget.id, AlertType.BUDGET_EXCEEDED);
        if (!existingAlert) {
          const alert = await this.createAlert(budget, spentAmount, percentUsed, AlertType.BUDGET_EXCEEDED);
          alerts.push(alert);
          triggered++;
        }
      }

      // Check if budget is depleted (100%)
      if (percentUsed >= 100) {
        const existingAlert = await this.findExistingAlert(budget.id, AlertType.BUDGET_DEPLETED);
        if (!existingAlert) {
          const alert = await this.createAlert(budget, spentAmount, percentUsed, AlertType.BUDGET_DEPLETED);
          alerts.push(alert);
          triggered++;
        }
      }
    }

    return { alerts, checked: budgets.length, triggered };
  }

  async calculateSpentAmount(budget: Budget): Promise<number> {
    const { start_date, end_date } = this.getBudgetPeriod(budget);

    // Get balances from QueryService for the budget period
    const balancesResult = await this.queryService.getBalances({
      date_range: { from: start_date.toISOString().split('T')[0], to: end_date.toISOString().split('T')[0] },
      include_subtree: true,
    });

    // Sum up all converted amounts
    let total = 0;
    for (const balance of balancesResult.balances) {
      total += balance.converted_subtree_total || 0;
    }

    return total;
  }

  private getBudgetPeriod(budget: Budget): { start_date: Date; end_date: Date } {
    const now = new Date();

    if (budget.type === BudgetType.NON_PERIODIC) {
      return {
        start_date: budget.start_date,
        end_date: budget.end_date || now,
      };
    }

    // For periodic budgets, calculate current period
    let startDate: Date;
    let endDate: Date;

    switch (budget.period_type) {
      case PeriodType.WEEKLY:
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        endDate = new Date(weekStart);
        endDate.setDate(weekStart.getDate() + 6);
        break;

      case PeriodType.MONTHLY:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;

      case PeriodType.YEARLY:
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;

      default:
        startDate = budget.start_date;
        endDate = budget.end_date || now;
    }

    return { start_date: startDate, end_date: endDate };
  }

  /**
   * Find existing alert for budget and alert type within 24-hour window
   * FR-C008: Same alert type for same budget is not sent more than once in 24 hours
   * 
   * @param budgetId - The budget ID to check
   * @param alertType - The type of alert to check
   * @returns The existing alert if found, null otherwise
   */
  async findExistingAlert(budgetId: string, alertType: AlertType): Promise<BudgetAlert | null> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.alertRepository.findOne({
      where: {
        budget_id: budgetId,
        alert_type: alertType,
        status: AlertStatus.PENDING,
        created_at: MoreThanOrEqual(oneDayAgo),
      },
    });
  }

  /**
   * Check for duplicate alert using sent_at timestamp
   * FR-C009: Additional deduplication check using sent_at
   * 
   * @param budgetId - The budget ID to check
   * @param alertType - The type of alert to check
   * @returns The existing alert if found within 24 hours of sent_at, null otherwise
   */
  async findExistingAlertBySentAt(budgetId: string, alertType: AlertType): Promise<BudgetAlert | null> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.alertRepository.findOne({
      where: {
        budget_id: budgetId,
        alert_type: alertType,
        sent_at: MoreThanOrEqual(oneDayAgo),
      },
    });
  }

  private async createAlert(
    budget: Budget,
    spentAmount: number,
    percentUsed: number,
    alertType: AlertType = AlertType.BUDGET_WARNING,
  ): Promise<BudgetAlert> {
    const percentUsedNum = parseFloat(percentUsed.toFixed(2));

    let message: string;
    if (alertType === AlertType.BUDGET_EXCEEDED) {
      message = `Budget "${budget.name}" has been exceeded by ${(percentUsedNum - 100).toFixed(1)}%. Current spending: ${spentAmount} ${budget.currency}`;
    } else if (alertType === AlertType.BUDGET_DEPLETED) {
      message = `Budget "${budget.name}" is fully depleted (${percentUsedNum.toFixed(1)}% used). Current spending: ${spentAmount} ${budget.currency}`;
    } else {
      message = `Budget "${budget.name}" has reached ${percentUsedNum.toFixed(1)}% of its limit. Current spending: ${spentAmount} ${budget.currency}`;
    }

    const alert = this.alertRepository.create({
      id: uuidv4(),
      tenant_id: budget.tenant_id,
      budget_id: budget.id,
      alert_type: alertType,
      status: AlertStatus.PENDING,
      threshold_percent: budget.alert_threshold || percentUsedNum,
      spent_amount: spentAmount,
      budget_amount: Number(budget.amount),
      currency: budget.currency,
      message,
      created_at: new Date(),
    });

    return this.alertRepository.save(alert);
  }

  async listAlerts(
    tenantId: string,
    options: {
      status?: AlertStatus;
      budgetId?: string;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ alerts: BudgetAlert[]; total: number }> {
    const { status, budgetId, fromDate, toDate, limit = 50, offset = 0 } = options;

    const query = this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.tenant_id = :tenantId', { tenantId });

    if (status) {
      query.andWhere('alert.status = :status', { status });
    }

    if (budgetId) {
      query.andWhere('alert.budget_id = :budgetId', { budgetId });
    }

    if (fromDate) {
      query.andWhere('alert.created_at >= :fromDate', { fromDate });
    }

    if (toDate) {
      query.andWhere('alert.created_at <= :toDate', { toDate });
    }

    query.orderBy('alert.created_at', 'DESC');
    query.skip(offset);
    query.take(limit);

    const [alerts, total] = await query.getManyAndCount();

    return { alerts, total };
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<BudgetAlert> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.user_id = userId;
    alert.acknowledged_at = new Date();

    return this.alertRepository.save(alert);
  }

  async dismissAlert(alertId: string, userId: string): Promise<BudgetAlert> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = AlertStatus.DISMISSED;
    alert.user_id = userId;
    alert.acknowledged_at = new Date();

    return this.alertRepository.save(alert);
  }

  async getAlertStats(tenantId: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    acknowledged: number;
    dismissed: number;
    by_type: Record<string, number>;
  }> {
    const alerts = await this.alertRepository.find({
      where: { tenant_id: tenantId },
    });

    const stats = {
      total: alerts.length,
      pending: 0,
      sent: 0,
      acknowledged: 0,
      dismissed: 0,
      by_type: {} as Record<string, number>,
    };

    for (const alert of alerts) {
      switch (alert.status) {
        case AlertStatus.PENDING:
          stats.pending++;
          break;
        case AlertStatus.SENT:
          stats.sent++;
          break;
        case AlertStatus.ACKNOWLEDGED:
          stats.acknowledged++;
          break;
        case AlertStatus.DISMISSED:
          stats.dismissed++;
          break;
      }

      stats.by_type[alert.alert_type] = (stats.by_type[alert.alert_type] || 0) + 1;
    }

    return stats;
  }
}
