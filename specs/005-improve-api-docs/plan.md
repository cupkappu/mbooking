# Implementation Plan: Backend API Documentation Enhancement

**Branch**: `005-backend-api-docs` | **Date**: 2026-01-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-backend-api-docs/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature enhances backend API documentation by adding comprehensive Swagger/OpenAPI annotations to all 12 NestJS controllers. The implementation focuses on adding proper `@nestjs/swagger` decorators including `@ApiTags`, `@ApiOperation`, `@ApiParam`, `@ApiQuery`, `@ApiResponse`, and `@ApiBearerAuth` to all endpoints. All documentation text will be in Chinese. Missing DTOs will be created for endpoints currently using `any` type, and response schemas will be documented for consistent API contracts.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend strict mode, backend relaxed tsconfig)  
**Primary Dependencies**: NestJS 10, @nestjs/swagger, TypeORM, PostgreSQL 15  
**Storage**: PostgreSQL 15 (documented entities only, no schema changes)  
**Testing**: Jest (backend), Playwright (E2E)  
**Target Platform**: Linux server (Docker container)  
**Project Type**: Web application (Next.js 14 frontend + NestJS 10 backend)  
**Performance Goals**: Documentation loading should not impact API performance; OpenAPI spec generation should complete within reasonable time  
**Constraints**: MUST maintain backward compatibility with existing API contracts; MUST NOT change endpoint paths or behavior; MUST use Chinese language for all documentation  
**Scale/Scope**: 12 controllers, ~15 DTOs to create/update, ~50 endpoints to document

## Constitution Check (Post-Design)

*GATE: Re-check after Phase 1 design*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Financial Integrity | ✅ N/A | This is documentation-only, no financial calculations |
| II. Tenant Isolation | ✅ N/A | Documentation doesn't affect tenant isolation |
| III. Type Safety | ✅ Pass | Creating proper DTOs instead of using `any` improves type safety |
| IV. Validation & Data Integrity | ✅ Pass | Creating DTOs with class-validator for better validation |
| V. Plugin System Integrity | ✅ N/A | Not applicable to documentation |
| VI. Code Quality Standards | ✅ Pass | Following SRP by separating documentation concerns |
| VII. Testing Standards | ✅ Pass | Swagger UI can be verified in E2E tests |
| VIII. UX Consistency | ✅ N/A | Backend documentation, no UI changes |
| IX. Performance Requirements | ✅ Pass | Documentation doesn't impact runtime performance |

**Result**: ✅ ALL GATES PASSED - Ready for implementation

## Project Structure

### Documentation (this feature)

```text
specs/005-backend-api-docs/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
├── tasks.md             # Phase 2 output (/speckit.tasks command)
└── checklists/
    └── requirements.md  # Created during specification phase
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── {feature}/
│   │   ├── {feature}.controller.ts    # Add @Api decorators
│   │   ├── dto/
│   │   │   ├── {feature}.dto.ts       # Create/update DTOs
│   │   │   └── {feature}-response.dto.ts  # Response DTOs
│   │   └── {feature}.spec.ts          # Update tests if needed
│   └── main.ts                        # Update Swagger config
```

**Structure Decision**: Backend-only changes following existing NestJS module pattern. Each controller gets enhanced with Swagger decorators, and DTOs are created/updated in the existing `dto/` subdirectory of each feature module.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

---

## Phase 0: Research

### Technical Context Unknowns

The following unknowns were identified and researched:

1. **NestJS Swagger Best Practices**: Standard patterns for @nestjs/swagger decorators across multiple controllers
2. **DTO Naming Conventions**: Consistent naming for request/response DTOs in this codebase
3. **Error Response Schemas**: Standard error format used across the API

### Research Findings

#### Decision 1: NestJS Swagger Decorator Patterns

**Chosen**: Standard @nestjs/swagger decorator set with Chinese summaries

**Rationale**: The codebase already uses @nestjs/swagger in some controllers (providers, currencies). Following established patterns ensures consistency.

**Alternatives Considered**:
- Using OpenAPI schema directly (rejected - less NestJS-idiomatic)
- Using manual OpenAPI spec YAML files (rejected - harder to maintain)

#### Decision 2: DTO Structure

**Chosen**: Separate Create/Update/Response DTOs for each entity

**Rationale**: Matches existing pattern in account.dto.ts and currency.dto.ts. Provides clear API contract.

**Alternatives Considered**:
- Single DTO for all operations (rejected - confuses required/optional fields)
- Using entities directly in API (rejected - violates Constitution Principle IV)

#### Decision 3: Error Response Format

**Chosen**: Standard NestJS exception response format with statusCode, message, error

**Rationale**: Already implemented in existing code. Consistent with standard HTTP error responses.

---

## Phase 1: Design

### Data Model

No database changes. This feature documents existing entities and creates DTOs for API contracts.

### API Contracts

See `/contracts/` directory for OpenAPI specifications.

### Quickstart

1. Review existing controller patterns in `backend/src/accounts/accounts.controller.ts`
2. Add Swagger decorators following pattern in `backend/src/providers/providers.controller.ts`
3. Create/update DTOs using `backend/src/accounts/dto/account.dto.ts` as template
4. Verify documentation at `http://localhost:3001/api/docs`

---

## Phase 2: Implementation Planning

*To be completed by `/speckit.tasks` command*

- [ ] Create DTOs for journal entries (journal.dto.ts)
- [ ] Create DTOs for budgets (budget.dto.ts)
- [ ] Create DTOs for admin operations (admin.dto.ts)
- [ ] Update all controllers with @Api decorators
- [ ] Verify Swagger UI loads correctly
- [ ] Run E2E tests to verify no regressions
