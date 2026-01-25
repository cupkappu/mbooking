import { IsOptional, IsNumber, IsDate, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VarianceReportDto {
  @ApiProperty({ description: 'Budget ID' })
  budget_id: string;

  @ApiProperty({ description: 'Budget name' })
  budget_name: string;

  @ApiProperty({ description: 'Report period start' })
  period_start: Date;

  @ApiProperty({ description: 'Report period end' })
  period_end: Date;

  @ApiProperty({ description: 'Original budgeted amount' })
  original_budget: number;

  @ApiPropertyOptional({ description: 'Revised budgeted amount (if changed)' })
  @IsOptional()
  revised_budget?: number;

  @ApiProperty({ description: 'Actual spending in period' })
  actual_spending: number;

  @ApiProperty({ description: 'Budget variance (budget - actual)', example: 500 })
  budget_variance: number;

  @ApiProperty({ description: 'Variance percentage', example: 10 })
  budget_variance_percentage: number;

  @ApiProperty({ description: 'Favorable variance (under budget)', example: 500 })
  favorable_variance: number;

  @ApiProperty({ description: 'Unfavorable variance (over budget)', example: 0 })
  unfavorable_variance: number;

  @ApiProperty({ description: 'Spending velocity (per day)', example: 50.00 })
  spending_velocity: number;

  @ApiPropertyOptional({ description: 'Projected end balance' })
  @IsOptional()
  projected_end_balance?: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Daily trend data' })
  @IsOptional()
  daily_trends?: Array<{
    date: string;
    budget: number;
    actual: number;
    variance: number;
  }>;
}

export class VarianceQueryDto {
  @ApiPropertyOptional({ description: 'Custom report start date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @ApiPropertyOptional({ description: 'Custom report end date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @ApiPropertyOptional({ description: 'Granularity', enum: ['daily', 'weekly', 'monthly'] })
  @IsOptional()
  @IsString()
  granularity?: 'daily' | 'weekly' | 'monthly';
}
