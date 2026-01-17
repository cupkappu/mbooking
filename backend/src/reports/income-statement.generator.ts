import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from '../accounts/account.entity';
import { JournalLine } from '../journal/journal-line.entity';

interface IncomeStatementSection {
  name: string;
  items: Array<{
    path: string;
    name: string;
    amount: number;
    currency: string;
  }>;
  total: number;
}

export interface IncomeStatement {
  title: string;
  period: { from: string; to: string };
  generated_at: string;
  sections: {
    revenue: IncomeStatementSection;
    expenses: IncomeStatementSection;
  };
  totals: {
    revenue: number;
    expenses: number;
    net_income: number;
    currency: string;
  };
}

@Injectable()
export class IncomeStatementGenerator {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(JournalLine)
    private journalLineRepository: Repository<JournalLine>,
  ) {}

  async generate(
    tenantId: string,
    fromDate: Date,
    toDate: Date,
    depth: number = 2,
    currency: string = 'USD',
  ): Promise<IncomeStatement> {
    const accounts = await this.accountRepository.find({
      where: { tenant_id: tenantId, is_active: true },
    });

    const revenueAccounts = accounts.filter((a) => a.type === AccountType.REVENUE);
    const expenseAccounts = accounts.filter((a) => a.type === AccountType.EXPENSE);

    const revenueData = await this.calculateAccountTotals(tenantId, fromDate, toDate, revenueAccounts);
    const expenseData = await this.calculateAccountTotals(tenantId, fromDate, toDate, expenseAccounts);

    const revenueItems = revenueAccounts.map((account) => ({
      path: account.path,
      name: account.name,
      amount: revenueData.get(account.id) || 0,
      currency,
    }));

    const expenseItems = expenseAccounts.map((account) => ({
      path: account.path,
      name: account.name,
      amount: expenseData.get(account.id) || 0,
      currency,
    }));

    const revenueTotal = Array.from(revenueData.values()).reduce((sum, val) => sum + val, 0);
    const expenseTotal = Array.from(expenseData.values()).reduce((sum, val) => sum + val, 0);

    const revenue: IncomeStatementSection = {
      name: 'Revenue',
      items: revenueItems.sort((a, b) => a.path.localeCompare(b.path)),
      total: revenueTotal,
    };

    const expenses: IncomeStatementSection = {
      name: 'Expenses',
      items: expenseItems.sort((a, b) => a.path.localeCompare(b.path)),
      total: expenseTotal,
    };

    return {
      title: 'Income Statement',
      period: {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
      },
      generated_at: new Date().toISOString(),
      sections: {
        revenue,
        expenses,
      },
      totals: {
        revenue: revenueTotal,
        expenses: expenseTotal,
        net_income: revenueTotal - expenseTotal,
        currency,
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
