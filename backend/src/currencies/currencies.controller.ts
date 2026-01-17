import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CurrenciesService } from './currencies.service';
import { CreateCurrencyDto, UpdateCurrencyDto } from './dto/currency.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('currencies')
@Controller('currencies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CurrenciesController {
  constructor(private currenciesService: CurrenciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all currencies' })
  @ApiResponse({ status: 200, description: 'Returns all active currencies' })
  async findAll() {
    return this.currenciesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get currency by code' })
  @ApiResponse({ status: 200, description: 'Returns the currency' })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  async findOne(@Param('id') id: string) {
    return this.currenciesService.findByCode(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new currency' })
  @ApiResponse({ status: 201, description: 'Currency created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input or currency already exists' })
  async create(@Body() createCurrencyDto: CreateCurrencyDto) {
    return this.currenciesService.create(createCurrencyDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a currency' })
  @ApiResponse({ status: 200, description: 'Currency updated successfully' })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  async update(
    @Param('id') id: string,
    @Body() updateCurrencyDto: UpdateCurrencyDto,
  ) {
    return this.currenciesService.update(id, updateCurrencyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a currency (soft delete)' })
  @ApiResponse({ status: 204, description: 'Currency deleted successfully' })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  async delete(@Param('id') id: string) {
    return this.currenciesService.delete(id);
  }

  @Post(':id/set-default')
  @ApiOperation({ summary: 'Set currency as default for tenant' })
  @ApiResponse({ status: 200, description: 'Default currency set successfully' })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  @ApiBadRequestResponse({ description: 'Failed to set default currency' })
  async setDefault(@Param('id') id: string, @Req() req: Request & { user: { tenantId: string; userId: string } }) {
    const { tenantId, userId } = req.user;
    return this.currenciesService.setDefault(id, tenantId, userId);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default currencies' })
  @ApiResponse({ status: 200, description: 'Currencies seeded successfully' })
  async seed() {
    await this.currenciesService.seedDefaultCurrencies();
    return { success: true, message: 'Currencies seeded successfully' };
  }
}
