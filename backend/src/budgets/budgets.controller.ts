import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('budgets')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all budgets' })
  async findAll() {
    return this.budgetsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  async findById(@Param('id') id: string) {
    return this.budgetsService.findById(id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get budget progress' })
  async getProgress(@Param('id') id: string) {
    return this.budgetsService.getProgress(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create budget' })
  async create(@Body() data: any) {
    return this.budgetsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update budget' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.budgetsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget' })
  async delete(@Param('id') id: string) {
    await this.budgetsService.delete(id);
    return { success: true };
  }
}
