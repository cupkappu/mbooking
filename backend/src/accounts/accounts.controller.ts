import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  async findAll() {
    return this.accountsService.findAll();
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get account tree' })
  async findTree() {
    return this.accountsService.findTree();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  async findById(@Param('id') id: string) {
    return this.accountsService.findById(id);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Create account' })
  async create(@Body() data: CreateAccountDto) {
    return this.accountsService.create(data);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update account' })
  async update(@Param('id') id: string, @Body() data: UpdateAccountDto) {
    return this.accountsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account' })
  async delete(@Param('id') id: string) {
    await this.accountsService.delete(id);
    return { success: true };
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move account to new parent' })
  async moveAccount(
    @Param('id') id: string,
    @Body() body: { new_parent_id: string | null },
  ) {
    return this.accountsService.moveAccount(id, body.new_parent_id);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  async getBalance(@Param('id') id: string) {
    return this.accountsService.getBalance(id);
  }
}
