import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('预算')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: '获取预算列表' })
  @ApiQuery({ name: 'offset', required: false, description: '分页偏移量，默认0', example: 0 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认20', example: 20 })
  @ApiQuery({ name: 'is_active', required: false, description: '是否只返回激活的预算', example: true })
  @ApiResponse({ status: 200, description: '成功返回预算列表' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async findAll() {
    return this.budgetsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取预算详情' })
  @ApiParam({ name: 'id', description: '预算ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '成功返回预算详情' })
  @ApiNotFoundResponse({ description: '预算不存在' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async findById(@Param('id') id: string) {
    return this.budgetsService.findById(id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: '获取预算执行进度' })
  @ApiParam({ name: 'id', description: '预算ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '返回预算执行进度，包含已使用金额、剩余金额、使用百分比等' })
  @ApiNotFoundResponse({ description: '预算不存在' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getProgress(@Param('id') id: string) {
    return this.budgetsService.getProgress(id);
  }

  @Post()
  @ApiOperation({ summary: '创建新预算' })
  @ApiResponse({ status: 201, description: '预算创建成功' })
  @ApiBadRequestResponse({ description: '请求参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async create(@Body() data: any) {
    return this.budgetsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新预算信息' })
  @ApiParam({ name: 'id', description: '预算ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '预算更新成功' })
  @ApiNotFoundResponse({ description: '预算不存在' })
  @ApiBadRequestResponse({ description: '请求参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.budgetsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除预算' })
  @ApiNoContentResponse({ description: '预算删除成功' })
  @ApiNotFoundResponse({ description: '预算不存在' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async delete(@Param('id') id: string) {
    await this.budgetsService.delete(id);
    return { success: true };
  }
}
