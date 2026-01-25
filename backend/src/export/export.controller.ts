import { Controller, Post, Body, Res, Header, UseGuards, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { ExportBillsDto } from './dto/export-bills.dto';
import { ExportAccountsDto } from './dto/export-accounts.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('导出')
@Controller('export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('bills')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="bills.csv"')
  @ApiOperation({ summary: '导出日记账条目为CSV' })
  @ApiResponse({ status: 200, description: '返回CSV文件流', content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } } })
  @ApiBadRequestResponse({ description: '请求参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async exportBills(@Body() dto: ExportBillsDto, @Res() res: Response): Promise<void> {
    try {
      const stream = await this.exportService.exportBillsToCsv(dto);
      
      res.on('finish', () => {
        stream.destroy();
      });

      stream.pipe(res);
    } catch (error) {
      if (error instanceof BadRequestException) {
        res.status(400).json({
          success: false,
          error_code: 'INVALID_REQUEST',
          error_message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error_code: 'EXPORT_FAILED',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  @Post('accounts')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="accounts.csv"')
  @ApiOperation({ summary: '导出账户列表为CSV' })
  @ApiResponse({ status: 200, description: '返回CSV文件流', content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } } })
  @ApiBadRequestResponse({ description: '请求参数验证失败' })
  @ApiUnauthorizedResponse({ description: '未授权访问' })
  async exportAccounts(@Body() dto: ExportAccountsDto, @Res() res: Response): Promise<void> {
    try {
      const stream = await this.exportService.exportAccountsToCsv(dto);
      
      res.on('finish', () => {
        stream.destroy();
      });

      stream.pipe(res);
    } catch (error) {
      if (error instanceof BadRequestException) {
        res.status(400).json({
          success: false,
          error_code: 'INVALID_REQUEST',
          error_message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error_code: 'EXPORT_FAILED',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
}
