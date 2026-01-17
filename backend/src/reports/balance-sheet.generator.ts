import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Account, AccountType } from '../accounts/account.entity';
import { JournalEntry } from '../journal/journal-entry.entity';
import { JournalLine } from '../journal/journal-line.entity';

interface BalanceSheetSection {
  name: string;
  type: string;
  items: Array<{
    path: string;
    name: string;
    amount: number;
    currency: string;
    depth: number;
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
    @InjectRepository(JournalLine)
    private journalLineRepository: Repository<JournalLine>,
  ) {}

  async generate(tenantId: string, asOfDate: Date, depth: number = 2, currency: string = 'USD'): Promise<BalanceSheet> {
    const accounts = await this.accountRepository.find({
      where: { tenant_id: tenantId, is_active: true },
    });

    const balances = await this.calculateBalances(tenantId, asOfDate);

    const sectionItems = (type: AccountType, depth: number) => {
      return accounts
        .filter((a) => a.type === type && a.depth <= depth)
        .map((account) => ({
          path: account.path,
          name: account.name,
          amount: balances.get(account.id) || 0,
          currency,
          depth: account.depth,
        }))
        .sort((a, b) => a.path.localeCompare(b.path));
    };

    const calculateTotal = (items: any[]) => {
      return items.reduce((sum, item) => sum + item.amount, 0);
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

  private async calculateBalances(tenantId: string, asOfDate: Date): Promise<Map<string, number>> {
    const lines = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.journal_entry', 'entry')
      .where('line.tenant_id = :tenantId', { tenantId })
      .andWhere('entry.date <= :asOfDate', { asOfDate })
      .select(['line.account_id', 'SUM(line.converted_amount) as total'])
      .groupBy('line.account_id')
      .getRawMany();

    const balances = new Map<string, number>();
    for (const line of lines) {
      balances.set(line.line_account_id, parseFloat(line.total) || 0);
    }
    return balances;
  }
}
