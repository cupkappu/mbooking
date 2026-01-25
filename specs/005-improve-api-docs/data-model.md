# Data Model: Backend API Documentation Enhancement

**Note**: This feature does not modify database entities. It creates DTOs for API documentation purposes.

## DTOs to Create

### journal.dto.ts

**Location**: `backend/src/journal/dto/journal.dto.ts`

#### CreateJournalEntryDto
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date | Date | Yes | Journal entry date |
| description | string | Yes | Entry description |
| reference | string | No | Reference number/doc ID |
| lines | JournalLineDto[] | Yes | At least 2 lines for double-entry |

#### JournalLineDto
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| account_id | string | Yes | Account UUID |
| debit | decimal | No | Debit amount (0 if credit) |
| credit | decimal | No | Credit amount (0 if debit) |
| currency | string | Yes | Currency code (ISO 4217) |
| description | string | No | Line description |

#### UpdateJournalEntryDto
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date | Date | No | Journal entry date |
| description | string | No | Entry description |
| reference | string | No | Reference number/doc ID |
| lines | JournalLineDto[] | No | At least 2 lines for double-entry |

### budgets.dto.ts

**Location**: `backend/src/budgets/dto/budget.dto.ts`

#### CreateBudgetDto
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Budget name |
| amount | decimal | Yes | Budget amount |
| currency | string | Yes | Currency code |
| start_date | Date | Yes | Budget period start |
| end_date | Date | Yes | Budget period end |
| account_ids | string[] | No | Associated account IDs |
| category_ids | string[] | No | Associated category IDs |

#### UpdateBudgetDto
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Budget name |
| amount | decimal | No | Budget amount |
| is_active | boolean | No | Whether budget is active |

### pagination.dto.ts

**Location**: `backend/src/common/dto/pagination.dto.ts`

#### PaginationQueryDto
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| offset | number | No | 0 | Pagination offset |
| limit | number | No | 20 | Items per page |

### error.dto.ts

**Location**: `backend/src/common/dto/error.dto.ts`

#### ErrorResponseDto
| Field | Type | Description |
|-------|------|-------------|
| statusCode | number | HTTP status code |
| message | string | Error message |
| error | string | Error name |

#### SuccessResponseDto
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Operation success status |
| data | any | Response data |
| message | string | Optional message |

## DTOs to Update

### account.dto.ts

**Location**: `backend/src/accounts/dto/account.dto.ts`

**Changes**: Add @ApiPropertyOptional and examples to UpdateAccountDto fields already present.

### currency.dto.ts

**Location**: `backend/src/currencies/dto/currency.dto.ts`

**Changes**: Already has @ApiProperty decorators. Consider adding response DTOs.

### provider.dto.ts

**Location**: `backend/src/providers/dto/provider.dto.ts`

**Changes**: Already has @ApiProperty decorators. Consider adding response DTOs.

### export-filters.dto.ts

**Location**: `backend/src/export/dto/export-filters.dto.ts`

**Changes**: Add complete @ApiProperty decorators for all filter fields.

## Existing DTOs (Reference)

These DTOs exist and should be used as templates:

1. `account.dto.ts` - Complete pattern with @ApiProperty, @ApiPropertyOptional
2. `currency.dto.ts` - Complete pattern
3. `provider.dto.ts` - Complete pattern with enums

## Validation Rules

All DTOs should use class-validator decorators:

- `@IsString()` for string fields
- `@IsNotEmpty()` for required strings
- `@IsOptional()` for optional fields
- `@IsEnum()` for enum fields
- `@IsNumber()` for numeric fields
- `@Min()`, `@Max()` for numeric constraints
- `@IsDate()` for date fields
- `@IsArray()` for array fields
- `@ValidateNested()` for nested objects
