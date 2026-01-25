# Quickstart: Backend API Documentation Enhancement

## Overview

This guide helps you quickly understand and implement the API documentation enhancement feature.

## What This Feature Does

Adds comprehensive Swagger/OpenAPI documentation to all backend NestJS controllers:
- 12 controllers with ~50 endpoints
- Chinese documentation text
- Proper request/response schemas
- Error response documentation

## Key Files to Modify

### Controllers (Add @Api decorators)

| Controller | File Path | Endpoints | Priority |
|------------|-----------|-----------|----------|
| auth | `backend/src/auth/auth.controller.ts` | 3 | High |
| accounts | `backend/src/accounts/accounts.controller.ts` | 7 | High |
| journal | `backend/src/journal/journal.controller.ts` | 5 | High |
| budgets | `backend/src/budgets/budgets.controller.ts` | 6 | High |
| currencies | `backend/src/currencies/currencies.controller.ts` | 4 | Medium |
| rates | `backend/src/rates/rates.controller.ts` | 6 | Medium |
| providers | `backend/src/providers/providers.controller.ts` | 7 | Medium |
| query | `backend/src/query/query.controller.ts` | 3 | Medium |
| reports | `backend/src/reports/reports.controller.ts` | 4 | Medium |
| export | `backend/src/export/export.controller.ts` | 4 | Medium |
| admin | `backend/src/admin/admin.controller.ts` | 25+ | High |
| tenants | `backend/src/tenants/tenants.controller.ts` | 2 | Low |
| setup | `backend/src/setup/setup.controller.ts` | 2 | Low |

### DTOs (Create/Update)

| DTO | File Path | Action |
|-----|-----------|--------|
| journal.dto.ts | `backend/src/journal/dto/journal.dto.ts` | Create |
| budget.dto.ts | `backend/src/budgets/dto/budget.dto.ts` | Create |
| pagination.dto.ts | `backend/src/common/dto/pagination.dto.ts` | Create |
| error.dto.ts | `backend/src/common/dto/error.dto.ts` | Create |
| account.dto.ts | `backend/src/accounts/dto/account.dto.ts` | Update |
| currency.dto.ts | `backend/src/currencies/dto/currency.dto.ts` | Update |
| provider.dto.ts | `backend/src/providers/dto/provider.dto.ts` | Update |

## Implementation Steps

### Step 1: Review Existing Patterns

```bash
# Look at these files for reference patterns
cat backend/src/accounts/accounts.controller.ts
cat backend/src/accounts/dto/account.dto.ts
cat backend/src/providers/providers.controller.ts
```

### Step 2: Create Missing DTOs

```bash
# Create journal.dto.ts
touch backend/src/journal/dto/journal.dto.ts

# Create budget.dto.ts
touch backend/src/budgets/dto/budget.dto.ts

# Create pagination.dto.ts
touch backend/src/common/dto/pagination.dto.ts

# Create error.dto.ts
touch backend/src/common/dto/error.dto.ts
```

### Step 3: Add Decorators to Controllers

Example pattern for `journal.controller.ts`:

```typescript
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('日记账')
@ApiBearerAuth()
@Controller('journal')
export class JournalController {
  @Get()
  @ApiOperation({ summary: '获取日记账条目列表' })
  @ApiQuery({ name: 'offset', required: false, description: '分页偏移量' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '成功返回日记账条目列表' })
  async findAll(
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取日记账条目' })
  @ApiParam({ name: 'id', description: '日记账条目ID', example: 'uuid-string' })
  @ApiResponse({ status: 200, description: '成功返回日记账条目' })
  @ApiResponse({ status: 404, description: '日记账条目不存在' })
  async findById(@Param('id') id: string) {}

  @Post()
  @ApiOperation({ summary: '创建日记账条目' })
  @ApiResponse({ status: 201, description: '日记账条目创建成功' })
  @ApiResponse({ status: 400, description: '请求参数验证失败' })
  async create(@Body() data: CreateJournalEntryDto) {}
}
```

### Step 4: Verify Documentation

1. Start the backend server:
   ```bash
   cd backend && npm run start:dev
   ```

2. Open Swagger UI:
   ```
   http://localhost:3001/api/docs
   ```

3. Verify:
   - All endpoints are visible
   - Endpoints are properly grouped by @ApiTags
   - Chinese summaries are displayed
   - Request/response schemas are shown
   - "Try it out" functionality works

### Step 5: Run Tests

```bash
# Run backend tests
cd backend && npm run test

# Run E2E tests to verify no regressions
npm run test:e2e
```

## Common Patterns

### Pagination Endpoint
```typescript
@Get()
@ApiOperation({ summary: '获取资源列表' })
@ApiQuery({ name: 'offset', required: false, description: '分页偏移量，默认0' })
@ApiQuery({ name: 'limit', required: false, description: '每页数量，默认20' })
@ApiResponse({ status: 200, description: '成功返回资源列表' })
async findAll(
  @Query('offset') offset?: number,
  @Query('limit') limit?: number,
) {}
```

### CRUD Endpoints
```typescript
@Post()
@ApiOperation({ summary: '创建资源' })
@ApiResponse({ status: 201, description: '资源创建成功' })
async create(@Body() data: CreateDto) {}

@Get(':id')
@ApiOperation({ summary: '根据ID获取资源' })
@ApiParam({ name: 'id', description: '资源ID', example: 'uuid-string' })
@ApiResponse({ status: 200, description: '成功返回资源' })
@ApiResponse({ status: 404, description: '资源不存在' })
async findById(@Param('id') id: string) {}

@Put(':id')
@ApiOperation({ summary: '更新资源' })
@ApiParam({ name: 'id', description: '资源ID', example: 'uuid-string' })
@ApiResponse({ status: 200, description: '资源更新成功' })
@ApiResponse({ status: 404, description: '资源不存在' })
async update(@Param('id') id: string, @Body() data: UpdateDto) {}

@Delete(':id')
@ApiOperation({ summary: '删除资源' })
@ApiParam({ name: 'id', description: '资源ID', example: 'uuid-string' })
@ApiResponse({ status: 204, description: '资源删除成功' })
@ApiResponse({ status: 404, description: '资源不存在' })
async delete(@Param('id') id: string) {}
```

### Error Responses
```typescript
@ApiBadRequestResponse({ description: '请求参数验证失败' })
@ApiUnauthorizedResponse({ description: '未授权访问' })
@ApiForbiddenResponse({ description: '无权限访问' })
@ApiNotFoundResponse({ description: '资源不存在' })
@ApiInternalServerErrorResponse({ description: '服务器内部错误' })
```

## Testing Checklist

- [ ] All 12 controllers have @ApiTags
- [ ] All endpoints have @ApiOperation with Chinese summary
- [ ] All path parameters have @ApiParam with description and example
- [ ] All query parameters have @ApiQuery with type and description
- [ ] All endpoints have @ApiResponse for success (200/201/204)
- [ ] All endpoints document error responses (400, 401, 403, 404)
- [ ] All protected endpoints have @ApiBearerAuth
- [ ] All DTOs have @ApiProperty or @ApiPropertyOptional
- [ ] All DTO properties have description and example values
- [ ] Swagger UI loads without errors
- [ ] OpenAPI spec is valid JSON
- [ ] E2E tests pass

## Troubleshooting

### Swagger UI Not Loading
1. Check backend is running on port 3001
2. Verify `main.ts` has SwaggerModule setup
3. Check console for errors

### Missing Endpoints in Documentation
1. Verify controller has @ApiTags
2. Verify methods have @ApiOperation
3. Check for missing @Controller decorator

### Schema Not Showing
1. Verify DTOs have @ApiProperty decorators
2. Check TypeScript compilation errors
3. Verify imports from @nestjs/swagger
