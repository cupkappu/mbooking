import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from './budget.entity';
import { BudgetTemplate } from './entities/budget-template.entity';
import { BudgetAlert } from './entities/budget-alert.entity';
import { JournalLine } from '../journal/journal-line.entity';
import { Account } from '../accounts/account.entity';
import { BudgetsService } from './budgets.service';
import { BudgetAlertService } from './budget-alert.service';
import { BudgetTemplateService } from './budget-template.service';
import { BudgetsController } from './budgets.controller';
import { QueryModule } from '../query/query.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget, BudgetTemplate, BudgetAlert, JournalLine, Account]),
    QueryModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetAlertService, BudgetTemplateService],
  exports: [BudgetsService, BudgetAlertService, BudgetTemplateService],
})
export class BudgetsModule {}
