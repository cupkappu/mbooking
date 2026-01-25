# Implementation Plan: Budget Management System Completion

**Branch**: `007-budget-completion` | **Date**: 2026-01-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-budget-completion/spec.md`

## Summary

Complete budget management system enhancements addressing gaps identified in verification of feature 006-budget-management-system. Key enhancements: budget update validation (prevent reduction below spent amount), real-time progress tracking with optimistic cache updates and async validation, 24-hour alert deduplication, system template seeding per tenant, multi-currency summary endpoint, template protection, and comprehensive E2E test coverage.

## Technical Context

| Aspect | Value |
|--------|-------|
| **Language/Version** | TypeScript 5.x (Frontend strict, Backend relaxed tsconfig) |
| **Primary Dependencies** | NestJS 10, TypeORM 0.3.x, PostgreSQL 15, React 18, TanStack Query 5 |
| **Storage** | PostgreSQL 15 with TypeORM entities (budgets, budget_alerts, budget_templates tables) |
| **Testing** | Jest (unit/integration), Playwright (E2E) |
| **Target Platform** | Web application (browser-based, responsive) |
| **Performance Goals** | Budget progress update < 30s, alert deduplication check < 100ms, template seeding < 1s |
| **Constraints** | Multi-tenant RLS, Decimal types only, soft deletes, 1000 budgets/tenant |
| **Scale/Scope** | 1000 active budgets, 10000 historical alerts, multi-currency per tenant |

## Constitution Check

### GATE 1: Financial Integrity ✅ PASSED

| Requirement | Implementation |
|-------------|----------------|
| DECIMAL type for all monetary values | Entity fields: `amount`, `spent_amount` use `decimal(20, 4)` |
| Soft deletes only | All entities have `deleted_at` column; service uses `is_active = false` |
| Double-entry validation | Not directly applicable - budgets are tracking constructs |
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
| Established patterns | Backend: `src/budgets/{feature}.{ts,service.ts,controller.ts}` |

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

### GATE 8: Performance ✅ PASSED

| Requirement | Implementation |
|-------------|----------------|
| Proper indexing | Indexes on `tenant_id`, `is_active`, `status`, `created_at` |
| Pagination | Budget list, alert list beyond 50 items |
| Caching | React Query with stale times; rate caching 1 hour |

## Project Structure

### Documentation (this feature)

```text
specs/007-budget-completion/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (not needed - all clarifications resolved)
├── data-model.md        # Phase 1 output (this section)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Web application structure (frontend + backend)

backend/src/budgets/
├── budgets.controller.ts      # REST endpoints (existing - needs updates)
├── budgets.service.ts         # Budget CRUD + progress (existing - needs updates)
├── budgets.module.ts          # Module definition (existing)
├── dto/
│   ├── create-budget.dto.ts   # Existing - needs update validation
│   ├── update-budget.dto.ts   # Existing - needs FR-C001/FR-C002 validation
│   └── budget-progress.dto.ts # Existing
├── entities/
│   ├── budget.entity.ts       # Existing - spent_amount field
│   ├── budget-alert.entity.ts # Existing - needs deduplication fields
│   └── budget-template.entity.ts # Existing - SYSTEM_BUDGET_TEMPLATES defined
├── services/
│   ├── budget-progress.service.ts      # NEW - cache update + async validation
│   ├── budget-alert.service.ts         # Existing - needs FR-C008/FR-C009
│   └── budget-template.service.ts      # Existing - needs FR-C011 seeding
└── budgets.service.spec.ts     # Existing - needs test updates

frontend/
├── components/
│   └── budgets/
│       ├── budget-list/        # Existing
│       ├── budget-card/        # Existing
│       ├── budget-detail/      # Existing
│       ├── budget-form/        # Existing - needs update validation
│       ├── template-browser/   # Existing
│       ├── alert-center/       # Existing
│       └── variance-report/    # Existing
├── hooks/
│   ├── use-budgets.ts          # Existing
│   ├── use-budget-progress.ts  # Existing - needs auto-refresh
│   ├── use-budget-alerts.ts    # Existing
│   └── use-budget-templates.ts # Existing
└── lib/
    └── api.ts                  # Existing - add budget endpoints

e2e/
├── budget-workflow.spec.ts     # NEW - complete budget workflow E2E
└── budget-alerts.spec.ts       # NEW - alert workflow E2E
```

**Structure Decision**: Standard web application with NestJS backend and Next.js frontend. Backend modules follow existing `src/{feature}/` pattern; frontend components follow `components/{feature}/` pattern with co-located hooks. E2E tests follow project convention in root `e2e/` directory.

## Phase 1 Outputs (Completed)

**Date**: 2026-01-25

### Data Model

**Budget Entity** (existing, no changes needed):
```typescript
// budget.entity.ts
@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column({ nullable: true })
  account_id: string | null;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'enum', enum: BudgetType })
  type: BudgetType;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  amount: number;

  @Column({ length: 10 })
  currency: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date | null;

  @Column({ type: 'decimal', precision: 20, scale: 4, default: 0 })
  spent_amount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  alert_threshold: number;

  @Column({ default: true })
  is_active: boolean;
}
```

**BudgetAlert Entity** (existing, needs validation deduplication):
```typescript
// budget-alert.entity.ts
@Entity('budget_alerts')
export class BudgetAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  budget_id: string;

  @Column({ type: 'enum', enum: AlertType })
  alert_type: AlertType;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.PENDING })
  status: AlertStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  threshold_percent: number;

  @Column({ type: 'decimal', precision: 20, scale: 4, nullable: true })
  spent_amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 4, nullable: true })
  budget_amount: number;

  @Column({ length: 10, nullable: true })
  currency: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  acknowledged_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
```

**BudgetTemplate Entity** (existing, SYSTEM_BUDGET_TEMPLATES defined):
```typescript
// budget-template.entity.ts
@Entity('budget_templates')
export class BudgetTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TemplateCategory })
  category: TemplateCategory;

  @Column({ default: false })
  is_system_template: boolean;

  // ... other fields
}

// Pre-defined system templates (already defined in code)
export const SYSTEM_BUDGET_TEMPLATES: Partial<BudgetTemplate>[] = [
  { name: 'Monthly Living Expenses', ... },
  { name: 'Business Operating Expenses', ... },
  { name: 'Savings Goal', ... },
  { name: 'Entertainment Budget', ... },
  { name: 'Healthcare Expenses', ... },
  { name: 'Weekly Grocery Budget', ... },
  { name: 'Quarterly Tax Reserve', ... },
  { name: 'Annual Subscription Management', ... },
];
```

### API Contracts

**Existing Endpoints** (need updates):
| Method | Path | Description | Updates Needed |
|--------|------|-------------|----------------|
| PUT | `/budgets/:id` | Update budget | Add FR-C001/FR-C002 validation |
| GET | `/budgets/:id/progress` | Get progress | Already returns spent_amount |
| GET | `/budgets/:id/alerts` | Get alerts | Already exists |
| GET | `/budget-templates` | List templates | Already exists |

**New Endpoints** (need implementation):
| Method | Path | Description |
|--------|------|-------------|
| GET | `/budgets/summary/multicurrency` | Multi-currency summary (FR-C016) |

**UpdateBudgetDto** (needs validation):
```typescript
export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  // FR-C001: Validate new amount >= spent_amount
  @Validate(BudgetAmountValidator)
  amount?: number;
}
```

**BudgetAmountValidator** (new):
```typescript
@ValidatorConstraint({ name: 'BudgetAmountValidator', async: false })
export class BudgetAmountValidator implements ValidatorConstraintInterface {
  validate(amount: number, args: ValidationArguments) {
    const budget = args.object;
    return amount >= budget.spent_amount;
  }

  defaultMessage(args: ValidationArguments) {
    return `预算金额不能低于已花费金额 ${args.object.spent_amount}`;
  }
}
```

### Quickstart

```bash
# Development Setup

# 1. Ensure Docker is running
docker-compose up -d

# 2. Verify budget tables exist
docker exec -it multi_currency_accounting-backend-1 psql -U accounting -d accounting -c "\dt budgets*"

# 3. Run budget-specific tests
npm run test:e2e -- --grep "budget"

# 4. Verify template seeding (create new tenant)
# Templates will be auto-created on first tenant access

# Key Files to Modify
backend/src/budgets/dto/update-budget.dto.ts      # Add validation
backend/src/budgets/budgets.service.ts            # Add update validation
backend/src/budgets/budget-alert.service.ts       # Add deduplication
backend/src/budgets/budget-template.service.ts    # Add seeding
frontend/components/budgets/budget-form/          # Add validation feedback
e2e/budget-workflow.spec.ts                      # NEW E2E tests
```

## Known Integrations

| System | Integration Type | Notes |
|--------|-----------------|-------|
| Journal Entries | Data source | Spending data via journal_lines; need event trigger |
| Query Service | Balance calculation | `getBalances()` for async validation |
| Rates Service | Currency conversion | For multi-currency summary |
| Tenants Service | Template seeding | Trigger on tenant creation |
| Notifications | Alert delivery | Existing system for in-app notifications |

---

## Phase 1: Complete

**Next**: Run `/speckit.tasks 007-budget-completion` to generate implementation tasks

---

*Plan generated 2026-01-25*
*Ready for Phase 2: Task Generation*
