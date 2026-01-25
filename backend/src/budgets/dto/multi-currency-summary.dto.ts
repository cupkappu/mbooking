import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MultiCurrencySummaryDto {
  @ApiProperty({ description: 'Base currency for summary' })
  base_currency: string;

  @ApiProperty({ description: 'Total budget in base currency', example: 10000.00 })
  total_budget: number;

  @ApiProperty({ description: 'Total spent in base currency', example: 3500.00 })
  total_spent: number;

  @ApiProperty({ description: 'Total remaining in base currency', example: 6500.00 })
  total_remaining: number;

  @ApiProperty({ description: 'Overall utilization percentage', example: 35 })
  utilization_percentage: number;

  @ApiProperty({ description: 'Currency exposure risk level', enum: ['low', 'medium', 'high'] })
  exposure_risk: 'low' | 'medium' | 'high';

  @ApiProperty({ description: 'Breakdown by currency', type: 'array' })
  by_currency: Array<{
    currency: string;
    original_amount: number;
    converted_amount: number;
    exchange_rate: number;
    percentage_of_total: number;
  }>;
}

export class MultiCurrencySummaryQueryDto {
  @ApiPropertyOptional({ description: 'Base currency for conversion', example: 'USD' })
  @IsOptional()
  @IsString()
  base_currency?: string;

  @ApiPropertyOptional({ description: 'Include inactive budgets' })
  @IsOptional()
  @IsString()
  include_inactive?: string;
}
