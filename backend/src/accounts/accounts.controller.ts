import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiProperty } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

class MoveAccountDto {
  @ApiProperty({ description: '新的父账户ID，设为null表示移动到根目录', example: '550e8400-e29b-41d4-a716-446655440000', nullable: true })
  new_parent_id: string | null;
}

@ApiTags('账户')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有账户列表' })
  @ApiQuery({ name: 'offset', required: false, description: '分页偏移量，默认0', example: 0 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认20', example: 20 })
  @ApiResponse({ status: 200, description: '成功返回账户列表' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async findAll() {
    return this.accountsService.findAll();
  }

  @Get('tree')
  @ApiOperation({ summary: '获取账户层级树' })
  @ApiResponse({ status: 200, description: '成功返回账户层级树结构' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async findTree() {
    return this.accountsService.findTree();
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取账户信息' })
  @ApiParam({ name: 'id', description: '账户ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '成功返回账户信息' })
  @ApiNotFoundResponse({ description: '账户不存在' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async findById(@Param('id') id: string) {
    return this.accountsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建新账户' })
  @ApiResponse({ status: 201, description: '账户创建成功' })
  @ApiBadRequestResponse({ description: '请求参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async create(@Body() data: CreateAccountDto) {
    return this.accountsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新账户信息' })
  @ApiParam({ name: 'id', description: '账户ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '账户更新成功' })
  @ApiNotFoundResponse({ description: '账户不存在' })
  @ApiBadRequestResponse({ description: '请求参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async update(@Param('id') id: string, @Body() data: UpdateAccountDto) {
    return this.accountsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除账户' })
  @ApiParam({ name: 'id', description: '账户ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '账户删除成功' })
  @ApiNotFoundResponse({ description: '账户不存在' })
  @ApiForbiddenResponse({ description: '无法删除包含子账户的账户' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async delete(@Param('id') id: string) {
    await this.accountsService.delete(id);
    return { success: true };
  }

  @Post(':id/move')
  @ApiOperation({ summary: '移动账户到新的父账户' })
  @ApiParam({ name: 'id', description: '要移动的账户ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: '账户移动成功' })
  @ApiNotFoundResponse({ description: '账户不存在' })
  @ApiBadRequestResponse({ description: '请求参数验证失败或目标父账户不存在' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async moveAccount(
    @Param('id') id: string,
    @Body() body: MoveAccountDto,
  ) {
    return this.accountsService.moveAccount(id, body.new_parent_id);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: '获取账户余额' })
  @ApiParam({ name: 'id', description: '账户ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiQuery({ name: 'date', required: false, description: '查询日期（可选），默认查询最新余额', example: '2024-01-15' })
  @ApiResponse({ status: 200, description: '成功返回账户余额信息' })
  @ApiNotFoundResponse({ description: '账户不存在' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getBalance(@Param('id') id: string) {
    return this.accountsService.getBalance(id);
  }
}
