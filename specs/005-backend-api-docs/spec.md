# Feature Specification: Backend API Documentation Enhancement

**Feature Branch**: `005-backend-api-docs`  
**Created**: 2026-01-24  
**Status**: Draft  
**Input**: User description: "现在后端的api文档完全不行，完善代码里面的所有api定义" (The current backend API documentation is completely unusable, improve all API definitions in the code)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - API Discovery and Exploration (Priority: P1)

作为前端开发人员，我希望能够通过Swagger文档快速了解和探索所有API端点，这样我就不用去阅读后端源代码来理解如何使用API。

**Why this priority**: 前后端分离开发模式下，API文档是协作的基础。良好的文档能显著提升开发效率，减少沟通成本和调试时间。

**Independent Test**: Can be fully tested by opening `/api/docs` and verifying all endpoints are visible with complete information including parameters, request bodies, and response schemas.

**Acceptance Scenarios**:

1. **Given** API documentation is accessible at `/api/docs`, **When** a developer opens the Swagger UI, **Then** all 12 API controllers and their endpoints should be listed with proper grouping.
2. **Given** an endpoint is listed in Swagger UI, **When** the developer clicks on it, **Then** they should see complete documentation including HTTP method, path, parameters, request body schema, and example responses.
3. **Given** an endpoint has path parameters (e.g., `:id`), **When** viewing the documentation, **Then** each parameter should have a clear description and example value.
4. **Given** an endpoint accepts query parameters, **When** viewing the documentation, **Then** all query parameters should be listed with their types, whether they are required/optional, and descriptions.

---

### User Story 2 - API Integration Validation (Priority: P1)

作为前端开发人员，我希望能够根据API文档直接生成正确的请求代码，这样我就不用反复试错来搞清楚API的调用方式。

**Why this priority**: 良好的API文档应该能够支持代码生成工具（如Swagger Codegen、OpenAPI Generator），减少手动编写API调用代码的工作量和错误。

**Independent Test**: Can be fully tested by exporting OpenAPI spec from `/api/docs` and validating it can be consumed by code generation tools without errors.

**Acceptance Scenarios**:

1. **Given** the OpenAPI specification is available at `/api/docs-json`, **When** a code generation tool is run, **Then** it should successfully generate client SDKs without schema validation errors.
2. **Given** a request body is required for an endpoint, **When** viewing the schema, **Then** it should have complete field definitions with types, required/optional status, and descriptions.
3. **Given** an endpoint returns a complex object, **When** viewing the response schema, **Then** all nested properties should be fully documented with their types.

---

### User Story 3 - API Error Handling (Priority: P2)

作为集成开发人员，我希望能够通过文档了解所有可能的错误响应，这样我就能在我的应用中正确处理各种错误情况。

**Why this priority**: 全面的错误响应文档能帮助开发者构建更健壮的应用，减少生产环境中的错误和调试时间。

**Independent Test**: Can be fully tested by verifying that each API endpoint documents all possible error responses (400, 401, 403, 404, 500) with their schemas and examples.

**Acceptance Scenarios**:

1. **Given** an endpoint that validates input, **When** invalid data is sent, **Then** the documentation should show the 400 Bad Request response schema with validation error details.
2. **Given** an endpoint that requires authentication, **When** a request is made without credentials, **Then** the documentation should show the 401 Unauthorized response.
3. **Given** an endpoint that requires admin role, **When** a regular user accesses it, **Then** the documentation should show the 403 Forbidden response.
4. **Given** an endpoint that may return 404 Not Found, **When** viewing the documentation, **Then** the error schema should show what fields are returned (e.g., statusCode, message, error).

---

### User Story 4 - API Testing and Exploration (Priority: P2)

作为QA测试人员，我希望能够在Swagger UI中直接测试API端点，这样我就能快速验证API的功能是否符合预期。

**Why this priority**: Swagger UI的 "Try it out" 功能能让测试人员和开发者快速验证API行为，无需编写测试代码。

**Independent Test**: Can be fully tested by using the "Try it out" feature in Swagger UI for at least 5 different endpoints and verifying that the requests execute successfully with proper authentication.

**Acceptance Scenarios**:

1. **Given** an endpoint is documented in Swagger UI, **When** the "Try it out" button is clicked, **Then** the request form should pre-populate with example values.
2. **Given** an endpoint requires authentication, **When** testing in Swagger UI, **Then** there should be a way to provide/authorize with a JWT token.
3. **Given** an endpoint accepts complex request body, **When** testing, **Then** the form should have appropriate input controls for all fields.

---

### User Story 5 - Multi-Language Support (Priority: P3)

作为非英语母语的中国开发人员，我希望API文档支持中文描述，这样我就能更快速地理解API的功能和使用方法。

**Why this priority**: 项目代码和注释主要是中文，API文档使用中文描述能保持一致性，降低团队学习成本。

**Independent Test**: Can be fully tested by verifying that all endpoint summaries, descriptions, and parameter descriptions are written in Chinese (中文).

**Acceptance Scenarios**:

1. **Given** all API endpoints, **When** viewing the Swagger documentation, **Then** all @ApiOperation summaries should be in Chinese.
2. **Given** all DTO properties, **When** viewing the schema, **Then** all @ApiProperty descriptions should be in Chinese.
3. **Given** all error responses, **When** viewing the documentation, **Then** error descriptions should be in Chinese.

---

### Edge Cases

- **Pagination endpoints**: How does the system document pagination parameters (offset/limit, page/pageSize)? What does the paginated response look like?
- **Authentication required**: All endpoints except auth and setup require JWT - how is this documented for consumers?
- **Tenant isolation**: Multi-tenant system - how is tenant context documented in the API?
- **Soft delete**: How does the API handle deleted records? Are they filtered out by default?
- **Rate limiting**: Are there any rate limits documented? If not, should we add this?
- **Versioning**: API is at `/api/v1/` - how is this documented and should we add version deprecation notices?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide complete Swagger/OpenAPI documentation accessible at `/api/docs` for all 12 backend controllers.
- **FR-002**: System MUST document all HTTP methods (GET, POST, PUT, DELETE, PATCH) with proper path definitions.
- **FR-003**: System MUST add @ApiTags to all controllers for proper grouping in Swagger UI.
- **FR-004**: System MUST add @ApiOperation with Chinese summaries for every endpoint.
- **FR-005**: System MUST add @ApiParam decorators for all path parameters (e.g., `:id`, `:code`, `:currencyCode`).
- **FR-006**: System MUST add @ApiQuery decorators for all query parameters (e.g., `offset`, `limit`, `date_from`, `date_to`).
- **FR-007**: System MUST add @ApiResponse decorators documenting success responses (200, 201, 204).
- **FR-008**: System MUST add @ApiResponse decorators documenting error responses (400, 401, 403, 404, 500) with schemas.
- **FR-009**: System MUST add @ApiBearerAuth to all protected endpoints (all except auth and setup).
- **FR-010**: System MUST add @ApiProperty decorators to all DTO properties for request body schemas.
- **FR-011**: System MUST add @ApiPropertyOptional decorators to all optional DTO properties.
- **FR-012**: System MUST provide example values for all @ApiProperty and @ApiPropertyOptional fields.
- **FR-013**: System MUST create missing DTOs for endpoints currently using `any` type (e.g., journal, budgets, admin).
- **FR-014**: System MUST create response DTOs/wrappers for consistent API response formats.
- **FR-015**: System MUST update main.ts Swagger configuration to include better metadata (description, terms, contact).

### Key Entities

- **Controller**: REST endpoint container with @ApiTags grouping, 12 existing controllers
- **DTO (Data Transfer Object)**: Request/response data schema with @ApiProperty decorators
- **Response Wrapper**: Standard API response format `{ success: boolean, data?: any, message?: string }`
- **Pagination Response**: Standard paginated format `{ items: [], total: number, offset: number, limit: number }`
- **Error Response**: Standard error format `{ statusCode: number, message: string, error: string }`

### Controllers to Document (12 Total)

1. `auth.controller.ts` - Authentication endpoints (login, register, profile)
2. `accounts.controller.ts` - Account CRUD + tree + balance
3. `journal.controller.ts` - Journal entries CRUD (currently minimal documentation)
4. `budgets.controller.ts` - Budget management (currently minimal documentation)
5. `currencies.controller.ts` - Currency management
6. `rates.controller.ts` - Exchange rates operations
7. `providers.controller.ts` - Rate provider management (already has some docs)
8. `query.controller.ts` - Balance and transaction queries
9. `reports.controller.ts` - Financial reports (balance sheet, income statement)
10. `export.controller.ts` - CSV export functionality
11. `admin.controller.ts` - Admin panel (519 lines, completely undocumented)
12. `tenants.controller.ts` - Tenant management
13. `setup.controller.ts` - System initialization (public endpoints)

### DTOs to Create/Update

**Create New DTOs:**
- `journal.dto.ts`: CreateJournalEntryDto, UpdateJournalEntryDto, JournalEntryResponseDto
- `budget.dto.ts`: CreateBudgetDto, UpdateBudgetDto, BudgetResponseDto
- `admin.dto.ts`: Various admin operation DTOs
- `pagination.dto.ts`: Standard pagination query parameters
- `error.dto.ts`: Error response schema

**Update Existing DTOs:**
- `account.dto.ts`: Add missing @ApiPropertyOptional, examples
- `currency.dto.ts`: Add missing response DTO
- `provider.dto.ts`: Add response DTOs
- `export-filters.dto.ts`: Add complete @ApiProperty decorators

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 12 controllers MUST have @ApiTags, @ApiBearerAuth (where applicable), and @ApiOperation on every endpoint.
- **SC-002**: All endpoints with path parameters MUST have @ApiParam with description and example.
- **SC-003**: All endpoints with query parameters MUST have @ApiQuery with type and description.
- **SC-004**: All endpoints MUST have @ApiResponse documenting at least the 200 success response with schema.
- **SC-005**: All endpoints MUST document error responses: 400 (validation), 401 (unauthorized), 403 (forbidden), 404 (not found).
- **SC-006**: All DTO properties MUST have @ApiProperty or @ApiPropertyOptional with description and example.
- **SC-007**: All documentation text (summaries, descriptions) MUST be in Chinese (中文).
- **SC-008**: OpenAPI spec MUST be valid and load without errors in Swagger UI.
- **SC-009**: Code generation tools SHOULD be able to parse the OpenAPI spec without errors.
- **SC-010**: No endpoint should use `any` type for request/response bodies - proper DTOs MUST be created.
- **SC-011**: Swagger UI SHOULD show proper grouping by @ApiTags and readable endpoint names.
- **SC-012**: Response schemas SHOULD show all nested objects with their properties.

### Technical Constraints

- MUST use @nestjs/swagger package decorators
- MUST maintain backward compatibility with existing API contracts
- MUST NOT change any API endpoint paths or behavior
- MUST NOT remove any existing functionality
- MUST use Chinese language for all documentation text
- MUST follow NestJS Swagger best practices

### Out of Scope

- Creating interactive tutorials in Swagger UI
- Adding API versioning beyond current `/api/v1/` prefix
- Implementing rate limiting documentation
- Adding OAuth2 flow documentation (stick to Bearer token)
- Creating client SDK generation pipeline

## Clarifications

### Session 2026-01-24

- Q: Entity Field Structure → A: B - Full entity matching: Mirror all fields from the TypeORM entities exactly
- Q: Documentation Performance Target → A: C - No specific target: Just ensure it loads without errors, don't measure performance
