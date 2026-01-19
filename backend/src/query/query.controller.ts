import { Controller, Post, Get, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QueryService, BalanceQuery } from './query.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('query')
@Controller('query')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QueryController {
  private readonly logger = new Logger(QueryController.name);

  constructor(private queryService: QueryService) {}

  @Post('balances')
  @ApiOperation({ summary: 'Query account balances' })
  async getBalances(@Body() query: BalanceQuery) {
    return this.queryService.getBalances(query);
  }

  @Post('journal-entries')
  @ApiOperation({ summary: 'Query journal entries' })
  async getJournalEntries(@Body() query: any) {
    return this.queryService.getJournalEntries(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary data' })
  async getSummary() {
    return this.queryService.getSummary();
  }
}
