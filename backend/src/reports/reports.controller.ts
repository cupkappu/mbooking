import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Generate balance sheet' })
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
  @ApiOperation({ summary: 'Generate income statement' })
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
}
