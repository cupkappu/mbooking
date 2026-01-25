import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiParam, ApiQuery, ApiNoContentResponse } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('提供商')
@Controller('providers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: '获取所有汇率提供商列表' })
  @ApiQuery({ name: 'active_only', required: false, description: '是否只返回激活的提供商，默认true', example: true })
  @ApiResponse({ status: 200, description: '成功返回提供商列表' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async findAll() {
    return this.providersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取提供商详情' })
  @ApiParam({ name: 'id', description: '提供商ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '成功返回提供商详情' })
  @ApiNotFoundResponse({ description: '提供商不存在' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async findOne(@Param('id') id: string) {
    return this.providersService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @ApiOperation({ summary: '创建新的汇率提供商' })
  @ApiResponse({ status: 201, description: '提供商创建成功' })
  @ApiBadRequestResponse({ description: '请求参数验证失败或提供商配置无效' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  @ApiForbiddenResponse({ description: '需要管理员权限' })
  async create(@Body() createProviderDto: CreateProviderDto) {
    return this.providersService.create(createProviderDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  @ApiOperation({ summary: '更新提供商配置' })
  @ApiParam({ name: 'id', description: '提供商ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '提供商更新成功' })
  @ApiNotFoundResponse({ description: '提供商不存在' })
  @ApiBadRequestResponse({ description: '请求参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  @ApiForbiddenResponse({ description: '需要管理员权限' })
  async update(@Param('id') id: string, @Body() updateProviderDto: UpdateProviderDto) {
    return this.providersService.update(id, updateProviderDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除提供商（软删除）' })
  @ApiParam({ name: 'id', description: '提供商ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiNoContentResponse({ description: '提供商删除成功' })
  @ApiNotFoundResponse({ description: '提供商不存在' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  @ApiForbiddenResponse({ description: '需要管理员权限' })
  async delete(@Param('id') id: string) {
    return this.providersService.delete(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: '测试提供商连接' })
  @ApiParam({ name: 'id', description: '提供商ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '返回连接测试结果，包含连接状态和响应时间' })
  @ApiNotFoundResponse({ description: '提供商不存在' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async testConnection(@Param('id') id: string) {
    return this.providersService.testConnection(id);
  }
}
