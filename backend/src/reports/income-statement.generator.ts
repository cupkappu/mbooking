import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from '../accounts/account.entity';
import { QueryService } from '../query/query.service';
import { TenantsService } from '../tenants/tenants.service';

interface IncomeStatementSection {
  name: string;
  items: Array<{
    path: string;
    name: string;
    amount: number;
    currency: string;
    converted_amount?: number;
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
    private queryService: QueryService,
    private tenantsService: TenantsService,
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

    // Get tenant's default currency
    let defaultCurrency = 'USD';
    try {
      const tenant = await this.tenantsService.findById(tenantId);
      defaultCurrency = tenant.settings?.default_currency || 'USD';
    } catch {}

    const revenueAccounts = accounts.filter((a) => a.type === AccountType.REVENUE);
    const expenseAccounts = accounts.filter((a) => a.type === AccountType.EXPENSE);

    // Get balances from QueryService using default currency
    const balancesResult = await this.queryService.getBalances({
      date_range: { from: fromDate.toISOString().split('T')[0], to: toDate.toISOString().split('T')[0] },
      include_subtree: true,
    });

    // Build maps: original amounts and converted totals (in default currency)
    const originalAmountMap = new Map<string, { amount: number; currency: string }>();
    const convertedAmountMap = new Map<string, number>();

    for (const balance of balancesResult.balances) {
      const originalAmount = balance.currencies.reduce((sum, c) => sum + c.amount, 0);
      const primaryCurrency = balance.currencies[0]?.currency || defaultCurrency;
      originalAmountMap.set(balance.account.id, { amount: originalAmount, currency: primaryCurrency });
      convertedAmountMap.set(balance.account.id, balance.converted_total || 0);
    }

    const revenueItems = revenueAccounts.map((account) => {
      const original = originalAmountMap.get(account.id) || { amount: 0, currency: defaultCurrency };
      return {
        path: account.path,
        name: account.name,
        amount: original.amount,
        currency: original.currency,
        converted_amount: convertedAmountMap.get(account.id),
      };
    });

    const expenseItems = expenseAccounts.map((account) => {
      const original = originalAmountMap.get(account.id) || { amount: 0, currency: defaultCurrency };
      return {
        path: account.path,
        name: account.name,
        amount: original.amount,
        currency: original.currency,
        converted_amount: convertedAmountMap.get(account.id),
      };
    });

    // Calculate totals using converted amounts (in default currency)
    const revenueTotal = revenueItems.reduce((sum, item) => sum + (item.converted_amount || 0), 0);
    const expenseTotal = expenseItems.reduce((sum, item) => sum + (item.converted_amount || 0), 0);

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
        currency: defaultCurrency,
      },
    };
   }
}
