import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateTenantSettingsDto } from './dto/tenant-settings.dto';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('current')
  @ApiOperation({ summary: '获取当前租户', description: '获取当前用户所属的租户信息' })
  @ApiResponse({
    status: 200,
    description: '成功获取当前租户信息',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'tenant-123' },
        name: { type: 'string', example: '示例公司' },
        settings: { type: 'object', description: '租户配置' },
      },
    },
  })
  async getCurrent(@Request() req) {
    return this.tenantsService.findByUserId(req.user.userId);
  }

  @Put('settings')
  @ApiOperation({ summary: '更新租户设置', description: '更新当前租户的配置设置' })
  @ApiResponse({ status: 200, description: '租户设置更新成功' })
  async updateSettings(@Request() req, @Body() updateSettingsDto: UpdateTenantSettingsDto) {
    const tenant = await this.tenantsService.findByUserId(req.user.userId);
    return this.tenantsService.update(tenant.id, { settings: updateSettingsDto });
  }
}
