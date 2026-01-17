import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from '../accounts/account.entity';
import { JournalLine } from '../journal/journal-line.entity';
import { JournalEntry } from '../journal/journal-entry.entity';

interface CashFlowSection {
  name: string;
  items: { name: string; amount: number }[];
  total: number;
}

export interface CashFlowStatement {
  title: string;
  period: { from: string; to: string };
  generated_at: string;
  sections: {
    operating: CashFlowSection;
    investing: CashFlowSection;
    financing: CashFlowSection;
  };
  totals: {
    operating: number;
    investing: number;
    financing: number;
    net_change: number;
    beginning_cash: number;
    ending_cash: number;
    currency: string;
  };
}

@Injectable()
export class CashFlowStatementGenerator {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(JournalLine)
    private journalLineRepository: Repository<JournalLine>,
    @InjectRepository(JournalEntry)
    private journalEntryRepository: Repository<JournalEntry>,
  ) {}

  async generate(
    tenantId: string,
    fromDate: Date,
    toDate: Date,
    depth: number = 2,
    currency: string = 'USD',
  ): Promise<CashFlowStatement> {
    // Get all accounts with their balances
    const accounts = await this.accountRepository.find({
      where: { tenant_id: tenantId },
    });

    // Get journal lines for the period with their journal entries
    const journalLines = await this.journalLineRepository
      .createQueryBuilder('jl')
      .innerJoinAndSelect('jl.journal_entry', 'je')
      .where('je.tenant_id = :tenantId', { tenantId })
      .andWhere('je.date >= :fromDate', { fromDate })
      .andWhere('je.date <= :toDate', { toDate })
      .getMany();

    // Calculate operating activities (revenue and expense accounts)
    const revenueAccounts = accounts.filter(a => a.type === AccountType.REVENUE);
    const expenseAccounts = accounts.filter(a => a.type === AccountType.EXPENSE);
    const cashAccounts = accounts.filter(a => 
      a.type === AccountType.ASSETS && 
      a.name.toLowerCase().includes('cash')
    );
    const receivableAccounts = accounts.filter(a => 
      a.type === AccountType.ASSETS && 
      a.name.toLowerCase().includes('receivable')
    );
    const payableAccounts = accounts.filter(a => 
      a.type === AccountType.LIABILITIES && 
      a.name.toLowerCase().includes('payable')
    );
    const fixedAssetAccounts = accounts.filter(a => 
      a.type === AccountType.ASSETS && 
      !cashAccounts.some(c => c.id === a.id) &&
      !receivableAccounts.some(c => c.id === a.id)
    );
    const equityAccounts = accounts.filter(a => a.type === AccountType.EQUITY);
    const loanAccounts = accounts.filter(a => 
      a.type === AccountType.LIABILITIES && 
      a.name.toLowerCase().includes('loan')
    );

    // Net Income calculation
    let totalRevenue = 0;
    let totalExpenses = 0;
    const revenueItems: { name: string; amount: number }[] = [];
    const expenseItems: { name: string; amount: number }[] = [];

    // Working capital changes
    let changesInReceivables = 0;
    let changesInPayables = 0;

    // Investing activities
    let assetPurchases = 0;
    let assetSales = 0;

    // Financing activities
    let equityChanges = 0;
    let loanChanges = 0;

    for (const line of journalLines) {
      const account = accounts.find(a => a.id === line.account_id);
      if (!account) continue;

      // Determine if this line is a debit or credit based on journal entry line position
      // This is a simplification - in real double-entry, the position matters
      const isCredit = line.amount < 0;
      const absAmount = Math.abs(line.amount);

      if (revenueAccounts.some(a => a.id === account.id)) {
        // Revenue increases with credits (typically)
        totalRevenue += absAmount;
        revenueItems.push({ name: account.name, amount: absAmount });
      } else if (expenseAccounts.some(a => a.id === account.id)) {
        // Expenses increase with debits (typically)
        totalExpenses += absAmount;
        expenseItems.push({ name: account.name, amount: -absAmount });
      } else if (receivableAccounts.some(a => a.id === account.id)) {
        // Changes in receivables affect working capital
        changesInReceivables += isCredit ? absAmount : -absAmount;
      } else if (payableAccounts.some(a => a.id === account.id)) {
        // Changes in payables affect working capital
        changesInPayables += isCredit ? absAmount : -absAmount;
      } else if (fixedAssetAccounts.some(a => a.id === account.id)) {
        // Fixed asset changes are investing activities
        if (isCredit) {
          assetSales += absAmount;
        } else {
          assetPurchases += absAmount;
        }
      } else if (equityAccounts.some(a => a.id === account.id)) {
        // Equity changes are financing activities
        equityChanges += isCredit ? absAmount : -absAmount;
      } else if (loanAccounts.some(a => a.id === account.id)) {
        // Loan changes are financing activities
        loanChanges += isCredit ? absAmount : -absAmount;
      }
    }

    const netIncome = totalRevenue - totalExpenses;
    const changesInWorkingCapital = changesInReceivables + changesInPayables;
    const operatingTotal = netIncome + changesInWorkingCapital;

    const investingTotal = assetSales - assetPurchases;
    const financingTotal = equityChanges + loanChanges;

    const netChange = operatingTotal + investingTotal + financingTotal;

    // Get beginning cash balance
    const beginningCashLines = await this.journalLineRepository
      .createQueryBuilder('jl')
      .innerJoin('jl.journal_entry', 'je')
      .where('je.tenant_id = :tenantId', { tenantId })
      .andWhere('je.date < :fromDate', { fromDate })
      .getMany();

    let beginningCash = 0;
    for (const line of beginningCashLines) {
      const account = accounts.find(a => a.id === line.account_id);
      if (account && cashAccounts.some(a => a.id === account.id)) {
        const isCredit = line.amount < 0;
        beginningCash += isCredit ? Math.abs(line.amount) : -Math.abs(line.amount);
      }
    }

    const endingCash = beginningCash + netChange;

    return {
      title: 'Cash Flow Statement',
      period: {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
      },
      generated_at: new Date().toISOString(),
      sections: {
        operating: {
          name: 'Operating Activities',
          items: [
            { name: 'Net Income', amount: netIncome },
            ...revenueItems.map(i => ({ ...i, amount: -i.amount })), // Convert to cash flow format
            ...expenseItems,
            ...(changesInReceivables !== 0 ? [{ name: 'Changes in Receivables', amount: -changesInReceivables }] : []),
            ...(changesInPayables !== 0 ? [{ name: 'Changes in Payables', amount: changesInPayables }] : []),
          ],
          total: operatingTotal,
        },
        investing: {
          name: 'Investing Activities',
          items: [
            ...(assetSales > 0 ? [{ name: 'Sale of Assets', amount: assetSales }] : []),
            ...(assetPurchases > 0 ? [{ name: 'Purchase of Assets', amount: -assetPurchases }] : []),
          ],
          total: investingTotal,
        },
        financing: {
          name: 'Financing Activities',
          items: [
            ...(equityChanges !== 0 ? [{ name: 'Equity Changes', amount: equityChanges }] : []),
            ...(loanChanges !== 0 ? [{ name: 'Loan Changes', amount: loanChanges }] : []),
          ],
          total: financingTotal,
        },
      },
      totals: {
        operating: operatingTotal,
        investing: investingTotal,
        financing: financingTotal,
        net_change: netChange,
        beginning_cash: beginningCash,
        ending_cash: endingCash,
        currency,
      },
    };
  }
}
