# Budget Management System - Research Findings

**Feature**: 006-budget-management-system
**Date**: 2026-01-25
**Purpose**: Consolidate technical decisions for budget management implementation

---

## 1. Real-Time Budget Update Mechanism

### Decision: Event-Driven Approach with Batch Processing

**Rationale**: 
- Existing codebase uses TypeORM with PostgreSQL
- Direct database triggers would work but tightly couples to database layer
- Event-driven approach integrates better with existing NestJS architecture
- Batch processing ensures performance during high transaction volumes

**Implementation**:
```text
Journal Entry Created/Updated → Event Emitter → Budget Service
                                           ↓
                                    Batch Processor (5min interval)
                                           ↓
                                    Update spent_amount
                                           ↓
                                    Check thresholds → Create Alert
```

**Alternatives Considered**:
| Option | Pros | Cons | Rejected Because |
|--------|------|------|------------------|
| PostgreSQL Triggers | Real-time, no app logic | Tight coupling, hard to test | Violates separation of concerns |
| Direct update in journal service | Simple, immediate | Blocks journal transaction, performance impact | Could slow down journal operations |
| WebSocket push | Instant updates | Complexity, connection management | Overkill for 5min SLA |

---

## 2. Multi-Currency Calculation Strategy

### Decision: Query-Time Conversion with Cached Rates

**Rationale**:
- Exchange rates change frequently, pre-calculation would require complex invalidation
- QueryService already has rate conversion logic
- Cache rates for the calculation session (5-minute TTL)

**Calculation Flow**:
```text
1. Get budget currency (e.g., HKD)
2. Query all journal lines in budget period for associated accounts
3. For each line in different currency:
   - Get rate from rateGraphEngine (cached)
   - Convert to budget currency
4. Sum all converted amounts
```

**Performance Optimization**:
- Budget progress calculation: cached for 1 minute
- Multi-currency summary: calculated on-demand with 5-minute cache
- Rate caching already implemented in RateGraphEngine

---

## 3. Budget Template System Architecture

### Decision: Dual Template Model (System + Custom)

**System Templates**:
- Pre-defined, immutable templates
- 8 templates covering common use cases
- Embedded in code for performance
- Seeded on tenant initialization

**Custom Templates**:
- User-created, stored in database
- Full CRUD support
- Associated with tenant for isolation

**Template Application Flow**:
```text
User selects template
    ↓
Load template defaults
    ↓
Pre-fill budget form
    ↓
User modifies (optional)
    ↓
Create budget from form data
```

---

## 4. Frontend Architecture

### Decision: React Query + TanStack Query for State Management

**Components Structure**:
```
frontend/components/budgets/
├── budget-list/           # Budget list page
├── budget-card/           # Individual budget display
├── budget-detail/         # Budget detail with progress
├── budget-form/           # Create/Edit form
├── template-browser/      # Template selection
├── alert-notifications/   # Alert center
└── variance-report/       # Analysis charts
```

**State Management**:
- React Query for server state (budgets, alerts, templates)
- Local state for UI interactions (form inputs, modal visibility)
- Optimistic updates for instant user feedback

**Auto-Refresh Strategy**:
- Budget list: refresh every 60 seconds
- Budget detail: refresh every 30 seconds during active viewing
- Alerts: refresh every 15 seconds

---

## 5. API Design Decisions

### REST Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/budgets` | List all budgets (paginated) |
| POST | `/api/v1/budgets` | Create budget |
| GET | `/api/v1/budgets/:id` | Get budget details |
| PUT | `/api/v1/budgets/:id` | Update budget |
| DELETE | `/api/v1/budgets/:id` | Soft delete budget |
| GET | `/api/v1/budgets/:id/progress` | Get budget progress |
| GET | `/api/v1/budgets/:id/alerts` | Get budget alerts |
| GET | `/api/v1/budgets/:id/variance` | Get variance report |
| GET | `/api/v1/budget-templates` | List templates |
| POST | `/api/v1/budget-templates` | Create custom template |
| PUT | `/api/v1/budget-templates/:id` | Update template |
| DELETE | `/api/v1/budget-templates/:id` | Delete template |

### DTO Structure

**CreateBudgetDto**:
```typescript
{
  name: string;              // 1-200 chars
  type: 'periodic' | 'non_periodic';
  amount: Decimal;           // positive
  currency: string;          // 3-10 chars, valid currency code
  start_date: Date;
  end_date?: Date;
  period_type?: 'monthly' | 'weekly' | 'yearly';
  account_id?: string;       // optional
  alert_threshold?: number;  // 0-1, default 0.8
}
```

**BudgetProgressResponse**:
```typescript
{
  budget_id: string;
  spent_amount: Decimal;
  remaining_amount: Decimal;
  percentage_used: number;   // 0-100
  days_remaining?: number;
  projected_spend?: Decimal;
  status: 'normal' | 'warning' | 'exceeded';
}
```

---

## 6. Entity Relationships

```
Tenant
  ↓
Budget (many) ←── BudgetAlert (many)
  ↓
Account (optional, many-to-one)
  ↓
BudgetTemplate (many, via tenant)
```

**Key Field Mappings**:

| Entity | Key Fields | Relationships |
|--------|------------|---------------|
| Budget | id, tenant_id | → Account (optional), → BudgetAlert (many) |
| BudgetAlert | id, budget_id | → Budget (one) |
| BudgetTemplate | id, tenant_id | → Tenant (one) |

---

## 7. Performance Considerations

### Caching Strategy

| Data | Cache TTL | Cache Key |
|------|-----------|-----------|
| Budget list | 5 minutes | `budgets:{tenant_id}:list` |
| Budget progress | 1 minute | `budgets:{id}:progress` |
| Multi-currency summary | 5 minutes | `budgets:{tenant_id}:summary:{currency}` |
| Templates | 10 minutes | `templates:{tenant_id}` |
| Exchange rates | 1 hour | (existing rate service) |

### Database Optimization

**Indexes**:
- `budgets(tenant_id, is_active, start_date)`
- `budgets(tenant_id, type, period_type)`
- `budget_alerts(budget_id, status)`
- `budget_alerts(tenant_id, created_at)`
- `budget_templates(tenant_id, category)`

**Query Optimization**:
- Avoid N+1 by eager loading alerts with budgets
- Use batch loading for account path lookups
- Paginate budget list beyond 50 items

---

## 8. Testing Strategy

### Unit Tests

**Backend**:
- `budgets.service.spec.ts` - CRUD operations
- `budget-alert.service.spec.ts` - Alert generation
- `budget-template.service.spec.ts` - Template logic
- Variance calculation service tests

**Frontend**:
- `use-budgets.test.ts` - Hook testing
- Budget form validation tests
- Progress calculation tests

### Integration Tests

- Budget creation with account association
- Alert generation threshold verification
- Multi-currency conversion accuracy
- Template application workflow

### E2E Tests (Playwright)

- Complete budget creation flow
- Alert notification display
- Variance report generation
- Template browsing and application

---

## 9. Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Real-time update frequency | 5 minutes SLA acceptable per spec |
| Currency for spent_amount | Store original currency, convert on query |
| Template sync across tenants | Per-tenant isolation, no cross-tenant templates |
| Budget approval workflow | Out of scope for this iteration (P3) |

---

## 10. References

- Existing implementation: `backend/src/budgets/`
- Requirements: `docs/requirements/REQUIREMENTS_BUDGETS.md`
- Related modules: `journal/`, `query/`, `rates/`
