import { IsOptional, IsNumber, IsEnum, IsDate, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AlertStatus, AlertType } from '../entities/budget-alert.entity';

export class AlertListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by alert status', enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional({ description: 'Filter by alert type', enum: AlertType })
  @IsOptional()
  @IsEnum(AlertType)
  alert_type?: AlertType;

  @ApiPropertyOptional({ description: 'Filter by budget ID' })
  @IsOptional()
  @IsString()
  budget_id?: string;

  @ApiPropertyOptional({ description: 'Minimum threshold percent', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  min_threshold?: number;

  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

export class AlertListItemDto {
  id: string;
  budget_id: string;
  budget_name: string;
  alert_type: AlertType;
  status: AlertStatus;
  threshold_percent: number;
  spent_amount: number;
  budget_amount: number;
  currency: string;
  message: string | null;
  created_at: Date;
  acknowledged_at: Date | null;
}

export class AlertListResponseDto {
  alerts: AlertListItemDto[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export class AcknowledgeAlertDto {
  @ApiPropertyOptional({ description: 'Notes when acknowledging' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DismissAlertDto {
  @ApiPropertyOptional({ description: 'Reason for dismissing' })
  @IsOptional()
  @IsString()
  reason?: string;
}
