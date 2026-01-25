import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateCategory } from '../entities/budget-template.entity';
import { PeriodType } from '../entities/enums';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Monthly Groceries Budget' })
  @IsString()
  @IsNotEmpty()
  @Min(1)
  @Max(200)
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Template category', enum: TemplateCategory })
  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @ApiPropertyOptional({ description: 'Account pattern for matching (e.g., "Expense:Food:*")' })
  @IsOptional()
  @IsString()
  account_pattern?: string;

  @ApiPropertyOptional({ description: 'Account type to match' })
  @IsOptional()
  @IsString()
  account_type?: string;

  @ApiProperty({ description: 'Default period type', enum: PeriodType, example: PeriodType.MONTHLY })
  @IsEnum(PeriodType)
  default_period_type: PeriodType;

  @ApiProperty({ description: 'Default budget amount', example: 1000.00 })
  @IsNumber()
  @Min(0.01)
  default_amount: number;

  @ApiProperty({ description: 'Default currency', example: 'USD' })
  @IsString()
  @IsNotEmpty()
  default_currency: string;

  @ApiPropertyOptional({ description: 'Default alert threshold (0-1)', example: 0.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  default_alert_threshold?: number;

  @ApiPropertyOptional({ description: 'Suggested category IDs', type: [String] })
  @IsOptional()
  suggested_categories?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
