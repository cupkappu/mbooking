import { Controller, Post, Get, Body, HttpCode, HttpStatus, Headers, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SetupService } from './setup.service';
import { InitializeSystemDto, InitializeSystemResponseDto, InitializationStatusDto } from './dto';

@ApiTags('setup')
@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  @ApiOperation({ summary: '检查系统初始化状态', description: '检查系统是否已完成初始化配置' })
  @ApiResponse({
    status: 200,
    description: '系统初始化状态',
    schema: {
      type: 'object',
      properties: {
        initialized: { type: 'boolean', example: true, description: '是否已初始化' },
        version: { type: 'string', example: '1.0.0' },
        setup_required: { type: 'boolean', example: false },
      },
    },
  })
  async getStatus(): Promise<InitializationStatusDto> {
    const status = await this.setupService.getStatus();
    return status;
  }

  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '初始化系统', description: '使用初始化密钥初始化系统，创建管理员账户' })
  @ApiResponse({
    status: 201,
    description: '系统初始化成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'System initialized successfully' },
        admin_id: { type: 'string', example: 'admin-123' },
      },
    },
  })
  @ApiResponse({ status: 403, description: '初始化密钥无效或缺失' })
  async initialize(
    @Body() dto: InitializeSystemDto,
    @Headers('x-init-secret') initSecret: string,
  ): Promise<InitializeSystemResponseDto> {
    // Validate INIT_SECRET at controller level for early rejection
    const expectedSecret = process.env.INIT_SECRET;
    if (!expectedSecret) {
      throw new ForbiddenException('Initialization secret not configured on server');
    }
    if (!initSecret || initSecret !== expectedSecret) {
      throw new ForbiddenException('Invalid or missing initialization secret');
    }

    return this.setupService.initialize(dto);
  }
}
