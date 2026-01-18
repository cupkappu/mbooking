import { IsString, IsEnum, IsOptional, MaxLength, MinLength } from 'class-validator';
import { AccountType } from '../account.entity';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsEnum(AccountType, { message: 'type must be one of: assets, liabilities, equity, revenue, expense' })
  type: AccountType;

  @IsString()
  @IsOptional()
  parent_id?: string;

  @IsString()
  currency: string;
}

export class UpdateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @IsEnum(AccountType, { message: 'type must be one of: assets, liabilities, equity, revenue, expense' })
  @IsOptional()
  type?: AccountType;

  @IsString()
  @IsOptional()
  currency?: string;
}
