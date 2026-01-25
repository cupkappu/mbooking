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
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrenciesService } from './currencies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/tenant.decorator';

@ApiTags('货币')
@Controller('currencies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CurrenciesController {
  constructor(private currenciesService: CurrenciesService) {}

  @Get()
  @ApiOperation({ summary: '获取所有已激活的货币列表' })
  @ApiQuery({ name: 'active_only', required: false, description: '是否只返回激活的货币，默认true', example: true })
  @ApiResponse({ status: 200, description: '成功返回货币列表' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async findAll() {
    return this.currenciesService.findAll();
  }

  @Get(':code')
  @ApiOperation({ summary: '根据货币代码获取货币信息' })
  @ApiParam({ name: 'code', description: '货币代码（ISO 4217）', example: 'USD' })
  @ApiResponse({ status: 200, description: '成功返回货币信息' })
  @ApiNotFoundResponse({ description: '货币不存在' })
  @ApiBadRequestResponse({ description: '货币代码格式无效' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async findOne(@Param('code') code: string) {
    return this.currenciesService.findByCode(code);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':code/default')
  @ApiOperation({ summary: '设置租户的默认货币' })
  @ApiParam({ name: 'code', description: '货币代码（ISO 4217）', example: 'USD' })
  @ApiResponse({ status: 200, description: '默认货币设置成功' })
  @ApiNotFoundResponse({ description: '货币不存在' })
  @ApiForbiddenResponse({ description: '需要管理员权限' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async setDefault(
    @Param('code') code: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
  ) {
    return this.currenciesService.setDefault(code, tenantId, userId);
  }
}
