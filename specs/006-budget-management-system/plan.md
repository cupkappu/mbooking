# Implementation Plan: Budget Management System

**Branch**: `006-budget-management-system` | **Date**: 2026-01-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-budget-management-system/spec.md`

## Summary

Complete budget management system with periodic/non-periodic budgets, real-time progress tracking, multi-currency support, configurable alerts, variance analysis, and template system. Built on existing NestJS/TypeORM backend with new React/Next.js frontend components. Key integration points: journal entries (spending data), rates service (currency conversion), accounts (budget association).

## Technical Context

| Aspect | Value |
|--------|-------|
| **Language/Version** | TypeScript 5.x (Frontend strict, Backend relaxed tsconfig) |
| **Backend Dependencies** | NestJS 10, TypeORM 0.3.x, PostgreSQL 15 |
| **Frontend Dependencies** | Next.js 14 (App Router), React 18, TanStack Query 5, Tailwind CSS, shadcn/ui |
| **Storage** | PostgreSQL 15 with TypeORM entities, soft deletes, RLS |
| **Testing** | Jest (unit/integration), Playwright (E2E) |
| **Target Platform** | Web application (browser-based, responsive) |
| **Performance Goals** | API response < 500ms, progress update < 5min, alert delivery < 30s |
| **Constraints** | Multi-tenant RLS, Decimal types only, soft deletes, 1000 budgets/tenant |
| **Scale/Scope** | 1000 active budgets, 10000 historical alerts, multi-currency per tenant |

## Constitution Check

### GATE 1: Financial Integrity ✅ PASSED

| Requirement | Implementation |
|-------------|----------------|
| DECIMAL type for all monetary values | Entity fields: `amount`, `spent_amount`, `budget_amount`, `threshold_percent` all use `decimal(20, 4)` |
| Soft deletes only | All entities have `deleted_at` column; service uses `is_active = false` |
| Double-entry validation | Not directly applicable - budgets are tracking constructs, not ledger entries |
| Currency decimals | Fiat (2) and crypto (8) handled via rates service; budgets store with scale 4 |

### GATE 2: Tenant Isolation ✅ PASSED

| Requirement | Implementation |
|-------------|----------------|
| RLS on all tables | `tenant_id` column on Budget, BudgetAlert, BudgetTemplate |
| Query filters include tenant | Service layer uses `TenantContext.requireTenantId()` for all queries |
| Tenant middleware | Leverages existing `app.current_tenant_id` middleware |

### GATE 3: Type Safety ✅ PASSED

| Requirement | Implementation |
|-------------|----------------|
| No `any` type | Strict TypeScript in frontend; relaxed config in backend but following strict practices |
| No type suppression | No `@ts-ignore`, `as any`, or `@ts-expect-error` in new code |
| DTOs for API contracts | CreateBudgetDto, UpdateBudgetDto, ProgressQueryDto, etc. |

### GATE 4: Validation & Data Integrity ✅ PASSED

| Requirement | Implementation |
|-------------|----------------|
| class-validator DTOs | All endpoints use DTOs with validation decorators |
| No exposed entities | Service returns typed DTOs, never raw TypeORM entities |
| Input sanitization | Validation decorators handle sanitization |

### GATE 5: Code Quality ✅ PASSED

| Requirement | Implementation |
|-------------|----------------|
| Single responsibility | Separate services: BudgetsService, BudgetAlertService, BudgetTemplateService |
| Co-located tests | `*.spec.ts` alongside modules |
| Established patterns | Backend: `src/budgets/{feature}.{ts,service.ts,controller.ts}`; Frontend: `components/budgets/` |

### GATE 6: Testing Standards ✅ PASSED

| Requirement | Implementation |
|-------------|----------------|
| Unit tests for services | BudgetsService, BudgetAlertService, BudgetTemplateService tests |
| Co-located test files | `budgets.service.spec.ts` in same directory |
| CI-aware tests | `forbidOnly: !!process.env.CI`, conditional retries |

### GATE 7: User Experience ✅ PASSED

| Requirement | Implementation |
|-------------|----------------|
| shadcn/ui components | Use Card, Button, Form, Table, Progress, Badge, Alert, Toast |
| Immediate visual feedback | Loading states on buttons, toast notifications for success/error |
| Responsive design | Mobile-first Tailwind, work across viewports |
| Accessibility | Semantic HTML, ARIA labels, keyboard navigation |

### GATE 8: Performance ✅ PASSED

| Requirement | Implementation |
|-------------|----------------|
| Proper indexing | Indexes on `tenant_id`, `is_active`, `status`, `created_at` |
| Pagination | Budget list, alert list beyond 50 items |
| Caching | React Query with stale times; rate caching 1 hour |
| Performance budgets | API < 500ms, frontend load < 3s |

---

## Project Structure

### Documentation (this feature)

```text
specs/006-budget-management-system/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (pending)
├── quickstart.md        # Phase 1 output (pending)
├── contracts/           # Phase 1 output (pending)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Web application structure (frontend + backend)

backend/src/
├── budgets/
│   ├── budgets.controller.ts      # REST endpoints
│   ├── budgets.service.ts         # Budget CRUD + progress
│   ├── budgets.module.ts          # Module definition
│   ├── dto/
│   │   ├── create-budget.dto.ts
│   │   ├── update-budget.dto.ts
│   │   └── budget-progress.dto.ts
│   ├── entities/
│   │   ├── budget.entity.ts       # Existing - needs enhancement
│   │   └── budget-alert.entity.ts # Existing - needs enhancement
│   └── services/
│       ├── budget-progress.service.ts      # NEW
│       └── budget-variance.service.ts      # NEW

frontend/
├── components/
│   └── budgets/
│       ├── budget-list/           # NEW
│       ├── budget-card/           # NEW
│       ├── budget-detail/         # NEW
│       ├── budget-form/           # NEW
│       ├── template-browser/      # NEW
│       ├── alert-center/          # NEW
│       └── variance-report/       # NEW
├── hooks/
│   ├── use-budgets.ts             # NEW
│   ├── use-budget-progress.ts     # NEW
│   ├── use-budget-alerts.ts       # NEW
│   └── use-budget-templates.ts    # NEW
├── lib/
│   └── api.ts                     # Existing - add budget endpoints
└── types/
    └── index.ts                   # Existing - add budget types
```

**Structure Decision**: Standard web application with NestJS backend and Next.js frontend. Backend modules follow existing `src/{feature}/` pattern; frontend components follow `components/{feature}/` pattern with co-located hooks.

---

## Complexity Tracking

> Not applicable - no constitution violations requiring justification

---

## Phase 1 Outputs (Completed)

**Date**: 2026-01-25

The following artifacts have been generated:

- ✅ `data-model.md` - Entity definitions with field types and relationships
- ✅ `contracts/openapi.yaml` - OpenAPI 3.0 schema for all budget API endpoints
- ✅ `quickstart.md` - Development setup guide for this feature
- ✅ Agent context updated via `.specify/scripts/bash/update-agent-context.sh`

---

## Constitution Check (Post-Design Re-evaluation)

*Re-checked after Phase 1 design completion*

### ✅ GATE 1: Financial Integrity

| Requirement | Status | Evidence |
|-------------|--------|----------|
| DECIMAL type for monetary values | ✅ PASS | `amount`, `spent_amount`, `threshold_percent` use `decimal(20, 4)` |
| Soft deletes only | ✅ PASS | `deleted_at` column on all entities |
| No floating-point | ✅ PASS | TypeORM `decimal` type confirmed |

### ✅ GATE 2: Tenant Isolation

| Requirement | Status | Evidence |
|-------------|--------|----------|
| RLS on all tables | ✅ PASS | `tenant_id` column on Budget, BudgetAlert, BudgetTemplate |
| Query filters include tenant | ✅ PASS | Service layer uses `TenantContext` for all queries |

### ✅ GATE 3: Type Safety

| Requirement | Status | Evidence |
|-------------|--------|----------|
| No `any` type | ✅ PASS | TypeScript strict mode; DTOs with explicit types |
| No type suppression | ✅ PASS | No `@ts-ignore`, `as any` in design |
| DTOs for API contracts | ✅ PASS | OpenAPI spec defines all request/response schemas |

### ✅ GATE 4: Validation & Data Integrity

| Requirement | Status | Evidence |
|-------------|--------|----------|
| class-validator DTOs | ✅ PASS | OpenAPI spec includes validation constraints |
| No exposed entities | ✅ PASS | DTOs separate from entities in design |

### ✅ GATE 5: Code Quality

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Single responsibility | ✅ PASS | Separate services: BudgetsService, BudgetProgressService, BudgetVarianceService |
| Co-located tests | ✅ PASS | Test files alongside modules in plan |

### ✅ GATE 6: Testing Standards

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Unit tests required | ✅ PASS | Test requirements documented in quickstart |
| CI-aware tests | ✅ PASS | ForbidOnly configured in existing Playwright |

### ✅ GATE 7: User Experience

| Requirement | Status | Evidence |
|-------------|--------|----------|
| shadcn/ui components | ✅ PASS | Components use Card, Progress, Alert, etc. |
| Auto-refresh specified | ✅ PASS | 60s for progress, 15s for alerts |

### ✅ GATE 8: Performance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Proper indexing | ✅ PASS | Indexes defined in data-model.md |
| Caching strategy | ✅ PASS | TTL values documented in research.md |

---

## Phase 2: Ready for Task Generation

All constitution gates pass. Feature is ready for `/speckit.tasks` command to generate implementation tasks.

**Next Command**:
```bash
/speckit.tasks 006-budget-management-system
```

---

## Known Integrations

| System | Integration Type | Notes |
|--------|-----------------|-------|
| Journal Entries | Data source | Spending data via journal_lines |
| Query Service | Balance calculation | `getBalances()` for progress |
| Rates Service | Currency conversion | RateGraphEngine for multi-currency |
| Accounts | Association | Optional account_id linking |
| Notifications | Alert delivery | Reuse existing notification system |

---

*Plan generated 2026-01-25*
*Ready for Phase 1: Data Model & Contracts*
