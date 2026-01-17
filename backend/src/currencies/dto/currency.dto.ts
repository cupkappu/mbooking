import { IsString, IsOptional, IsBoolean, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCurrencyDto {
  @ApiProperty({ example: 'USD', description: 'Currency code (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(10)
  code: string;

  @ApiProperty({ example: 'US Dollar', description: 'Currency name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '$', description: 'Currency symbol' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  symbol: string;

  @ApiPropertyOptional({ example: 2, description: 'Decimal places (2 for fiat, 0 or 8 for crypto)' })
  @IsOptional()
  @IsBoolean()
  decimal_places?: number;

  @ApiPropertyOptional({ example: false, description: 'Whether this is the default currency' })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class UpdateCurrencyDto {
  @ApiPropertyOptional({ example: 'US Dollar', description: 'Currency name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '$', description: 'Currency symbol' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  symbol?: string;

  @ApiPropertyOptional({ example: 2, description: 'Decimal places' })
  @IsOptional()
  decimal_places?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the currency is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
