import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateCategory } from '../entities/budget-template.entity';
import { PeriodType } from '../entities/enums';

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  @Min(1)
  @Max(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template category', enum: TemplateCategory })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({ description: 'Account pattern for matching' })
  @IsOptional()
  @IsString()
  account_pattern?: string;

  @ApiPropertyOptional({ description: 'Account type to match' })
  @IsOptional()
  @IsString()
  account_type?: string;

  @ApiPropertyOptional({ description: 'Default period type', enum: PeriodType })
  @IsOptional()
  @IsEnum(PeriodType)
  default_period_type?: PeriodType;

  @ApiPropertyOptional({ description: 'Default budget amount' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  default_amount?: number;

  @ApiPropertyOptional({ description: 'Default currency' })
  @IsOptional()
  @IsString()
  default_currency?: string;

  @ApiPropertyOptional({ description: 'Default alert threshold (0-1)' })
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

  @ApiPropertyOptional({ description: 'Whether template is active' })
  @IsOptional()
  @IsOptional()
  is_active?: boolean;
}
