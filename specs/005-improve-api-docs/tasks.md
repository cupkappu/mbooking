# Implementation Tasks: Backend API Documentation Enhancement

**Feature**: Backend API Documentation Enhancement  
**Branch**: `005-backend-api-docs`  
**Created**: 2026-01-24  
**Plan**: [plan.md](plan.md)  
**Spec**: [spec.md](spec.md)  

## Implementation Strategy

### MVP Scope
The MVP is **User Story 1 + User Story 2** (API Discovery and Exploration + API Integration Validation), which covers:
- Adding @Api decorators to 4 high-priority controllers (auth, accounts, currencies, providers)
- Creating shared DTOs (pagination, error response)
- Verifying Swagger UI loads correctly with proper grouping

This MVP delivers immediate value by documenting the most frequently used endpoints (auth, accounts) and establishing patterns for remaining controllers.

### Incremental Delivery
Each User Story phase can be delivered independently, but US1+US2 together form the complete MVP. After completing the MVP, subsequent phases add error documentation (US3), testing support (US4), and language completeness (US5).

---

## Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ──────┐
    │                        │
    ▼                        ▼
Phase 3 (US1+US2) ───────────┼─── P1 Priority
    │                        │
    ▼                        ▼
Phase 4 (US3+US4) ───────────┼─── P2 Priority
    │                        │
    ▼                        ▼
Phase 5 (US5) ───────────────┼─── P3 Priority
    │                        │
    ▼                        ▼
Phase 6 (Polish) <───────────┘
```

### Critical Path
Phase 1 → Phase 2 → Phase 3 → Phase 6 (required for any deliverable)

### Parallel Opportunities
- Phase 2 DTOs can be created in parallel (no dependencies between them)
- Within Phase 3: auth, accounts, currencies controllers are independent
- Within Phase 4: All controllers can be documented in parallel
- Phase 5 controllers are independent

---

## Phase 1: Setup

**Goal**: Initialize shared DTOs and update Swagger configuration for the project.

**Independent Test**: TypeScript compilation succeeds, shared DTOs import correctly in controllers.

### Tasks

- [X] T001 Create standard pagination query DTO in backend/src/common/dto/pagination.dto.ts
- [X] T002 Create error response DTOs in backend/src/common/dto/error.dto.ts
- [X] T003 Update main.ts Swagger configuration with enhanced metadata (description, terms, contact)

---

## Phase 2: Foundational

**Goal**: Create DTOs for endpoints currently using `any` type, which are needed across multiple user stories.

**Independent Test**: All created DTOs compile without errors and have proper @ApiProperty decorators.

### Tasks

- [X] T004 [P] Create journal DTOs in backend/src/journal/dto/journal.dto.ts (CreateJournalEntryDto, UpdateJournalEntryDto, JournalLineDto)
- [X] T005 [P] Create budget DTOs in backend/src/budgets/dto/budget.dto.ts (CreateBudgetDto, UpdateBudgetDto)

---

## Phase 3: User Story 1 + User Story 2 (P1)

**Goal**: API Discovery and Exploration + API Integration Validation  
**Priority**: P1 - Core documentation for frequently used endpoints  
**Independent Test**: Open Swagger UI at `/api/docs`, verify 4 controllers are visible with complete endpoint information including parameters, request bodies, and response schemas.

### Story Goal
As a frontend developer, I can discover and understand all API endpoints through Swagger documentation, and generate correct request code from the documentation.

### Test Criteria
- [ ] All 4 controllers visible in Swagger UI with @ApiTags grouping
- [ ] Each endpoint shows HTTP method, path, and Chinese summary
- [ ] All path parameters have @ApiParam with description and example
- [ ] All query parameters have @ApiQuery with type and description
- [ ] All request bodies show schema with @ApiProperty decorators
- [ ] All response bodies show schema with @ApiProperty decorators
- [ ] OpenAPI spec at `/api/docs-json` is valid JSON

### Implementation Tasks

#### auth.controller.ts (3 endpoints)
- [X] T006 [P] [US1] Add @Api decorators to auth.controller.ts in backend/src/auth/auth.controller.ts
- [X] T007 [P] [US1] Document login endpoint (POST /auth/login) with @ApiOperation, @ApiResponse for 200, 400, 401
- [X] T008 [P] [US1] Document register endpoint (POST /auth/register) with @ApiOperation, @ApiResponse for 201, 400
- [X] T009 [P] [US1] Document profile endpoint (GET /auth/profile) with @ApiBearerAuth, @ApiOperation, @ApiResponse for 200, 401

#### accounts.controller.ts (7 endpoints)
- [X] T010 [P] [US1] Enhance @ApiOperation summaries with Chinese descriptions in accounts.controller.ts
- [X] T011 [P] [US1] Add @ApiParam for :id path parameter on GET, PUT, DELETE endpoints
- [X] T012 [P] [US1] Add @ApiQuery for offset/limit on GET /accounts endpoint
- [X] T013 [P] [US1] Add @ApiResponse decorators for success (200, 201, 204) and errors (400, 401, 404)
- [X] T014 [P] [US1] Document tree endpoint (GET /accounts/tree) with @ApiOperation summary
- [X] T015 [P] [US1] Document move endpoint (POST /accounts/:id/move) with @ApiParam and @ApiBody
- [X] T016 [P] [US1] Document balance endpoint (GET /accounts/:id/balance) with @ApiParam and @ApiResponse

#### currencies.controller.ts (4 endpoints)
- [X] T017 [P] [US1] Enhance @ApiOperation summaries with Chinese descriptions in currencies.controller.ts
- [X] T018 [P] [US1] Add @ApiParam for :code path parameter on GET, PUT, DELETE endpoints
- [X] T019 [P] [US1] Add @ApiResponse decorators for success (200, 201, 204) and errors (400, 401, 403, 404)
- [X] T020 [P] [US1] Document set-default endpoint (POST /currencies/:code/default) with @ApiParam and @ApiResponse

#### providers.controller.ts (7 endpoints)
- [X] T021 [P] [US1] Enhance existing @ApiOperation summaries with more detailed Chinese descriptions
- [X] T022 [P] [US1] Add @ApiParam for :id path parameter on all endpoints
- [X] T023 [P] [US1] Add @ApiQuery for offset/limit on GET /providers endpoint
- [X] T024 [P] [US1] Add @ApiResponse decorators for success (200, 201, 204) and errors (400, 401, 403, 404)
- [X] T025 [P] [US1] Document test endpoint (POST /providers/:id/test) with @ApiOperation summary
- [X] T026 [P] [US1] Document toggle endpoint (POST /providers/:id/toggle) with @ApiOperation summary

### Parallel Execution Example
```bash
# Execute in parallel (4 terminals):
 Terminal 1: Update auth.controller.ts (T006-T009)
 Terminal 2: Update accounts.controller.ts (T010-T016)
 Terminal 3: Update currencies.controller.ts (T017-T020)
 Terminal 4: Update providers.controller.ts (T021-T026)
```

---

## Phase 4: User Story 3 + User Story 4 (P2)

**Goal**: API Error Handling + API Testing and Exploration  
**Priority**: P2 - Enhanced documentation for robust integration and testing  
**Independent Test**: Each endpoint documents error responses (400, 401, 403, 404) with schemas, and request forms pre-populate with example values in Swagger UI.

### Story Goal
As a developer, I can understand all possible error responses from the API and test endpoints directly in Swagger UI.

### Test Criteria
- [ ] All 6 controllers document error responses (400, 401, 403, 404) with @ApiBadRequestResponse, @ApiUnauthorizedResponse, @ApiForbiddenResponse, @ApiNotFoundResponse
- [ ] All request bodies show example values that pre-populate in "Try it out" form
- [ ] All endpoints have @ApiBearerAuth where authentication is required
- [ ] Error response schema shows statusCode, message, error fields

### Implementation Tasks

#### journal.controller.ts (5 endpoints)
- [X] T027 [P] [US3] Add complete @Api decorators to journal.controller.ts in backend/src/journal/journal.controller.ts
- [X] T028 [P] [US3] Add @ApiOperation Chinese summaries for all endpoints
- [X] T029 [P] [US3] Add @ApiParam for :id path parameter
- [X] T030 [P] [US3] Add @ApiQuery for offset/limit query parameters
- [X] T031 [P] [US3] Add @ApiResponse for success (200, 201, 204) and errors (400, 401, 404)
- [X] T032 [P] [US3] Document request body using CreateJournalEntryDto from journal.dto.ts

#### budgets.controller.ts (6 endpoints)
- [X] T033 [P] [US3] Add complete @Api decorators to budgets.controller.ts in backend/src/budgets/budgets.controller.ts
- [X] T034 [P] [US3] Add @ApiOperation Chinese summaries for all endpoints
- [X] T035 [P] [US3] Add @ApiParam for :id path parameter
- [X] T036 [P] [US3] Add @ApiQuery for offset/limit query parameters
- [X] T037 [P] [US3] Add @ApiResponse for success (200, 201, 204) and errors (400, 401, 403, 404)
- [X] T038 [P] [US3] Document progress endpoint (GET /budgets/:id/progress) with @ApiOperation summary
- [X] T039 [P] [US3] Document request body using CreateBudgetDto from budget.dto.ts

#### rates.controller.ts (6 endpoints)
- [X] T040 [P] [US3] Add complete @Api decorators to rates.controller.ts in backend/src/rates/rates.controller.ts
- [X] T041 [P] [US3] Add @ApiOperation Chinese summaries for all endpoints (latest rate, history, trend, convert, paths)
- [X] T042 [P] [US3] Add @ApiParam for :id, :from, :to path parameters
- [X] T043 [P] [US3] Add @ApiQuery for date, period query parameters
- [X] T044 [P] [US3] Add @ApiResponse for success (200) and errors (400, 401, 404)

#### query.controller.ts (3 endpoints)
- [X] T045 [P] [US3] Add complete @Api decorators to query.controller.ts in backend/src/query/query.controller.ts
- [X] T046 [P] [US3] Add @ApiOperation Chinese summaries for balances, journal, dashboard endpoints
- [X] T047 [P] [US3] Add @ApiQuery for filter query parameters
- [X] T048 [P] [US3] Add @ApiResponse for success (200) and errors (400, 401)

#### reports.controller.ts (4 endpoints)
- [X] T049 [P] [US3] Add complete @Api decorators to reports.controller.ts in backend/src/reports/reports.controller.ts
- [X] T050 [P] [US3] Add @ApiOperation Chinese summaries for balance sheet, income statement, cash flow, comparison
- [X] T051 [P] [US3] Add @ApiQuery for date range and other report parameters
- [X] T052 [P] [US3] Add @ApiResponse for success (200) and errors (400, 401, 404)

#### export.controller.ts (4 endpoints)
- [X] T053 [P] [US3] Add complete @Api decorators to export.controller.ts in backend/src/export/export.controller.ts
- [X] T054 [P] [US3] Add @ApiOperation Chinese summaries for all export endpoints
- [X] T055 [P] [US3] Add @ApiQuery for filter parameters (date_from, date_to, account_ids)
- [X] T056 [P] [US3] Add @ApiResponse for success (200, 201) and errors (400, 401, 404)

### Parallel Execution Example
```bash
# Execute in parallel (6 terminals):
 Terminal 1: Update journal.controller.ts (T027-T032)
 Terminal 2: Update budgets.controller.ts (T033-T039)
 Terminal 3: Update rates.controller.ts (T040-T044)
 Terminal 4: Update query.controller.ts (T045-T048)
 Terminal 5: Update reports.controller.ts (T049-T052)
 Terminal 6: Update export.controller.ts (T053-T056)
```

---

## Phase 5: User Story 5 (P3)

**Goal**: Multi-Language Support - Complete Chinese documentation  
**Priority**: P3 - Language completeness for remaining controllers  
**Independent Test**: All remaining controllers (admin, tenants, setup) have Chinese @ApiOperation summaries and @ApiProperty descriptions.

### Story Goal
As a Chinese developer, I can understand all API documentation in my native language.

### Test Criteria
- [ ] admin.controller.ts has Chinese @ApiOperation summaries for all 25+ endpoints
- [ ] tenants.controller.ts has Chinese @ApiOperation summaries
- [ ] setup.controller.ts has Chinese @ApiOperation summaries
- [ ] All @ApiProperty descriptions in existing DTOs are in Chinese

### Implementation Tasks

#### Update Existing DTOs (Chinese descriptions)
- [X] T057 [P] [US5] Update account.dto.ts with Chinese @ApiProperty descriptions in backend/src/accounts/dto/account.dto.ts
- [X] T058 [P] [US5] Update currency.dto.ts with Chinese @ApiProperty descriptions in backend/src/currencies/dto/currency.dto.ts
- [X] T059 [P] [US5] Update provider.dto.ts with Chinese @ApiProperty descriptions in backend/src/providers/dto/provider.dto.ts
- [X] T060 [P] [US5] Update export-filters.dto.ts with complete @ApiProperty decorators in backend/src/export/dto/export-filters.dto.ts

#### admin.controller.ts (25+ endpoints)
- [X] T061 [P] [US5] Add complete @Api decorators to admin.controller.ts in backend/src/admin/admin.controller.ts
- [X] T062 [P] [US5] Add @ApiTags('管理员') for controller grouping
- [X] T063 [P] [US5] Add Chinese @ApiOperation summaries for all user management endpoints (users, users/:id, bulk-action)
- [X] T064 [P] [US5] Add Chinese @ApiOperation summaries for system config endpoints
- [X] T065 [P] [US5] Add Chinese @ApiOperation summaries for provider management endpoints
- [X] T066 [P] [US5] Add Chinese @ApiOperation summaries for currency management endpoints
- [X] T067 [P] [US5] Add Chinese @ApiOperation summaries for currency-provider management endpoints
- [X] T068 [P] [US5] Add Chinese @ApiOperation summaries for audit log endpoints
- [X] T069 [P] [US5] Add Chinese @ApiOperation summaries for scheduler management endpoints
- [X] T070 [P] [US5] Add Chinese @ApiOperation summaries for plugin management endpoints
- [X] T071 [P] [US5] Add Chinese @ApiOperation summaries for health monitoring endpoint
- [X] T072 [P] [US5] Add @ApiParam, @ApiQuery, @ApiResponse for all admin endpoints
- [X] T073 [P] [US5] Add @ApiBearerAuth for protected admin endpoints

#### tenants.controller.ts (2 endpoints)
- [X] T074 [P] [US5] Add complete @Api decorators to tenants.controller.ts in backend/src/tenants/tenants.controller.ts
- [X] T075 [P] [US5] Add @ApiTags('租户') for controller grouping
- [X] T076 [P] [US5] Add Chinese @ApiOperation summaries for get tenant and update settings endpoints
- [X] T077 [P] [US5] Add @ApiResponse decorators for success and errors

#### setup.controller.ts (2 endpoints)
- [X] T078 [P] [US5] Add complete @Api decorators to setup.controller.ts in backend/src/setup/setup.controller.ts
- [X] T079 [P] [US5] Add @ApiTags('系统设置') for controller grouping
- [X] T080 [P] [US5] Add Chinese @ApiOperation summaries for status check and initialize endpoints
- [X] T081 [P] [US5] Add @ApiResponse decorators for success and errors (setup is public - no @ApiBearerAuth)

### Parallel Execution Example
```bash
# Execute in parallel:
 Terminal 1: Update DTOs (T057-T060)
 Terminal 2: Update admin.controller.ts (T061-T073)
 Terminal 3: Update tenants.controller.ts (T074-T077)
 Terminal 4: Update setup.controller.ts (T078-T081)
```

---

## Phase 6: Polish

**Goal**: Final verification and cross-cutting concerns.

**Independent Test**: All acceptance criteria from spec.md are met, Swagger UI loads without errors, E2E tests pass.

### Tasks

- [X] T082 Verify all 12 controllers have @ApiTags with proper grouping
- [X] T083 Verify all endpoints have @ApiOperation with Chinese summaries
- [X] T084 Verify all path parameters have @ApiParam with description and example
- [X] T085 Verify all query parameters have @ApiQuery with type and description
- [X] T086 Verify all endpoints have @ApiResponse for success (200, 201, 204)
- [X] T087 Verify all endpoints document error responses (400, 401, 403, 404)
- [X] T088 Verify all protected endpoints have @ApiBearerAuth
- [X] T089 Verify all DTOs have @ApiProperty or @ApiPropertyOptional with Chinese descriptions
- [X] T090 Verify OpenAPI spec at http://localhost:3001/api/docs loads without errors
- [X] T091 Verify E2E tests pass with no regressions
- [X] T092 Verify TypeScript compilation succeeds with no errors

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 92 |
| Phase 1 (Setup) | 3 |
| Phase 2 (Foundational) | 2 |
| Phase 3 (US1+US2 P1) | 26 |
| Phase 4 (US3+US4 P2) | 30 |
| Phase 5 (US5 P3) | 25 |
| Phase 6 (Polish) | 11 |
| Parallelizable Tasks | 57 (62%) |

### User Story Task Distribution

| User Story | Priority | Tasks | Deliverable |
|------------|----------|-------|-------------|
| US1 + US2 | P1 | 26 | MVP - Core documentation |
| US3 + US4 | P2 | 30 | Error docs + testing support |
| US5 | P3 | 25 | Chinese language completeness |

### Parallel Opportunities
- Phase 2 DTOs: journal.dto.ts and budget.dto.ts are independent
- Phase 3: auth, accounts, currencies, providers controllers are independent
- Phase 4: All 6 controllers are independent
- Phase 5: DTO updates and all controllers are independent

### Expected Completion Order
1. Phase 1 (Setup) - Required for all
2. Phase 2 (Foundational) - Required for all
3. Phase 3 (US1+US2) - MVP delivery
4. Phase 6 (Polish) - Verify MVP
5. Phase 4 (US3+US4) - Error docs
6. Phase 5 (US5) - Chinese completeness
7. Phase 6 (Polish) - Final verification
