import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global API prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('多币种记账系统 API')
    .setDescription(`
## 多币种记账系统后端API文档

本系统提供完整的复式记账、多币种支持、层级账户、预算管理和财务报表功能。

### 主要功能模块
- **认证管理**: 用户登录、注册、JWT令牌管理
- **账户管理**: 层级账户CRUD、余额查询、账户树
- **日记账**: 复式记账、借贷平衡验证、多币种支持
- **预算管理**: 周期预算、进度跟踪、告警
- **汇率管理**: 汇率获取、货币转换、历史汇率
- **报表**: 资产负债表、损益表、现金流量表
- **导出**: CSV格式导出

### 认证方式
所有API端点（除认证和系统设置外）都需要Bearer Token认证。
请在Swagger UI右上角点击Authorize按钮输入JWT令牌。

### 分页参数
列表类API支持分页查询，使用offset和limit参数：
- offset: 偏移量，默认0
- limit: 每页数量，默认20，最大100

### 错误响应
所有错误响应遵循以下格式：
\`\`\`json
{
  "statusCode": 400,
  "message": "请求参数验证失败",
  "error": "Bad Request"
}
\`\`\`
    `)
    .setVersion('1.0')
    .addTag('认证', '用户认证相关接口')
    .addTag('账户', '账户管理相关接口')
    .addTag('日记账', '日记账条目相关接口')
    .addTag('预算', '预算管理相关接口')
    .addTag('货币', '货币配置相关接口')
    .addTag('汇率', '汇率操作相关接口')
    .addTag('提供商', '汇率提供商管理')
    .addTag('查询', '余额和交易查询')
    .addTag('报表', '财务报表生成')
    .addTag('导出', '数据导出相关接口')
    .addTag('管理员', '系统管理接口')
    .addTag('租户', '租户管理接口')
    .addTag('系统设置', '系统初始化配置')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
