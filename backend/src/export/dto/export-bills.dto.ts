import { IsOptional, IsString, IsArray, IsEnum, IsBoolean, IsIn, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '../../accounts/account.entity';

export enum DatePreset {
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  THIS_YEAR = 'this_year',
  ALL_TIME = 'all_time',
}

export class ExportBillsDto {
  @ApiPropertyOptional({ description: '开始日期（YYYY-MM-DD格式）', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiPropertyOptional({ description: '结束日期（YYYY-MM-DD格式）', example: '2024-01-31' })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiPropertyOptional({ enum: DatePreset, description: '日期预设快捷选项', example: DatePreset.LAST_30_DAYS })
  @IsOptional()
  @IsEnum(DatePreset)
  date_preset?: DatePreset;

  @ApiPropertyOptional({ enum: AccountType, isArray: true, description: '筛选的账户类型列表' })
  @IsOptional()
  @IsArray()
  @IsEnum(AccountType, { each: true })
  account_types?: AccountType[];

  @ApiPropertyOptional({ description: '是否在CSV中包含表头行', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  include_header?: boolean;

  @ApiPropertyOptional({ description: 'CSV分隔符（逗号、分号或制表符）', example: ',', enum: [',', ';', '\t'] })
  @IsOptional()
  @IsIn([',', ';', '\t'])
  delimiter?: ',' | ';' | '\t';

  @ValidateIf((o) => !o.date_preset)
  @IsOptional()
  date_from_validated?: Date;

  @ValidateIf((o) => !o.date_preset)
  @IsOptional()
  date_to_validated?: Date;
}
