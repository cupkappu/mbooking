import { Injectable } from '@nestjs/common';
import { BalanceSheetGenerator } from './balance-sheet.generator';
import { IncomeStatementGenerator } from './income-statement.generator';

@Injectable()
export class ReportsService {
  constructor(
    private balanceSheetGenerator: BalanceSheetGenerator,
    private incomeStatementGenerator: IncomeStatementGenerator,
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
}
