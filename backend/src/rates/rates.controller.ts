import { Controller, Get, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { RatesService } from './rates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('汇率')
@Controller('rates')
export class RatesController {
  constructor(private ratesService: RatesService) {}

  @Get('latest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取最新汇率' })
  @ApiQuery({ name: 'from', required: true, description: '源货币代码（ISO 4217）', example: 'USD' })
  @ApiQuery({ name: 'to', required: true, description: '目标货币代码（ISO 4217）', example: 'CNY' })
  @ApiResponse({ status: 200, description: '成功返回最新汇率，包含买入价、卖出价、汇率值' })
  @ApiBadRequestResponse({ description: '缺少必需的货币代码参数' })
  @ApiNotFoundResponse({ description: '汇率不存在，请配置汇率提供商' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getLatestRate(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to) {
      throw new NotFoundException('Both "from" and "to" currency codes are required');
    }
    
    const rate = await this.ratesService.getLatestRate(from, to);
    
    if (!rate) {
      throw new NotFoundException(
        `Exchange rate not available for ${from.toUpperCase()}/${to.toUpperCase()}. ` +
        'Please configure a rate provider in Admin > Providers.'
      );
    }
    
    return rate;
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取汇率历史记录' })
  @ApiQuery({ name: 'from', required: true, description: '源货币代码', example: 'USD' })
  @ApiQuery({ name: 'to', required: true, description: '目标货币代码', example: 'CNY' })
  @ApiQuery({ name: 'from_date', required: false, description: '开始日期', example: '2024-01-01' })
  @ApiQuery({ name: 'to_date', required: false, description: '结束日期', example: '2024-01-31' })
  @ApiQuery({ name: 'limit', required: false, description: '返回记录数量限制，默认100', example: 100 })
  @ApiResponse({ status: 200, description: '成功返回汇率历史记录列表' })
  @ApiBadRequestResponse({ description: '缺少必需的货币代码参数' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getRateHistory(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.ratesService.getRateHistory(from, to, {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('trend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取汇率趋势分析' })
  @ApiQuery({ name: 'from', required: true, description: '源货币代码', example: 'USD' })
  @ApiQuery({ name: 'to', required: true, description: '目标货币代码', example: 'CNY' })
  @ApiQuery({ name: 'days', required: false, description: '分析天数，默认30天', example: 30 })
  @ApiResponse({ status: 200, description: '返回汇率趋势分析，包含最高价、最低价、均价、涨跌幅等' })
  @ApiBadRequestResponse({ description: '缺少必需的货币代码参数' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getRateTrend(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('days') days?: number,
  ) {
    return this.ratesService.getRateTrend(from, to, days ? Number(days) : 30);
  }

  @Get('convert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '货币金额转换' })
  @ApiQuery({ name: 'amount', required: true, description: '要转换的金额', example: 100 })
  @ApiQuery({ name: 'from', required: true, description: '源货币代码', example: 'USD' })
  @ApiQuery({ name: 'to', required: true, description: '目标货币代码', example: 'CNY' })
  @ApiResponse({ status: 200, description: '返回转换结果，包含源金额、目标金额、使用的汇率等' })
  @ApiBadRequestResponse({ description: '缺少必需的参数' })
  @ApiNotFoundResponse({ description: '汇率不存在，请配置汇率提供商' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async convert(
    @Query('amount') amount: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to) {
      throw new NotFoundException('Both "from" and "to" currency codes are required');
    }
    
    const result = await this.ratesService.convert(amount, from, to);
    
    if (!result) {
      throw new NotFoundException(
        `Exchange rate not available for ${from.toUpperCase()}/${to.toUpperCase()}. ` +
        'Please configure a rate provider in Admin > Providers.'
      );
    }
    
    return result;
  }

  @Get('paths')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取货币转换路径' })
  @ApiQuery({ name: 'from', required: true, description: '源货币代码', example: 'USD' })
  @ApiQuery({ name: 'to', required: true, description: '目标货币代码', example: 'JPY' })
  @ApiResponse({ status: 200, description: '返回可用的货币转换路径列表' })
  @ApiBadRequestResponse({ description: '缺少必需的货币代码参数' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getAvailablePaths(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to) {
      throw new NotFoundException('Both "from" and "to" currency codes are required');
    }
    
    const paths = await this.ratesService.getAvailablePaths(from, to);
    
    return {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      paths,
      totalPaths: paths.length,
    };
  }
}
