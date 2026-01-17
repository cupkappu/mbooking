import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiNotFoundResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { ProvidersService } from './providers.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('providers')
@Controller('providers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all providers' })
  @ApiResponse({ status: 200, description: 'Returns all active providers' })
  async findAll() {
    return this.providersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get provider by ID' })
  @ApiResponse({ status: 200, description: 'Returns the provider' })
  @ApiNotFoundResponse({ description: 'Provider not found' })
  async findOne(@Param('id') id: string) {
    return this.providersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new provider' })
  @ApiResponse({ status: 201, description: 'Provider created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  async create(@Body() createProviderDto: CreateProviderDto) {
    return this.providersService.create(createProviderDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a provider' })
  @ApiResponse({ status: 200, description: 'Provider updated successfully' })
  @ApiNotFoundResponse({ description: 'Provider not found' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  async update(@Param('id') id: string, @Body() updateProviderDto: UpdateProviderDto) {
    return this.providersService.update(id, updateProviderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a provider (soft delete)' })
  @ApiResponse({ status: 204, description: 'Provider deleted successfully' })
  @ApiNotFoundResponse({ description: 'Provider not found' })
  async delete(@Param('id') id: string) {
    return this.providersService.delete(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test provider connection' })
  @ApiResponse({ status: 200, description: 'Returns connection test result' })
  @ApiNotFoundResponse({ description: 'Provider not found' })
  async testConnection(@Param('id') id: string) {
    return this.providersService.testConnection(id);
  }
}
