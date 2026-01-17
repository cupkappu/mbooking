import { IsString, IsOptional, IsBoolean, IsNotEmpty, MaxLength, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProviderType } from '../provider.entity';

export class ProviderConfigDto {
  @ApiPropertyOptional({ description: 'API URL for REST API provider' })
  @IsOptional()
  @IsString()
  api_url?: string;

  @ApiPropertyOptional({ description: 'API key for authentication' })
  @IsOptional()
  @IsString()
  api_key?: string;

  @ApiPropertyOptional({ description: 'Request timeout in milliseconds' })
  @IsOptional()
  timeout?: number;

  @ApiPropertyOptional({ description: 'Rate refresh interval in seconds' })
  @IsOptional()
  refresh_interval?: number;
}

export class CreateProviderDto {
  @ApiProperty({ example: 'Exchange Rate API', description: 'Provider name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: ProviderType, example: ProviderType.REST_API, description: 'Provider type' })
  @IsEnum(ProviderType)
  provider_type: ProviderType;

  @ApiPropertyOptional({ type: ProviderConfigDto, description: 'Provider configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderConfigDto)
  config?: ProviderConfigDto;

  @ApiPropertyOptional({ example: true, description: 'Whether the provider is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateProviderDto {
  @ApiPropertyOptional({ example: 'Exchange Rate API', description: 'Provider name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ type: ProviderConfigDto, description: 'Provider configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderConfigDto)
  config?: ProviderConfigDto;

  @ApiPropertyOptional({ example: true, description: 'Whether the provider is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
