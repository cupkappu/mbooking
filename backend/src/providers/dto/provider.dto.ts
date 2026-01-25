import { IsString, IsOptional, IsBoolean, IsNotEmpty, MaxLength, IsEnum, ValidateNested, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProviderType } from '../provider.entity';

export class ProviderConfigDto {
  @ApiPropertyOptional({ description: 'REST API提供商的接口地址' })
  @IsOptional()
  @IsString()
  api_url?: string;

  @ApiPropertyOptional({ description: 'API认证密钥' })
  @IsOptional()
  @IsString()
  api_key?: string;

  @ApiPropertyOptional({ description: '请求超时时间（毫秒）', example: 5000 })
  @IsOptional()
  @IsNumber()
  timeout?: number;

  @ApiPropertyOptional({ description: '汇率刷新间隔（秒）', example: 60 })
  @IsOptional()
  @IsNumber()
  refresh_interval?: number;
}

export class CreateProviderDto {
  @ApiProperty({ example: 'Exchange Rate API', description: '提供商名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: ProviderType, example: ProviderType.REST_API, description: '提供商类型' })
  @IsEnum(ProviderType)
  provider_type: ProviderType;

  @ApiPropertyOptional({ type: ProviderConfigDto, description: '提供商配置信息' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderConfigDto)
  config?: ProviderConfigDto;

  @ApiPropertyOptional({ example: true, description: '是否激活该提供商' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateProviderDto {
  @ApiPropertyOptional({ example: 'Exchange Rate API', description: '提供商名称' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ type: ProviderConfigDto, description: '提供商配置信息' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderConfigDto)
  config?: ProviderConfigDto;

  @ApiPropertyOptional({ example: true, description: '是否激活该提供商' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ProviderResponseDto {
  @ApiProperty({ description: '提供商ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: '提供商名称', example: 'Exchange Rate API' })
  name: string;

  @ApiProperty({ enum: ProviderType, description: '提供商类型' })
  provider_type: ProviderType;

  @ApiProperty({ type: ProviderConfigDto, description: '提供商配置信息' })
  config: ProviderConfigDto;

  @ApiProperty({ description: '是否激活', example: true })
  is_active: boolean;

  @ApiProperty({ description: '是否记录汇率历史', example: true })
  record_history: boolean;

  @ApiProperty({ description: '是否支持历史汇率查询', example: true })
  supports_historical: boolean;

  @ApiProperty({ description: '支持的货币代码列表', example: ['USD', 'CNY', 'EUR'] })
  supported_currencies: string[];

  @ApiProperty({ description: '创建时间' })
  created_at: Date;

  @ApiProperty({ description: '更新时间' })
  updated_at: Date;
}
