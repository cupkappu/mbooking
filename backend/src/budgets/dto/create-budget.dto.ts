import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsDate, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetType, PeriodType } from '../entities/budget.entity';

export class CreateBudgetDto {
  @ApiProperty({ description: 'Budget name', example: 'Monthly Food Budget' })
  @IsString()
  @IsNotEmpty()
  @Min(1)
  @Max(200)
  name: string;

  @ApiPropertyOptional({ description: 'Budget description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Budget type', enum: BudgetType, example: BudgetType.PERIODIC })
  @IsEnum(BudgetType)
  type: BudgetType;

  @ApiProperty({ description: 'Budget amount', example: 5000.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code (ISO 4217)', example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'Budget period start date', example: '2025-01-01' })
  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @ApiPropertyOptional({ description: 'Budget period end date', example: '2025-12-31' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @ApiPropertyOptional({ description: 'Period type for periodic budgets', enum: PeriodType, example: PeriodType.MONTHLY })
  @IsOptional()
  @IsEnum(PeriodType)
  period_type?: PeriodType;

  @ApiPropertyOptional({ description: 'Associated account ID' })
  @IsOptional()
  @IsUUID()
  account_id?: string;

  @ApiPropertyOptional({ description: 'Alert threshold (0-1, e.g., 0.8 for 80%)', example: 0.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  alert_threshold?: number;
}
