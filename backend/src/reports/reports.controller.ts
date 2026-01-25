import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('报表')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('balance-sheet')
  @ApiOperation({ summary: '生成资产负债表' })
  @ApiQuery({ name: 'as_of_date', required: false, description: '报表日期，默认今天', example: '2024-01-31' })
  @ApiQuery({ name: 'depth', required: false, description: '账户层级深度，默认全部层级', example: 3 })
  @ApiQuery({ name: 'currency', required: false, description: '显示货币，默认账户本位币', example: 'USD' })
  @ApiResponse({ status: 200, description: '返回资产负债表，包含资产、负债、净资产等' })
  @ApiBadRequestResponse({ description: '请求参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getBalanceSheet(
    @Request() req,
    @Query('as_of_date') asOfDate?: string,
    @Query('depth') depth?: number,
    @Query('currency') currency?: string,
  ) {
    return this.reportsService.getBalanceSheet(req.user.tenantId, {
      asOfDate: asOfDate ? new Date(asOfDate) : undefined,
      depth: depth ? Number(depth) : undefined,
      currency,
    });
  }

  @Get('income-statement')
  @ApiOperation({ summary: '生成损益表（利润表）' })
  @ApiQuery({ name: 'from_date', required: false, description: '开始日期，默认本月第一天', example: '2024-01-01' })
  @ApiQuery({ name: 'to_date', required: false, description: '结束日期，默认今天', example: '2024-01-31' })
  @ApiQuery({ name: 'depth', required: false, description: '账户层级深度', example: 3 })
  @ApiQuery({ name: 'currency', required: false, description: '显示货币', example: 'USD' })
  @ApiResponse({ status: 200, description: '返回损益表，包含收入、成本、费用、净利润等' })
  @ApiBadRequestResponse({ description: '请求参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getIncomeStatement(
    @Request() req,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('depth') depth?: number,
    @Query('currency') currency?: string,
  ) {
    return this.reportsService.getIncomeStatement(req.user.tenantId, {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      depth: depth ? Number(depth) : undefined,
      currency,
    });
  }

  @Get('cash-flow')
  @ApiOperation({ summary: '生成现金流量表' })
  @ApiQuery({ name: 'from_date', required: false, description: '开始日期，默认本月第一天', example: '2024-01-01' })
  @ApiQuery({ name: 'to_date', required: false, description: '结束日期，默认今天', example: '2024-01-31' })
  @ApiQuery({ name: 'depth', required: false, description: '账户层级深度', example: 3 })
  @ApiQuery({ name: 'currency', required: false, description: '显示货币', example: 'USD' })
  @ApiResponse({ status: 200, description: '返回现金流量表，包含经营活动、投资活动、筹资活动的现金流量' })
  @ApiBadRequestResponse({ description: '请求参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getCashFlowStatement(
    @Request() req,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('depth') depth?: number,
    @Query('currency') currency?: string,
  ) {
    return this.reportsService.getCashFlowStatement(req.user.tenantId, {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      depth: depth ? Number(depth) : undefined,
      currency,
    });
  }

  @Get('income-statement/compare')
  @ApiOperation({ summary: '生成损益表期间对比' })
  @ApiQuery({ name: 'current_from_date', required: false, description: '当前期间开始日期', example: '2024-01-01' })
  @ApiQuery({ name: 'current_to_date', required: false, description: '当前期间结束日期', example: '2024-01-31' })
  @ApiQuery({ name: 'prior_from_date', required: false, description: '对比期间开始日期', example: '2023-01-01' })
  @ApiQuery({ name: 'prior_to_date', required: false, description: '对比期间结束日期', example: '2023-01-31' })
  @ApiQuery({ name: 'depth', required: false, description: '账户层级深度', example: 3 })
  @ApiQuery({ name: 'currency', required: false, description: '显示货币', example: 'USD' })
  @ApiResponse({ status: 200, description: '返回两个期间的损益对比，包含各项指标的变动' })
  @ApiBadRequestResponse({ description: '请求参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getIncomeStatementComparison(
    @Request() req,
    @Query('current_from_date') currentFromDate?: string,
    @Query('current_to_date') currentToDate?: string,
    @Query('prior_from_date') priorFromDate?: string,
    @Query('prior_to_date') priorToDate?: string,
    @Query('depth') depth?: number,
    @Query('currency') currency?: string,
  ) {
    return this.reportsService.getIncomeStatementComparison(req.user.tenantId, {
      currentFromDate: currentFromDate ? new Date(currentFromDate) : undefined,
      currentToDate: currentToDate ? new Date(currentToDate) : undefined,
      priorFromDate: priorFromDate ? new Date(priorFromDate) : undefined,
      priorToDate: priorToDate ? new Date(priorToDate) : undefined,
      depth: depth ? Number(depth) : undefined,
      currency,
    });
  }
}
