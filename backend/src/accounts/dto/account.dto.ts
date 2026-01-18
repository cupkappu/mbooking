import { IsString, IsOptional, IsEnum, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '../account.entity';

export class CreateAccountDto {
  @ApiProperty({ example: 'Checking Account', description: 'Account name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: AccountType, example: AccountType.ASSETS, description: 'Account type' })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({ example: 'uuid-string', description: 'Parent account ID' })
  @IsOptional()
  @IsString()
  parent_id?: string;

  @ApiProperty({ example: 'USD', description: 'Currency code (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(10)
  currency: string;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Checking Account', description: 'Account name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: AccountType, example: AccountType.ASSETS, description: 'Account type' })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional({ example: 'USD', description: 'Currency code' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: false, description: 'Whether the account is active' })
  @IsOptional()
  is_active?: boolean;
}
