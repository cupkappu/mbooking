import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  async findAll(@Request() req) {
    return this.accountsService.findAll(req.user.tenantId);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get account tree' })
  async findTree(@Request() req) {
    return this.accountsService.findTree(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  async findById(@Param('id') id: string, @Request() req) {
    return this.accountsService.findById(id, req.user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create account' })
  async create(@Body() data: any, @Request() req) {
    return this.accountsService.create(data, req.user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update account' })
  async update(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.accountsService.update(id, data, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account' })
  async delete(@Param('id') id: string, @Request() req) {
    await this.accountsService.delete(id, req.user.tenantId);
    return { success: true };
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  async getBalance(@Param('id') id: string, @Request() req) {
    return this.accountsService.getBalance(id, req.user.tenantId);
  }
}
