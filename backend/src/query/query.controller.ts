import { Controller, Post, Get, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { QueryService, BalanceQuery } from './query.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('查询')
@Controller('query')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QueryController {
  private readonly logger = new Logger(QueryController.name);

  constructor(private queryService: QueryService) {}

  @Post('balances')
  @ApiOperation({ summary: '查询账户余额' })
  @ApiResponse({ status: 200, description: '返回符合条件的账户余额列表' })
  @ApiBadRequestResponse({ description: '查询参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getBalances(@Body() query: BalanceQuery) {
    return this.queryService.getBalances(query);
  }

  @Post('journal-entries')
  @ApiOperation({ summary: '查询日记账条目' })
  @ApiResponse({ status: 200, description: '返回符合条件的日记账条目列表' })
  @ApiBadRequestResponse({ description: '查询参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getJournalEntries(@Body() query: any) {
    return this.queryService.getJournalEntries(query);
  }

  @Get('summary')
  @ApiOperation({ summary: '获取仪表盘汇总数据' })
  @ApiResponse({ status: 200, description: '返回仪表盘汇总数据，包括总资产、总负债、本月收支等' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async getSummary() {
    return this.queryService.getSummary();
  }
}
