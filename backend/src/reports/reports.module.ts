import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/account.entity';
import { JournalLine } from '../journal/journal-line.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { BalanceSheetGenerator } from './balance-sheet.generator';
import { IncomeStatementGenerator } from './income-statement.generator';

@Module({
  imports: [TypeOrmModule.forFeature([Account, JournalLine])],
  controllers: [ReportsController],
  providers: [ReportsService, BalanceSheetGenerator, IncomeStatementGenerator],
  exports: [ReportsService],
})
export class ReportsModule {}
