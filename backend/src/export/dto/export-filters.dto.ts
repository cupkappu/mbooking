import { IsOptional, IsDateString, IsArray, IsBoolean, IsEnum, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '../../accounts/account.entity';

export class ExportFiltersDto {
  @ApiPropertyOptional({ description: '起始日期 (ISO 8601格式)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: '结束日期 (ISO 8601格式)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({
    description: '日期预设：last_30_days(最近30天), last_90_days(最近90天), this_year(今年), all_time(全部时间)',
    example: 'last_30_days',
    enum: ['last_30_days', 'last_90_days', 'this_year', 'all_time'],
  })
  @IsOptional()
  @IsString()
  date_preset?: 'last_30_days' | 'last_90_days' | 'this_year' | 'all_time';

  @ApiPropertyOptional({
    description: '账户类型过滤：ASSETS(资产), LIABILITIES(负债), EQUITY(权益), REVENUE(收入), EXPENSE(支出)',
    example: [AccountType.ASSETS, AccountType.EXPENSE],
    enum: AccountType,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AccountType, { each: true })
  account_types?: AccountType[];

  @ApiPropertyOptional({ description: '是否包含停用账户', example: false })
  @IsOptional()
  @IsBoolean()
  include_inactive?: boolean;

  @ApiPropertyOptional({ description: '是否包含CSV表头', example: true })
  @IsOptional()
  @IsBoolean()
  include_header?: boolean;

  @ApiPropertyOptional({
    description: 'CSV分隔符：逗号(,), 分号(;), 制表符(\\t)',
    example: ',',
    enum: [',', ';', '\t'],
  })
  @IsOptional()
  @IsString()
  delimiter?: ',' | ';' | '\t';
}

export interface ExportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  datePreset?: string;
  accountTypes?: AccountType[];
  includeInactive?: boolean;
  includeHeader?: boolean;
  delimiter?: ',' | ';' | '\t';
}

export interface DateRange {
  dateFrom: Date;
  dateTo: Date;
}

export function parseDatePreset(preset: string): DateRange | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'last_30_days':
      return {
        dateFrom: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        dateTo: today,
      };
    case 'last_90_days':
      return {
        dateFrom: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
        dateTo: today,
      };
    case 'this_year':
      return {
        dateFrom: new Date(now.getFullYear(), 0, 1),
        dateTo: today,
      };
    case 'all_time':
    default:
      return null;
  }
}
