# API Contracts Summary

This directory contains OpenAPI specification files for backend API endpoints.

## Files

| File | Controller | Endpoints | Status |
|------|------------|-----------|--------|
| `journal.yaml` | journal.controller.ts | 4 | Sample Complete |
| `accounts.yaml` | accounts.controller.ts | 7 | Template |
| `budgets.yaml` | budgets.controller.ts | 6 | Template |
| `auth.yaml` | auth.controller.ts | 3 | Template |
| `admin.yaml` | admin.controller.ts | 25+ | Template |

## Usage

These YAML files serve as:
1. **Reference documentation** for API contracts
2. **Code generation input** for client SDKs
3. **Validation reference** for verifying decorator completeness

## Verification

To verify implementation matches contracts:

```bash
# Generate OpenAPI spec from running server
curl http://localhost:3001/api/docs-json > generated-spec.json

# Compare with expected contracts (manual review)
diff generated-spec.json contracts/journal.yaml
```

## Contract Structure

Each contract file follows OpenAPI 3.0.0 specification:

```yaml
openapi: 3.0.0
info:
  title: Multi-Currency Accounting API - {Module}
  version: 1.0.0
paths:
  /api/v1/{resource}:
    get:
      tags: [{模块名称}]
      summary: {中文描述}
      parameters: []
      responses: {}
```

## Key Elements

### Tags (分组)
- Used for grouping endpoints in Swagger UI
- Should be in Chinese per requirements
- Examples: `日记账`, `账户`, `预算`, `管理员`

### Summaries (摘要)
- Brief Chinese description of endpoint action
- Max 50 characters recommended
- Examples: `获取日记账条目列表`, `创建预算`

### Parameters (参数)
- Path parameters: `@ApiParam` with example
- Query parameters: `@ApiQuery` with type and description
- Request body: `@ApiBody` or implicit from DTO

### Responses (响应)
- Success: 200, 201, 204 with schema
- Client errors: 400, 401, 403, 404
- Server errors: 500

## Response Schemas

### Success Response (List)
```yaml
{
  "type": "object",
  "properties": {
    "items": { "type": "array", "items": { "$ref": "#/components/schemas/Entity" } },
    "total": { "type": "number" },
    "offset": { "type": "number" },
    "limit": { "type": "number" }
  }
}
```

### Success Response (Single)
```yaml
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": { "$ref": "#/components/schemas/Entity" }
  }
}
```

### Error Response
```yaml
{
  "type": "object",
  "properties": {
    "statusCode": { "type": "number" },
    "message": { "type": "string" },
    "error": { "type": "string" }
  }
}
```
