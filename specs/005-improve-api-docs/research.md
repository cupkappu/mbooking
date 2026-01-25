# Research: Backend API Documentation Enhancement

## Decision 1: NestJS Swagger Decorator Patterns

### Chosen Approach
Use standard `@nestjs/swagger` decorator set with Chinese summaries for all endpoints.

### Rationale
- The codebase already uses @nestjs/swagger in some controllers (providers.controller.ts has partial documentation)
- Consistent with NestJS best practices
- Enables automatic OpenAPI spec generation
- Supports Swagger UI withTry it out functionality

### Implementation Pattern
```typescript
@ApiTags('模块名称')
@ApiBearerAuth()
@Controller('模块路径')
export class ModuleController {
  @Get()
  @ApiOperation({ summary: '获取所有资源列表' })
  @ApiResponse({ status: 200, description: '成功返回资源列表' })
  @ApiQuery({ name: 'offset', required: false, description: '分页偏移量' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  async findAll(
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {}
}
```

### Best Practices Applied
- `@ApiTags` for endpoint grouping
- `@ApiOperation` with Chinese summary for each endpoint
- `@ApiParam` for path parameters (`:id`, `:code`)
- `@ApiQuery` for query parameters (pagination, filters)
- `@ApiResponse` for success and error responses
- `@ApiBearerAuth` for protected endpoints

## Decision 2: DTO Structure

### Chosen Approach
Separate Create/Update/Response DTOs for each entity following existing codebase patterns.

### Rationale
- Matches pattern in `account.dto.ts` (CreateAccountDto, UpdateAccountDto)
- Clear separation of required vs optional fields
- Proper validation rules per operation type
- Response DTOs for consistent API output format

### DTO Pattern
```typescript
// Create DTO - all fields required
export class CreateEntityDto {
  @ApiProperty({ example: 'xxx', description: '字段描述' })
  @IsString()
  @IsNotEmpty()
  field: string;
}

// Update DTO - all fields optional
export class UpdateEntityDto {
  @ApiPropertyOptional({ example: 'xxx', description: '字段描述' })
  @IsOptional()
  @IsString()
  field?: string;
}

// Response DTO
export class EntityResponseDto {
  @ApiProperty({ example: 'uuid', description: '实体ID' })
  id: string;

  @ApiProperty({ example: 'xxx', description: '字段描述' })
  field: string;
}
```

## Decision 3: Error Response Documentation

### Chosen Approach
Document standard HTTP error responses (400, 401, 403, 404, 500) with schemas.

### Error Response Schema
```typescript
{
  statusCode: number,  // HTTP status code
  message: string,     // Error message
  error: string        // Error name (e.g., "Bad Request")
}
```

### Decorator Pattern
```typescript
@ApiBadRequestResponse({ description: '请求参数验证失败', type: ErrorResponseDto })
@ApiUnauthorizedResponse({ description: '未授权访问', type: ErrorResponseDto })
@ApiForbiddenResponse({ description: '无权限访问', type: ErrorResponseDto })
@ApiNotFoundResponse({ description: '资源不存在', type: ErrorResponseDto })
@ApiInternalServerErrorResponse({ description: '服务器内部错误', type: ErrorResponseDto })
```

## Decision 4: Existing Patterns in Codebase

### Controllers with Partial Documentation (Reference)
1. `providers.controller.ts` - Has @ApiResponse decorators
2. `currencies.controller.ts` - Has @ApiResponse and @ApiNotFoundResponse
3. `accounts.controller.ts` - Basic @ApiOperation only
4. `journal.controller.ts` - Minimal @ApiOperation

### DTO Patterns
- `account.dto.ts` - Complete pattern with @ApiProperty and @ApiPropertyOptional
- `currency.dto.ts` - Complete pattern
- `provider.dto.ts` - Complete pattern with ProviderType enum

## Decision 5: Pagination Documentation

### Chosen Approach
Document offset/limit pagination pattern used in existing code.

### Pagination Response Format
```typescript
{
  items: EntityResponseDto[],  // Array of entities
  total: number,               // Total count
  offset: number,              // Current offset
  limit: number                // Current limit
}
```

### Decorator Pattern
```typescript
@ApiQuery({ name: 'offset', required: false, description: '分页偏移量，默认0' })
@ApiQuery({ name: 'limit', required: false, description: '每页数量，默认20' })
```

## Decision 6: Response Wrapper Documentation

### Chosen Approach
Document the standard response wrapper format used in admin.controller.ts.

### Response Wrapper Format
```typescript
{
  success: boolean,     // Operation success status
  data?: any,           // Response data (optional)
  message?: string      // Success/error message (optional)
}
```

### Decorator Pattern
```typescript
@ApiResponse({ status: 200, description: '成功返回', type: SuccessResponseDto })
```

## Summary of Decisions

| Category | Decision | Key Rationale |
|----------|----------|---------------|
| Decorator Set | @nestjs/swagger standard | Consistent with existing code |
| Documentation Language | Chinese | Project convention, user requirement |
| DTO Pattern | Separate Create/Update/Response | Follows existing patterns |
| Error Responses | Standard HTTP + schema | Consistent with NestJS defaults |
| Pagination | offset/limit | Matches existing code |
| Response Wrapper | success/data/message | Admin controller pattern |
