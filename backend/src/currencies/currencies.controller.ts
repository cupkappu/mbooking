import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CurrenciesService } from './currencies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/tenant.decorator';

@ApiTags('currencies')
@Controller('currencies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CurrenciesController {
  constructor(private currenciesService: CurrenciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active currencies' })
  @ApiResponse({ status: 200, description: 'Returns all active currencies' })
  async findAll() {
    return this.currenciesService.findAll();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get currency by code' })
  @ApiResponse({ status: 200, description: 'Returns the currency' })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  async findOne(@Param('code') code: string) {
    return this.currenciesService.findByCode(code);
  }

  @Post(':code/set-default')
  @ApiOperation({ summary: 'Set default currency for tenant' })
  @ApiResponse({ status: 200, description: 'Currency set as default' })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  async setDefault(
    @Param('code') code: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
  ) {
    return this.currenciesService.setDefault(code, tenantId, userId);
  }
}
