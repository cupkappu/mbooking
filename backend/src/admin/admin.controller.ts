import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import {
  AdminService,
  PaginationParams,
  LogQueryParams,
  BulkUserAction,
  SystemConfig,
} from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCurrencyDto, UpdateCurrencyDto } from '../currencies/dto/currency.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiBody, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiNoContentResponse } from '@nestjs/swagger';

import { Request } from 'express';
import { ProviderType } from '../rates/provider.entity';

type RequestWithIp = Request & { ip?: string; headers?: { [key: string]: string } };

@ApiTags('管理员')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // =========================================================================
  // 用户管理 (User Management)
  // =========================================================================

  @Get('users')
  @ApiOperation({ summary: '获取用户列表', description: '分页获取所有用户，支持按分页参数过滤' })
  @ApiQuery({ name: 'offset', required: false, description: '分页偏移量，默认0', example: 0 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认20', example: 20 })
  @ApiResponse({ status: 200, description: '成功获取用户列表' })
  @ApiBadRequestResponse({ description: '参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  @ApiForbiddenResponse({ description: '需要管理员权限' })
  async listUsers(
    @Req() req: RequestWithIp,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    // JWT strategy returns tenantId/userId (camelCase), not tenant_id/id (snake_case)
    const tenantId = (req as any).user?.tenantId || 'system';
    // 确保参数是数字类型
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const result = await this.adminService.listUsers(tenantId, { offset: parsedOffset, limit: parsedLimit });
    return { success: true, data: result };
  }

  @Get('users/:id')
  @ApiOperation({ summary: '获取用户详情', description: '根据用户ID获取单个用户的详细信息' })
  @ApiParam({ name: 'id', description: '用户ID (UUID格式)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '成功获取用户信息' })
  @ApiNotFoundResponse({ description: '用户不存在' })
  async getUser(@Param('id') id: string) {
    const user = await this.adminService.getUser(id);
    return { success: true, data: user };
  }

  @Post('users')
  @ApiOperation({ summary: '创建用户', description: '创建新用户，需要提供邮箱、姓名、密码和角色' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com', description: '用户邮箱' },
        name: { type: 'string', example: '张三', description: '用户姓名' },
        password: { type: 'string', example: 'SecurePass123', description: '用户密码' },
        role: { type: 'string', example: 'user', description: '用户角色' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  @ApiBadRequestResponse({ description: '参数验证失败或邮箱已存在' })
  async createUser(
    @Req() req: RequestWithIp,
    @Body() body: { email: string; name: string; password: string; role: string },
  ) {
    // JWT strategy returns tenantId/userId (camelCase), not tenant_id/id (snake_case)
    const tenantId = (req as any).user?.tenantId || 'system';
    const adminId = (req as any).user?.userId || (req as any).user?.sub;
    const user = await this.adminService.createUser(
      tenantId,
      body,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: user };
  }

  @Put('users/:id')
  @ApiOperation({ summary: '更新用户', description: '更新指定用户的邮箱、姓名、角色或激活状态' })
  @ApiParam({ name: 'id', description: '用户ID (UUID格式)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'newemail@example.com', description: '用户邮箱' },
        name: { type: 'string', example: '李四', description: '用户姓名' },
        role: { type: 'string', example: 'admin', description: '用户角色' },
        is_active: { type: 'boolean', example: true, description: '是否激活' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '用户更新成功' })
  @ApiNotFoundResponse({ description: '用户不存在' })
  async updateUser(
    @Req() req: RequestWithIp,
    @Param('id') id: string,
    @Body() body: { email?: string; name?: string; role?: string; is_active?: boolean },
  ) {
    const adminId = (req as any).user?.userId;
    const user = await this.adminService.updateUser(
      id,
      body,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: user };
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '禁用用户', description: '禁用指定用户，使其无法登录系统' })
  @ApiParam({ name: 'id', description: '用户ID (UUID格式)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiNoContentResponse({ description: '用户禁用成功' })
  @ApiNotFoundResponse({ description: '用户不存在' })
  async disableUser(
    @Req() req: RequestWithIp,
    @Param('id') id: string,
  ) {
    const adminId = (req as any).user?.userId;
    await this.adminService.disableUser(
      id,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: '重置用户密码', description: '管理员重置指定用户的密码' })
  @ApiParam({ name: 'id', description: '用户ID (UUID格式)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        new_password: { type: 'string', example: 'NewSecurePass456', description: '新密码' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  @ApiNotFoundResponse({ description: '用户不存在' })
  async resetPassword(
    @Req() req: RequestWithIp,
    @Param('id') id: string,
    @Body() body: { new_password: string },
  ) {
    const adminId = (req as any).user?.userId;
    await this.adminService.resetPassword(
      id,
      body.new_password,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, message: 'Password reset successfully' };
  }

  @Post('users/bulk-action')
  @ApiOperation({ summary: '批量操作用户', description: '批量启用、禁用或删除多个用户' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_ids: { type: 'array', items: { type: 'string' }, example: ['id1', 'id2'], description: '用户ID列表' },
        action: { type: 'string', enum: ['enable', 'disable', 'delete'], example: 'disable', description: '操作类型' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '批量操作成功' })
  @ApiBadRequestResponse({ description: '参数验证失败' })
  async bulkUserAction(
    @Req() req: RequestWithIp,
    @Body() body: BulkUserAction,
  ) {
    const tenantId = (req as any).user?.tenant_id || 'system';
    const adminId = (req as any).user?.userId;
    const result = await this.adminService.bulkUserAction(
      tenantId,
      body,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: result };
  }

  // =========================================================================
  // 系统设置 (System Settings)
  // =========================================================================

  @Get('system/config')
  @ApiOperation({ summary: '获取系统配置', description: '获取当前系统配置信息' })
  @ApiResponse({ status: 200, description: '成功获取系统配置' })
  async getSystemConfig() {
    const config = await this.adminService.getSystemConfig();
    return { success: true, data: config };
  }

  @Put('system/config')
  @ApiOperation({ summary: '更新系统配置', description: '更新系统配置项' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', example: 'max_users', description: '配置键' },
        value: { type: 'string', example: '100', description: '配置值' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '系统配置更新成功' })
  async updateSystemConfig(
    @Req() req: RequestWithIp,
    @Body() body: Partial<SystemConfig>,
  ) {
    const adminId = (req as any).user?.userId;
    const config = await this.adminService.updateSystemConfig(
      body,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: config };
  }

  // =========================================================================
  // 提供商管理 (Provider Management)
  // =========================================================================

  @Get('providers')
  @ApiOperation({ summary: '获取提供商列表', description: '分页获取所有汇率提供商' })
  @ApiQuery({ name: 'offset', required: false, description: '分页偏移量', example: 0 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 50 })
  @ApiResponse({ status: 200, description: '成功获取提供商列表' })
  async listProviders(
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.adminService.listProviders({
      offset: offset ? parseInt(offset, 10) : 0,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return { success: true, data: result };
  }

  @Get('providers/:id')
  @ApiOperation({ summary: '获取提供商详情', description: '根据ID获取单个汇率提供商的详细信息' })
  @ApiParam({ name: 'id', description: '提供商ID (UUID格式)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '成功获取提供商信息' })
  @ApiNotFoundResponse({ description: '提供商不存在' })
  async getProvider(@Param('id') id: string) {
    const provider = await this.adminService.getProvider(id);
    return { success: true, data: provider };
  }

  @Post('providers')
  @ApiOperation({ summary: '创建提供商', description: '创建新的汇率提供商，支持REST API和JS插件类型' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Exchange Rate API', description: '提供商名称' },
        type: { type: 'string', enum: ['REST_API', 'JS_PLUGIN'], example: 'REST_API', description: '提供商类型' },
        config: { type: 'object', description: '提供商配置' },
        is_active: { type: 'boolean', example: true, description: '是否激活' },
        record_history: { type: 'boolean', example: true, description: '是否记录汇率历史' },
        supports_historical: { type: 'boolean', example: true, description: '是否支持历史汇率' },
        supported_currencies: { type: 'array', items: { type: 'string' }, example: ['USD', 'CNY', 'EUR'], description: '支持的货币列表' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '提供商创建成功' })
  async createProvider(
    @Req() req: RequestWithIp,
    @Body() body: {
      name: string;
      type: ProviderType;
      config: any;
      is_active?: boolean;
      record_history?: boolean;
      supports_historical?: boolean;
      supported_currencies?: string[];
    },
  ) {
    const adminId = (req as any).user?.userId;
    const provider = await this.adminService.createProvider(
      body,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: provider };
  }

  @Put('providers/:id')
  @ApiOperation({ summary: '更新提供商', description: '更新指定提供商的信息和配置' })
  @ApiParam({ name: 'id', description: '提供商ID (UUID格式)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '提供商更新成功' })
  @ApiNotFoundResponse({ description: '提供商不存在' })
  async updateProvider(
    @Req() req: RequestWithIp,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const adminId = (req as any).user?.userId;
    const provider = await this.adminService.updateProvider(
      id,
      body,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: provider };
  }

  @Delete('providers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除提供商', description: '删除指定的汇率提供商' })
  @ApiParam({ name: 'id', description: '提供商ID (UUID格式)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiNoContentResponse({ description: '提供商删除成功' })
  @ApiNotFoundResponse({ description: '提供商不存在' })
  async deleteProvider(
    @Req() req: RequestWithIp,
    @Param('id') id: string,
  ) {
    const adminId = (req as any).user?.userId;
    await this.adminService.deleteProvider(
      id,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
  }

  @Post('providers/:id/toggle')
  @ApiOperation({ summary: '切换提供商状态', description: '启用或禁用指定的汇率提供商' })
  @ApiParam({ name: 'id', description: '提供商ID (UUID格式)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '提供商状态切换成功' })
  @ApiNotFoundResponse({ description: '提供商不存在' })
  async toggleProvider(
    @Req() req: RequestWithIp,
    @Param('id') id: string,
  ) {
    const adminId = (req as any).user?.userId;
    const provider = await this.adminService.toggleProvider(
      id,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: provider };
  }

  @Post('providers/:id/test')
  @ApiOperation({ summary: '测试提供商连接', description: '测试指定汇率提供商的连接是否正常' })
  @ApiParam({ name: 'id', description: '提供商ID (UUID格式)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: '测试结果',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true, description: '是否连接成功' },
        latency: { type: 'number', example: 150, description: '响应延迟(毫秒)' },
        message: { type: 'string', example: 'Connection successful', description: '测试消息' },
      },
    },
  })
  @ApiNotFoundResponse({ description: '提供商不存在' })
  async testProvider(
    @Req() req: RequestWithIp,
    @Param('id') id: string,
  ) {
    const adminId = (req as any).user?.userId;
    const result = await this.adminService.testProvider(
      id,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: result.success, data: result };
  }

  // =========================================================================
  // 货币管理 (Currency Management)
  // =========================================================================

  @Get('currencies')
  @ApiOperation({ summary: '获取货币列表', description: '获取所有已配置的货币' })
  @ApiResponse({ status: 200, description: '成功获取货币列表' })
  async listCurrencies() {
    const currencies = await this.adminService.getAllCurrencies();
    return { success: true, data: currencies };
  }

  @Post('currencies')
  @ApiOperation({ summary: '创建货币', description: '创建新的货币配置' })
  @ApiBody({ type: CreateCurrencyDto })
  @ApiResponse({ status: 201, description: '货币创建成功' })
  @ApiBadRequestResponse({ description: '参数验证失败或货币代码已存在' })
  async createCurrency(
    @Req() req: RequestWithIp,
    @Body() body: CreateCurrencyDto,
  ) {
    const adminId = (req as any).user?.userId;
    const currency = await this.adminService.createCurrency(
      body,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: currency };
  }

  @Put('currencies/:code')
  @ApiOperation({ summary: '更新货币', description: '更新指定货币的配置信息' })
  @ApiParam({ name: 'code', description: '货币代码 (ISO 4217)', example: 'USD' })
  @ApiBody({ type: UpdateCurrencyDto })
  @ApiResponse({ status: 200, description: '货币更新成功' })
  @ApiNotFoundResponse({ description: '货币不存在' })
  async updateCurrency(
    @Req() req: RequestWithIp,
    @Param('code') code: string,
    @Body() body: UpdateCurrencyDto,
  ) {
    const adminId = (req as any).user?.userId;
    if (!adminId) {
      throw new Error('User ID not found in request');
    }
    const currency = await this.adminService.updateCurrency(
      code,
      body,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: currency };
  }

  @Delete('currencies/:code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除货币', description: '删除指定的货币配置' })
  @ApiParam({ name: 'code', description: '货币代码 (ISO 4217)', example: 'USD' })
  @ApiNoContentResponse({ description: '货币删除成功' })
  @ApiNotFoundResponse({ description: '货币不存在' })
  @ApiForbiddenResponse({ description: '无法删除系统默认货币' })
  async deleteCurrency(
    @Req() req: RequestWithIp,
    @Param('code') code: string,
  ) {
    const adminId = (req as any).user?.userId;
    await this.adminService.deleteCurrency(
      code,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
  }

  @Post('currencies/seed')
  @ApiOperation({ summary: '初始化默认货币', description: '导入系统预设的默认货币列表' })
  @ApiResponse({
    status: 200,
    description: '货币初始化成功',
    schema: {
      type: 'object',
      properties: {
        added: { type: 'number', example: 5, description: '新增货币数量' },
        skipped: { type: 'number', example: 150, description: '已存在跳过的货币数量' },
      },
    },
  })
  async seedCurrencies(@Req() req: RequestWithIp) {
    const adminId = (req as any).user?.userId;
    const result = await this.adminService.seedCurrencies(
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: result, message: `${result.added} currencies added, ${result.skipped} skipped` };
  }

  // =========================================================================
  // 货币-提供商关联管理 (Currency-Provider Management)
  // =========================================================================

  @Get('currency-providers')
  @ApiOperation({ summary: '获取货币-提供商关联列表', description: '获取所有货币与其汇率提供商的关联关系' })
  @ApiResponse({ status: 200, description: '成功获取关联列表' })
  async listCurrencyProviders() {
    const associations = await this.adminService.currencyProviderService.getAll();
    return { success: true, data: associations };
  }

  @Get('currency-providers/:currencyCode')
  @ApiOperation({ summary: '获取货币的提供商', description: '获取指定货币配置的所有汇率提供商' })
  @ApiParam({ name: 'currencyCode', description: '货币代码 (ISO 4217)', example: 'USD' })
  @ApiResponse({ status: 200, description: '成功获取货币的提供商列表' })
  async getProvidersForCurrency(@Param('currencyCode') currencyCode: string) {
    const providers = await this.adminService.currencyProviderService.getProvidersForCurrency(currencyCode);
    return { success: true, data: providers };
  }

  @Put('currency-providers/:currencyCode/priorities')
  @ApiOperation({ summary: '更新提供商优先级', description: '更新指定货币的汇率提供商优先级顺序' })
  @ApiParam({ name: 'currencyCode', description: '货币代码 (ISO 4217)', example: 'USD' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        provider_ids: { type: 'array', items: { type: 'string' }, example: ['id1', 'id2', 'id3'], description: '按优先级排序的提供商ID列表' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '提供商优先级更新成功' })
  async updateProviderPriorities(
    @Param('currencyCode') currencyCode: string,
    @Body() body: { provider_ids: string[] },
  ) {
    await this.adminService.currencyProviderService.reorderProviders(currencyCode, body.provider_ids);
    return { success: true, message: 'Provider priorities updated' };
  }

  @Post('currency-providers')
  @ApiOperation({ summary: '添加货币-提供商关联', description: '为货币添加一个汇率提供商' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        currency_code: { type: 'string', example: 'USD', description: '货币代码' },
        provider_id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000', description: '提供商ID' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '关联创建成功' })
  async addCurrencyProvider(
    @Body() body: { currency_code: string; provider_id: string },
  ) {
    const association = await this.adminService.currencyProviderService.addAssociation(
      body.currency_code,
      body.provider_id,
    );
    return { success: true, data: association };
  }

  @Delete('currency-providers/:currencyCode/:providerId')
  @ApiOperation({ summary: '移除货币-提供商关联', description: '从货币中移除一个汇率提供商' })
  @ApiParam({ name: 'currencyCode', description: '货币代码 (ISO 4217)', example: 'USD' })
  @ApiParam({ name: 'providerId', description: '提供商ID (UUID格式)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '关联移除成功' })
  async removeCurrencyProvider(
    @Param('currencyCode') currencyCode: string,
    @Param('providerId') providerId: string,
  ) {
    await this.adminService.currencyProviderService.removeAssociation(currencyCode, providerId);
    return { success: true, message: 'Currency-provider association removed' };
  }

  // =========================================================================
  // 审计日志 (Audit Logs)
  // =========================================================================

  @Get('logs')
  @ApiOperation({ summary: '获取审计日志', description: '分页获取系统审计日志，支持多种过滤条件' })
  @ApiQuery({ name: 'offset', required: false, description: '分页偏移量', example: 0 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 50 })
  @ApiQuery({ name: 'user_id', required: false, description: '按用户ID过滤', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiQuery({ name: 'action', required: false, description: '按操作类型过滤', example: 'CREATE' })
  @ApiQuery({ name: 'entity_type', required: false, description: '按实体类型过滤', example: 'user' })
  @ApiQuery({ name: 'date_from', required: false, description: '起始日期', example: '2024-01-01' })
  @ApiQuery({ name: 'date_to', required: false, description: '结束日期', example: '2024-12-31' })
  @ApiResponse({ status: 200, description: '成功获取审计日志' })
  async getAuditLogs(
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
    @Query('user_id') userId?: string,
    @Query('action') action?: string,
    @Query('entity_type') entityType?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    const result = await this.adminService.getAuditLogs({
      offset,
      limit,
      user_id: userId,
      action,
      entity_type: entityType,
      date_from: dateFrom,
      date_to: dateTo,
    });
    return { success: true, data: result };
  }

  @Get('logs/export')
  @ApiOperation({ summary: '导出审计日志', description: '将审计日志导出为CSV文件' })
  @ApiQuery({ name: 'user_id', required: false, description: '按用户ID过滤' })
  @ApiQuery({ name: 'action', required: false, description: '按操作类型过滤' })
  @ApiQuery({ name: 'entity_type', required: false, description: '按实体类型过滤' })
  @ApiQuery({ name: 'date_from', required: false, description: '起始日期' })
  @ApiQuery({ name: 'date_to', required: false, description: '结束日期' })
  @ApiResponse({
    status: 200,
    description: 'CSV文件',
    schema: { type: 'string', format: 'binary' },
  })
  async exportAuditLogs(
    @Res() res: Response,
    @Query('user_id') userId?: string,
    @Query('action') action?: string,
    @Query('entity_type') entityType?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    const csv = await this.adminService.exportAuditLogsToCsv({
      user_id: userId,
      action,
      entity_type: entityType,
      date_from: dateFrom,
      date_to: dateTo,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
    res.send(csv);
  }

  // =========================================================================
  // Data Export
  // =========================================================================
  // 调度器管理 (Scheduler Management)
  // =========================================================================

  @Get('scheduler/config')
  @ApiOperation({ summary: '获取调度器配置', description: '获取汇率抓取调度器的当前配置' })
  @ApiResponse({ status: 200, description: '成功获取调度器配置' })
  async getSchedulerConfig() {
    const config = await this.adminService.getSchedulerConfig();
    return { success: true, data: config };
  }

  @Put('scheduler/config')
  @ApiOperation({ summary: '更新调度器配置', description: '更新汇率抓取调度器的配置' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', example: true, description: '是否启用调度器' },
        interval: { type: 'number', example: 60, description: '抓取间隔(秒)' },
        providers: { type: 'array', items: { type: 'string' }, description: '启用的提供商列表' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '调度器配置更新成功' })
  async updateSchedulerConfig(
    @Req() req: RequestWithIp,
    @Body() body: any,
  ) {
    const adminId = (req as any).user?.userId;
    const config = await this.adminService.updateSchedulerConfig(
      body,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: config };
  }

  @Post('scheduler/fetch')
  @ApiOperation({ summary: '手动触发汇率抓取', description: '手动触发一次汇率抓取任务，可指定提供商和货币' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        provider_ids: { type: 'array', items: { type: 'string' }, description: '指定提供商ID列表，不提供则抓取所有' },
        currencies: { type: 'array', items: { type: 'string' }, description: '指定货币代码列表，不提供则抓取所有' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '抓取任务已触发',
    schema: {
      type: 'object',
      properties: {
        triggered: { type: 'boolean', example: true },
        provider_count: { type: 'number', example: 3 },
        currency_count: { type: 'number', example: 5 },
      },
    },
  })
  async triggerManualFetch(
    @Req() req: RequestWithIp,
    @Body() body: { provider_ids?: string[]; currencies?: string[] },
  ) {
    const adminId = (req as any).user?.userId;
    const result = await this.adminService.triggerManualFetch(
      adminId,
      body,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: result };
  }

  @Get('scheduler/history')
  @ApiOperation({ summary: '获取调度器历史', description: '获取汇率抓取调度器的执行历史记录' })
  @ApiResponse({ status: 200, description: '成功获取调度器历史' })
  async getSchedulerHistory() {
    const history = await this.adminService.getSchedulerHistory();
    return { success: true, data: history };
  }

  // =========================================================================
  // 插件管理 (Plugin Management)
  // =========================================================================

  @Get('plugins')
  @ApiOperation({ summary: '获取插件列表', description: '获取所有已安装的JS插件' })
  @ApiResponse({ status: 200, description: '成功获取插件列表' })
  async listPlugins() {
    const plugins = await this.adminService.listPlugins();
    return { success: true, data: plugins };
  }

  @Post('plugins')
  @ApiOperation({ summary: '上传插件', description: '上传并安装新的JS插件' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filename: { type: 'string', example: 'my-provider.js', description: '插件文件名' },
        content: { type: 'string', example: 'module.exports = { ... }', description: '插件代码内容(Base64编码)' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '插件上传成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'plugin-123' },
        name: { type: 'string', example: 'my-provider.js' },
        status: { type: 'string', example: 'loaded' },
      },
    },
  })
  async uploadPlugin(
    @Req() req: RequestWithIp,
    @Body() body: { filename: string; content: string },
  ) {
    const adminId = (req as any).user?.userId;
    const result = await this.adminService.uploadPlugin(
      body.content,
      body.filename,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: result };
  }

  @Post('plugins/:id/reload')
  @ApiOperation({ summary: '重载插件', description: '重新加载指定的JS插件' })
  @ApiParam({ name: 'id', description: '插件ID', example: 'plugin-123' })
  @ApiResponse({
    status: 200,
    description: '插件重载成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Plugin reloaded successfully' },
      },
    },
  })
  async reloadPlugin(
    @Req() req: RequestWithIp,
    @Param('id') id: string,
  ) {
    const adminId = (req as any).user?.userId;
    const result = await this.adminService.reloadPlugin(
      id,
      adminId,
      req.ip || req.headers?.['x-forwarded-for'],
    );
    return { success: true, data: result };
  }

  // =========================================================================
  // 健康监控 (Health Monitoring)
  // =========================================================================

  @Get('health')
  @ApiOperation({ summary: '获取系统健康状态', description: '获取系统各组件的健康检查状态' })
  @ApiResponse({
    status: 200,
    description: '系统健康状态',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy', description: '整体状态' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        components: {
          type: 'object',
          properties: {
            database: { type: 'object', properties: { status: { type: 'string' }, latency: { type: 'number' } } },
            redis: { type: 'object', properties: { status: { type: 'string' }, latency: { type: 'number' } } },
          },
        },
      },
    },
  })
  async getHealth() {
    const health = await this.adminService.getHealthStatus();
    return health;
  }
}
