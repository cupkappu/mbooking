import { Injectable } from '@nestjs/common';
import { BalanceSheetGenerator } from './balance-sheet.generator';
import { IncomeStatementGenerator } from './income-statement.generator';
import { CashFlowStatementGenerator } from './cash-flow.generator';
import { IncomeStatementComparisonGenerator } from './income-statement-comparison.generator';

@Injectable()
export class ReportsService {
  constructor(
    private balanceSheetGenerator: BalanceSheetGenerator,
    private incomeStatementGenerator: IncomeStatementGenerator,
    private cashFlowGenerator: CashFlowStatementGenerator,
    private incomeStatementComparisonGenerator: IncomeStatementComparisonGenerator,
  ) {}

  async getBalanceSheet(
    tenantId: string,
    options: {
      asOfDate?: Date;
      depth?: number;
      currency?: string;
    } = {},
  ) {
    return this.balanceSheetGenerator.generate(
      tenantId,
      options.asOfDate || new Date(),
      options.depth || 2,
      options.currency || 'USD',
    );
  }

  async getIncomeStatement(
    tenantId: string,
    options: {
      fromDate?: Date;
      toDate?: Date;
      depth?: number;
      currency?: string;
    } = {},
  ) {
    const now = new Date();
    return this.incomeStatementGenerator.generate(
      tenantId,
      options.fromDate || new Date(now.getFullYear(), now.getMonth(), 1),
      options.toDate || now,
      options.depth || 2,
      options.currency || 'USD',
    );
  }

  async getIncomeStatementComparison(
    tenantId: string,
    options: {
      currentFromDate?: Date;
      currentToDate?: Date;
      priorFromDate?: Date;
      priorToDate?: Date;
      depth?: number;
      currency?: string;
    } = {},
  ) {
    const now = new Date();
    const currentStart = options.currentFromDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const currentEnd = options.currentToDate || now;
    
    const periodLength = currentEnd.getTime() - currentStart.getTime();
    const priorEnd = new Date(currentStart.getTime() - 1);
    const priorStart = new Date(priorEnd.getTime() - periodLength);

    return this.incomeStatementComparisonGenerator.generate(tenantId, {
      currentFromDate: currentStart,
      currentToDate: currentEnd,
      priorFromDate: options.priorFromDate || priorStart,
      priorToDate: options.priorToDate || priorEnd,
      depth: options.depth || 2,
      currency: options.currency || 'USD',
    });
  }

  async getCashFlowStatement(
    tenantId: string,
    options: {
      fromDate?: Date;
      toDate?: Date;
      depth?: number;
      currency?: string;
    } = {},
  ) {
    const now = new Date();
    return this.cashFlowGenerator.generate(
      tenantId,
      options.fromDate || new Date(now.getFullYear(), now.getMonth(), 1),
      options.toDate || now,
      options.depth || 2,
      options.currency || 'USD',
    );
  }
}
