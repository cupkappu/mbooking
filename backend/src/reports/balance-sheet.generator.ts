import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from '../accounts/account.entity';
import { QueryService } from '../query/query.service';
import { TenantsService } from '../tenants/tenants.service';

interface BalanceSheetSection {
  name: string;
  type: string;
  items: Array<{
    path: string;
    name: string;
    amount: number;
    currency: string;
    depth: number;
    converted_amount?: number;
  }>;
  total: number;
}

export interface BalanceSheet {
  title: string;
  as_of_date: string;
  generated_at: string;
  sections: {
    assets: BalanceSheetSection;
    liabilities: BalanceSheetSection;
    equity: BalanceSheetSection;
  };
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
    currency: string;
  };
}

@Injectable()
export class BalanceSheetGenerator {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private queryService: QueryService,
    private tenantsService: TenantsService,
  ) {}

  async generate(tenantId: string, asOfDate: Date, depth: number = 2, currency: string = 'USD'): Promise<BalanceSheet> {
    const accounts = await this.accountRepository.find({
      where: { tenant_id: tenantId, is_active: true },
    });

    // Get tenant's default currency
    let defaultCurrency = 'USD';
    try {
      const tenant = await this.tenantsService.findById(tenantId);
      defaultCurrency = tenant.settings?.default_currency || 'USD';
    } catch {}

    // Get balances from QueryService using default currency
    const balancesResult = await this.queryService.getBalances({
      date_range: { from: '1970-01-01', to: asOfDate.toISOString().split('T')[0] },
      include_subtree: true,
    });

    // Build maps: original amounts and converted totals (in default currency)
    const originalAmountMap = new Map<string, { amount: number; currency: string }>();
    const convertedAmountMap = new Map<string, number>();

    for (const balance of balancesResult.balances) {
      // Get original amount (sum of all currencies)
      const originalAmount = balance.currencies.reduce((sum, c) => sum + c.amount, 0);
      const primaryCurrency = balance.currencies[0]?.currency || defaultCurrency;
      originalAmountMap.set(balance.account.id, { amount: originalAmount, currency: primaryCurrency });

      // Get converted total (already in default currency)
      convertedAmountMap.set(balance.account.id, balance.converted_total || 0);
    }

    const sectionItems = (type: AccountType, depth: number) => {
      return accounts
        .filter((a) => a.type === type && a.depth <= depth)
        .map((account) => {
          const original = originalAmountMap.get(account.id) || { amount: 0, currency: defaultCurrency };
          return {
            path: account.path,
            name: account.name,
            amount: original.amount,
            currency: original.currency,
            depth: account.depth,
            converted_amount: convertedAmountMap.get(account.id),
          };
        })
        .sort((a, b) => a.path.localeCompare(b.path));
    };

    // Calculate totals using converted amounts (in default currency)
    const calculateTotal = (items: any[]) => {
      return items.reduce((sum, item) => sum + (item.converted_amount || 0), 0);
    };

    const assetsItems = sectionItems(AccountType.ASSETS, depth);
    const liabilitiesItems = sectionItems(AccountType.LIABILITIES, depth);
    const equityItems = sectionItems(AccountType.EQUITY, depth);

    const assets: BalanceSheetSection = {
      name: 'Assets',
      type: 'assets',
      items: assetsItems,
      total: calculateTotal(assetsItems),
    };

    const liabilities: BalanceSheetSection = {
      name: 'Liabilities',
      type: 'liabilities',
      items: liabilitiesItems,
      total: calculateTotal(liabilitiesItems),
    };

    const equity: BalanceSheetSection = {
      name: 'Equity',
      type: 'equity',
      items: equityItems,
      total: calculateTotal(equityItems),
    };

    return {
      title: 'Balance Sheet',
      as_of_date: asOfDate.toISOString().split('T')[0],
      generated_at: new Date().toISOString(),
      sections: {
        assets,
        liabilities,
        equity,
      },
      totals: {
        assets: assets.total,
        liabilities: liabilities.total,
        equity: equity.total,
        currency,
      },
    };
  }
}
