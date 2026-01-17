import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RatesService } from './rates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('rates')
@Controller('rates')
export class RatesController {
  constructor(private ratesService: RatesService) {}

  @Get('latest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get latest exchange rate' })
  async getLatestRate(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.ratesService.getLatestRate(from, to);
  }

  @Get('convert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert currency' })
  async convert(
    @Query('amount') amount: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.ratesService.convert(amount, from, to);
  }
}
