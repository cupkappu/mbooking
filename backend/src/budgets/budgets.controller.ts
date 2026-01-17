import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
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
  async findAll(@Request() req) {
    return this.budgetsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  async findById(@Param('id') id: string, @Request() req) {
    return this.budgetsService.findById(id, req.user.tenantId);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get budget progress' })
  async getProgress(@Param('id') id: string, @Request() req) {
    return this.budgetsService.getProgress(id, req.user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create budget' })
  async create(@Body() data: any, @Request() req) {
    return this.budgetsService.create(data, req.user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update budget' })
  async update(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.budgetsService.update(id, data, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget' })
  async delete(@Param('id') id: string, @Request() req) {
    await this.budgetsService.delete(id, req.user.tenantId);
    return { success: true };
  }
}
