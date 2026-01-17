import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from '../accounts/account.entity';
import { JournalLine } from '../journal/journal-line.entity';
import { IncomeStatementGenerator, IncomeStatement } from './income-statement.generator';

export interface PeriodComparisonItem {
  path: string;
  name: string;
  current_amount: number;
  prior_amount: number;
  variance: number;
  variance_percent: number;
  currency: string;
}

export interface PeriodComparisonSection {
  name: string;
  items: PeriodComparisonItem[];
  totals: {
    current: number;
    prior: number;
    variance: number;
    variance_percent: number;
  };
}

export interface IncomeStatementComparison {
  title: string;
  periods: {
    current: { from: string; to: string };
    prior: { from: string; to: string };
  };
  generated_at: string;
  sections: {
    revenue: PeriodComparisonSection;
    expenses: PeriodComparisonSection;
  };
  totals: {
    revenue: PeriodComparisonSection['totals'];
    expenses: PeriodComparisonSection['totals'];
    net_income: {
      current: number;
      prior: number;
      variance: number;
      variance_percent: number;
    };
    currency: string;
  };
}

@Injectable()
export class IncomeStatementComparisonGenerator {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(JournalLine)
    private journalLineRepository: Repository<JournalLine>,
    private incomeStatementGenerator: IncomeStatementGenerator,
  ) {}

  async generate(
    tenantId: string,
    options: {
      currentFromDate: Date;
      currentToDate: Date;
      priorFromDate: Date;
      priorToDate: Date;
      depth?: number;
      currency?: string;
    },
  ): Promise<IncomeStatementComparison> {
    const { currentFromDate, currentToDate, priorFromDate, priorToDate, depth = 2, currency = 'USD' } = options;

    const accounts = await this.accountRepository.find({
      where: { tenant_id: tenantId, is_active: true },
    });

    const revenueAccounts = accounts.filter((a) => a.type === AccountType.REVENUE);
    const expenseAccounts = accounts.filter((a) => a.type === AccountType.EXPENSE);

    const currentRevenueData = await this.calculateAccountTotals(tenantId, currentFromDate, currentToDate, revenueAccounts);
    const priorRevenueData = await this.calculateAccountTotals(tenantId, priorFromDate, priorToDate, revenueAccounts);
    const currentExpenseData = await this.calculateAccountTotals(tenantId, currentFromDate, currentToDate, expenseAccounts);
    const priorExpenseData = await this.calculateAccountTotals(tenantId, priorFromDate, priorToDate, expenseAccounts);

    const revenueItems = this.compareItems(revenueAccounts, currentRevenueData, priorRevenueData, currency);
    const expenseItems = this.compareItems(expenseAccounts, currentExpenseData, priorExpenseData, currency);

    const revenueSection = this.createSection('Revenue', revenueItems);
    const expenseSection = this.createSection('Expenses', expenseItems);

    return {
      title: 'Income Statement - Period Comparison',
      periods: {
        current: {
          from: currentFromDate.toISOString().split('T')[0],
          to: currentToDate.toISOString().split('T')[0],
        },
        prior: {
          from: priorFromDate.toISOString().split('T')[0],
          to: priorToDate.toISOString().split('T')[0],
        },
      },
      generated_at: new Date().toISOString(),
      sections: {
        revenue: revenueSection,
        expenses: expenseSection,
      },
      totals: {
        revenue: revenueSection.totals,
        expenses: expenseSection.totals,
        net_income: {
          current: revenueSection.totals.current - expenseSection.totals.current,
          prior: revenueSection.totals.prior - expenseSection.totals.prior,
          variance: 0,
          variance_percent: 0,
        },
        currency,
      },
    };
  }

  private compareItems(
    accounts: Account[],
    currentData: Map<string, number>,
    priorData: Map<string, number>,
    currency: string,
  ): PeriodComparisonItem[] {
    return accounts
      .map((account) => {
        const currentAmount = currentData.get(account.id) || 0;
        const priorAmount = priorData.get(account.id) || 0;
        const variance = currentAmount - priorAmount;
        const variancePercent = priorAmount !== 0 ? (variance / Math.abs(priorAmount)) * 100 : (currentAmount !== 0 ? 100 : 0);

        return {
          path: account.path,
          name: account.name,
          current_amount: currentAmount,
          prior_amount: priorAmount,
          variance,
          variance_percent: parseFloat(variancePercent.toFixed(2)),
          currency,
        };
      })
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  private createSection(name: string, items: PeriodComparisonItem[]): PeriodComparisonSection {
    const currentTotal = items.reduce((sum, item) => sum + item.current_amount, 0);
    const priorTotal = items.reduce((sum, item) => sum + item.prior_amount, 0);
    const variance = currentTotal - priorTotal;
    const variancePercent = priorTotal !== 0 ? (variance / Math.abs(priorTotal)) * 100 : (currentTotal !== 0 ? 100 : 0);

    return {
      name,
      items,
      totals: {
        current: currentTotal,
        prior: priorTotal,
        variance,
        variance_percent: parseFloat(variancePercent.toFixed(2)),
      },
    };
  }

  private async calculateAccountTotals(
    tenantId: string,
    fromDate: Date,
    toDate: Date,
    accounts: Account[],
  ): Promise<Map<string, number>> {
    const accountIds = accounts.map((a) => a.id);
    if (accountIds.length === 0) return new Map();

    const lines = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.journal_entry', 'entry')
      .where('line.tenant_id = :tenantId', { tenantId })
      .andWhere('line.account_id IN (:...accountIds)', { accountIds })
      .andWhere('entry.date >= :fromDate', { fromDate })
      .andWhere('entry.date <= :toDate', { toDate })
      .select(['line.account_id', 'SUM(line.converted_amount) as total'])
      .groupBy('line.account_id')
      .getRawMany();

    const totals = new Map<string, number>();
    for (const line of lines) {
      totals.set(line.line_account_id, parseFloat(line.total) || 0);
    }
    return totals;
  }
}
