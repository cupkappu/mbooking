import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { JournalService } from './journal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('日记账')
@Controller('journal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JournalController {
  constructor(private journalService: JournalService) {}

  @Get()
  @ApiOperation({ summary: '获取日记账条目列表' })
  @ApiQuery({ name: 'offset', required: false, description: '分页偏移量，默认0', example: 0 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认20', example: 20 })
  @ApiQuery({ name: 'date_from', required: false, description: '开始日期', example: '2024-01-01' })
  @ApiQuery({ name: 'date_to', required: false, description: '结束日期', example: '2024-01-31' })
  @ApiQuery({ name: 'account_id', required: false, description: '账户ID过滤', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '成功返回日记账条目列表' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async findAll(
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    const entries = await this.journalService.findAll({ offset, limit });
    return { entries };
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取日记账条目' })
  @ApiParam({ name: 'id', description: '日记账条目ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '成功返回日记账条目详情' })
  @ApiNotFoundResponse({ description: '日记账条目不存在' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async findById(@Param('id') id: string) {
    return this.journalService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建日记账条目' })
  @ApiResponse({ status: 201, description: '日记账条目创建成功' })
  @ApiBadRequestResponse({ description: '请求参数验证失败或借贷不平衡' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async create(@Body() data: any) {
    return this.journalService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新日记账条目' })
  @ApiParam({ name: 'id', description: '日记账条目ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '日记账条目更新成功' })
  @ApiNotFoundResponse({ description: '日记账条目不存在' })
  @ApiBadRequestResponse({ description: '请求参数验证失败或借贷不平衡' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.journalService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除日记账条目' })
  @ApiNoContentResponse({ description: '日记账条目删除成功' })
  @ApiNotFoundResponse({ description: '日记账条目不存在' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async delete(@Param('id') id: string) {
    await this.journalService.delete(id);
    return { success: true };
  }
}
