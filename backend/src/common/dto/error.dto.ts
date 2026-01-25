import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ description: 'HTTP状态码', example: 400 })
  statusCode: number;

  @ApiProperty({ description: '错误消息', example: '请求参数验证失败' })
  message: string;

  @ApiProperty({ description: '错误名称', example: 'Bad Request' })
  error: string;
}

export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({ description: '验证错误详情', example: ['name不能为空', 'email格式不正确'] })
  validationErrors?: string[];
}

export class SuccessResponseDto<T = any> {
  @ApiProperty({ description: '操作是否成功', example: true })
  success: boolean;

  @ApiProperty({ description: '返回数据', nullable: true })
  data?: T;

  @ApiProperty({ description: '提示消息', nullable: true, example: '操作成功' })
  message?: string;
}

export class CreatedResponseDto<T = any> extends SuccessResponseDto {
  @ApiProperty({ description: '创建的资源ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id?: string;
}

export class DeletedResponseDto extends SuccessResponseDto {
  @ApiProperty({ description: '操作成功标志', example: true })
  success: boolean = true;
}
