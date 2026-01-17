import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrenciesService } from './currencies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('currencies')
@Controller('currencies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CurrenciesController {
  constructor(private currenciesService: CurrenciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all currencies' })
  async findAll() {
    return this.currenciesService.findAll();
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default currencies' })
  async seed() {
    await this.currenciesService.seedDefaultCurrencies();
    return { success: true, message: 'Currencies seeded successfully' };
  }
}
