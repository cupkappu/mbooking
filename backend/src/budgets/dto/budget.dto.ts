import { IsString, IsOptional, IsNotEmpty, IsNumber, IsBoolean, IsDate, IsArray, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({ description: '预算名称', example: '2024年度办公用品预算' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '预算金额', example: '5000.00' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({ description: '货币代码（ISO 4217）', example: 'USD' })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['USD', 'CNY', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD'])
  currency: string;

  @ApiProperty({ description: '预算周期开始日期', example: '2024-01-01' })
  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @ApiProperty({ description: '预算周期结束日期', example: '2024-12-31' })
  @IsDate()
  @Type(() => Date)
  end_date: Date;

  @ApiPropertyOptional({ description: '关联的账户ID列表', type: [String], example: ['550e8400-e29b-41d4-a716-446655440000'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  account_ids?: string[];

  @ApiPropertyOptional({ description: '关联的类别ID列表', type: [String], example: ['660e8400-e29b-41d4-a716-446655441111'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category_ids?: string[];

  @ApiPropertyOptional({ description: '预算说明', example: '用于日常办公用品采购' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional({ description: '预算名称', example: '2024年度办公用品预算' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '预算金额', example: '5000.00' })
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional({ description: '是否激活', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: '预算周期开始日期', example: '2024-01-01' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @ApiPropertyOptional({ description: '预算周期结束日期', example: '2024-12-31' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @ApiPropertyOptional({ description: '关联的账户ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  account_ids?: string[];

  @ApiPropertyOptional({ description: '关联的类别ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category_ids?: string[];

  @ApiPropertyOptional({ description: '预算说明' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class BudgetResponseDto {
  @ApiProperty({ description: '预算ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: '租户ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  tenant_id: string;

  @ApiProperty({ description: '预算名称', example: '2024年度办公用品预算' })
  name: string;

  @ApiProperty({ description: '预算金额', example: '5000.00' })
  amount: string;

  @ApiProperty({ description: '货币代码', example: 'USD' })
  currency: string;

  @ApiProperty({ description: '预算周期开始日期', example: '2024-01-01' })
  start_date: Date;

  @ApiProperty({ description: '预算周期结束日期', example: '2024-12-31' })
  end_date: Date;

  @ApiProperty({ description: '已使用金额', example: '1500.00' })
  used_amount: string;

  @ApiProperty({ description: '剩余金额', example: '3500.00' })
  remaining_amount: string;

  @ApiProperty({ description: '使用百分比', example: 30 })
  usage_percentage: number;

  @ApiProperty({ description: '是否激活', example: true })
  is_active: boolean;

  @ApiProperty({ description: '关联的账户ID列表', type: [String] })
  account_ids: string[];

  @ApiProperty({ description: '关联的类别ID列表', type: [String] })
  category_ids: string[];

  @ApiProperty({ description: '预算说明' })
  description: string;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ description: '更新时间', example: '2024-01-15T10:00:00.000Z' })
  updated_at: Date;
}

export class BudgetProgressResponseDto {
  @ApiProperty({ description: '预算ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  budget_id: string;

  @ApiProperty({ description: '预算名称', example: '2024年度办公用品预算' })
  budget_name: string;

  @ApiProperty({ description: '预算金额', example: '5000.00' })
  total_budget: string;

  @ApiProperty({ description: '已使用金额', example: '1500.00' })
  used_amount: string;

  @ApiProperty({ description: '剩余金额', example: '3500.00' })
  remaining_amount: string;

  @ApiProperty({ description: '使用百分比', example: 30 })
  usage_percentage: number;

  @ApiProperty({ description: '预算周期开始日期', example: '2024-01-01' })
  start_date: Date;

  @ApiProperty({ description: '预算周期结束日期', example: '2024-12-31' })
  end_date: Date;

  @ApiProperty({ description: '剩余天数', example: 350 })
  remaining_days: number;

  @ApiProperty({ description: '日均支出', example: '15.00' })
  daily_average: string;

  @ApiProperty({ description: '预计剩余期间支出', example: '3500.00' })
  projected_remaining_spend: string;

  @ApiProperty({ description: '是否超出预算', example: false })
  is_over_budget: boolean;

  @ApiProperty({ description: '预算状态', example: '正常', enum: ['正常', '警告', '超额'] })
  status: '正常' | '警告' | '超额';
}

export class BudgetListQueryDto {
  @ApiPropertyOptional({ description: '分页偏移量', example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;

  @ApiPropertyOptional({ description: '每页数量', example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '是否只返回激活的预算', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean = true;
}
