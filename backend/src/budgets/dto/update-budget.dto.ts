import { IsString, IsNumber, IsOptional, IsEnum, IsDate, IsBoolean, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetType, PeriodType, BudgetStatus } from '../entities/budget.entity';

export class UpdateBudgetDto {
  @ApiPropertyOptional({ description: 'Budget name', example: 'Monthly Food Budget' })
  @IsOptional()
  @IsString()
  @Min(1)
  @Max(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Budget description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Budget type', enum: BudgetType })
  @IsOptional()
  @IsEnum(BudgetType)
  type?: BudgetType;

  @ApiPropertyOptional({ description: 'Budget amount', example: 5000.00 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ description: 'Currency code (ISO 4217)', example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Budget period start date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @ApiPropertyOptional({ description: 'Budget period end date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @ApiPropertyOptional({ description: 'Period type for periodic budgets', enum: PeriodType })
  @IsOptional()
  @IsEnum(PeriodType)
  period_type?: PeriodType;

  @ApiPropertyOptional({ description: 'Associated account ID' })
  @IsOptional()
  @IsUUID()
  account_id?: string;

  @ApiPropertyOptional({ description: 'Alert threshold (0-1)', example: 0.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  alert_threshold?: number;

  @ApiPropertyOptional({ description: 'Budget status', enum: BudgetStatus })
  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @ApiPropertyOptional({ description: 'Whether budget is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
