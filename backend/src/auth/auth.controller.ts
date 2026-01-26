import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { IsString, IsOptional, IsNotEmpty, MinLength } from 'class-validator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

export class LoginDto {
  @ApiProperty({ description: '用户邮箱', example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '用户密码', example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ description: '用户邮箱', example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '用户密码', example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: '用户名称（可选）', example: '张三' })
  @IsOptional()
  @IsString()
  name?: string;
}

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功，返回JWT访问令牌和刷新令牌' })
  @ApiBadRequestResponse({ description: '请求参数验证失败' })
  @ApiUnauthorizedResponse({ description: '邮箱或密码错误' })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功，自动登录并返回JWT令牌' })
  @ApiBadRequestResponse({ description: '邮箱已存在或请求参数验证失败' })
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(body);
    return this.authService.login(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户资料' })
  @ApiResponse({ status: 200, description: '返回当前登录用户的资料信息' })
  @ApiUnauthorizedResponse({ description: '未授权访问，需要有效的JWT令牌' })
  getProfile(@Request() req) {
    return req.user;
  }
}
