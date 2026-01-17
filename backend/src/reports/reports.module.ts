import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/account.entity';
import { JournalLine } from '../journal/journal-line.entity';
import { JournalEntry } from '../journal/journal-entry.entity';
import { ReportStorage, ReportType } from './entities/report-storage.entity';
import { ReportsService } from './reports.service';
import { ReportCacheService } from './report-cache.service';
import { ReportsController } from './reports.controller';
import { BalanceSheetGenerator } from './balance-sheet.generator';
import { IncomeStatementGenerator } from './income-statement.generator';
import { IncomeStatementComparisonGenerator } from './income-statement-comparison.generator';
import { CashFlowStatementGenerator } from './cash-flow.generator';

@Module({
  imports: [TypeOrmModule.forFeature([Account, JournalLine, JournalEntry, ReportStorage])],
  controllers: [ReportsController],
  providers: [ReportsService, ReportCacheService, BalanceSheetGenerator, IncomeStatementGenerator, IncomeStatementComparisonGenerator, CashFlowStatementGenerator],
  exports: [ReportsService, ReportCacheService],
})
export class ReportsModule {}

export { ReportType, ReportStorage };
