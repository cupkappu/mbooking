import { IsString, IsOptional, IsEnum, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '../account.entity';

export class CreateAccountDto {
  @ApiProperty({ example: 'Checking Account', description: '账户名称' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: AccountType, example: AccountType.ASSETS, description: '账户类型' })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: '父账户ID（用于创建子账户）' })
  @IsOptional()
  @IsString()
  parent_id?: string;

  @ApiProperty({ example: 'USD', description: '货币代码（ISO 4217）' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(10)
  currency: string;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Checking Account', description: '账户名称' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: AccountType, example: AccountType.ASSETS, description: '账户类型' })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional({ example: 'USD', description: '货币代码' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: false, description: '是否激活账户' })
  @IsOptional()
  is_active?: boolean;
}
