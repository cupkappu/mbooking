import { IsString, IsOptional, IsBoolean, IsNotEmpty, MaxLength, MinLength, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCurrencyDto {
  @ApiProperty({ example: 'USD', description: '货币代码（ISO 4217标准）' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(10)
  code: string;

  @ApiProperty({ example: 'US Dollar', description: '货币名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '$', description: '货币符号' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  symbol: string;

  @ApiPropertyOptional({ example: 2, description: '小数位数（法币2位，加密货币8位）' })
  @IsOptional()
  @IsNumber()
  decimal_places?: number;

  @ApiPropertyOptional({ example: false, description: '是否设为默认货币' })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class UpdateCurrencyDto {
  @ApiPropertyOptional({ example: 'US Dollar', description: '货币名称' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '$', description: '货币符号' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  symbol?: string;

  @ApiPropertyOptional({ example: 2, description: '小数位数' })
  @IsOptional()
  @IsNumber()
  decimal_places?: number;

  @ApiPropertyOptional({ example: true, description: '是否激活该货币' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CurrencyResponseDto {
  @ApiProperty({ description: '货币代码', example: 'USD' })
  code: string;

  @ApiProperty({ description: '货币名称', example: 'US Dollar' })
  name: string;

  @ApiProperty({ description: '货币符号', example: '$' })
  symbol: string;

  @ApiProperty({ description: '小数位数', example: 2 })
  decimal_places: number;

  @ApiProperty({ description: '是否为默认货币', example: false })
  is_default: boolean;

  @ApiProperty({ description: '是否激活', example: true })
  is_active: boolean;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ description: '更新时间', example: '2024-01-15T10:00:00.000Z' })
  updated_at: Date;
}
