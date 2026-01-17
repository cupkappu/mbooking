import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@ApiTags('providers') @Controller('providers') @UseGuards(JwtAuthGuard) @ApiBearerAuth()
export class ProvidersController { constructor(private providersService: ProvidersService) {} }
