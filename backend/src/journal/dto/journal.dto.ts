import { IsString, IsOptional, IsNotEmpty, IsDate, IsArray, ValidateNested, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '../../accounts/account.entity';

export class JournalLineDto {
  @ApiProperty({ description: '账户ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  account_id: string;

  @ApiPropertyOptional({ description: '借方金额', example: '100.00', default: '0' })
  @IsOptional()
  @IsString()
  debit?: string = '0';

  @ApiPropertyOptional({ description: '贷方金额', example: '0', default: '0' })
  @IsOptional()
  @IsString()
  credit?: string = '0';

  @ApiProperty({ description: '货币代码（ISO 4217）', example: 'USD' })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['USD', 'CNY', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD'])
  currency: string;

  @ApiPropertyOptional({ description: '分录描述', example: '购买办公设备' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ description: '日记账日期', example: '2024-01-15' })
  @IsDate()
  date: Date;

  @ApiProperty({ description: '日记账描述', example: '购买办公设备' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: '参考编号', example: 'PO-2024-001' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ description: '分录行列表（至少两条，借贷必须相等）', type: [JournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}

export class UpdateJournalEntryDto {
  @ApiPropertyOptional({ description: '日记账日期', example: '2024-01-15' })
  @IsOptional()
  @IsDate()
  date?: Date;

  @ApiPropertyOptional({ description: '日记账描述', example: '购买办公设备' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '参考编号', example: 'PO-2024-001' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: '分录行列表', type: [JournalLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines?: JournalLineDto[];
}

export class JournalEntryResponseDto {
  @ApiProperty({ description: '日记账条目ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: '租户ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  tenant_id: string;

  @ApiProperty({ description: '日记账日期', example: '2024-01-15' })
  date: Date;

  @ApiProperty({ description: '日记账描述', example: '购买办公设备' })
  description: string;

  @ApiProperty({ description: '参考编号', example: 'PO-2024-001' })
  reference: string;

  @ApiProperty({ description: '分录行列表', type: [JournalLineDto] })
  lines: JournalLineDto[];

  @ApiProperty({ description: '创建时间', example: '2024-01-15T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ description: '更新时间', example: '2024-01-15T10:00:00.000Z' })
  updated_at: Date;
}

export class JournalEntryListQueryDto {
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
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '开始日期', example: '2024-01-01' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date_from?: Date;

  @ApiPropertyOptional({ description: '结束日期', example: '2024-01-31' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date_to?: Date;

  @ApiPropertyOptional({ description: '账户ID过滤', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  account_id?: string;
}
