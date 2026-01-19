import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JournalService } from './journal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('journal')
@Controller('journal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JournalController {
  constructor(private journalService: JournalService) {}

  @Get()
  @ApiOperation({ summary: 'Get journal entries' })
  async findAll(
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    const entries = await this.journalService.findAll({ offset, limit });
    return { entries };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get journal entry by ID' })
  async findById(@Param('id') id: string) {
    return this.journalService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create journal entry' })
  async create(@Body() data: any) {
    return this.journalService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update journal entry' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.journalService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete journal entry' })
  async delete(@Param('id') id: string) {
    await this.journalService.delete(id);
    return { success: true };
  }
}
