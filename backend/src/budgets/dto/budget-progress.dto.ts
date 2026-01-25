import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BudgetProgressDto {
  @ApiProperty({ description: 'Budget ID' })
  budget_id: string;

  @ApiProperty({ description: 'Budget name' })
  name: string;

  @ApiProperty({ description: 'Original budget amount', example: 5000.00 })
  budget_amount: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Spent amount', example: 1500.00 })
  spent_amount: number;

  @ApiProperty({ description: 'Remaining amount', example: 3500.00 })
  remaining_amount: number;

  @ApiProperty({ description: 'Percentage used (0-100)', example: 30 })
  percentage_used: number;

  @ApiPropertyOptional({ description: 'Days remaining in budget period', example: 15 })
  @IsOptional()
  @IsNumber()
  days_remaining?: number;

  @ApiPropertyOptional({ description: 'Projected end balance', example: 2000.00 })
  @IsOptional()
  @IsNumber()
  projected_end_balance?: number;

  @ApiProperty({ description: 'Spending velocity (per day)', example: 50.00 })
  @IsOptional()
  @IsNumber()
  daily_spending_rate?: number;

  @ApiProperty({ description: 'Progress status', enum: ['normal', 'warning', 'exceeded'], example: 'normal' })
  status: 'normal' | 'warning' | 'exceeded';

  @ApiProperty({ description: 'Period start date' })
  period_start: Date;

  @ApiProperty({ description: 'Period end date' })
  period_end: Date;
}

export class ProgressQueryDto {
  @ApiPropertyOptional({ description: 'Include currency conversion' })
  @IsOptional()
  @IsString()
  target_currency?: string;
}
