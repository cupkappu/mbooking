# Budget Management System - Quickstart Guide

**Feature**: 006-budget-management-system
**Date**: 2026-01-25

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15 (via Docker)
- Access to existing codebase

## Development Setup

### 1. Start Development Environment

```bash
# Start core services (PostgreSQL, backend, frontend)
docker-compose up -d

# Or for local development:
cd backend && npm run start:dev
cd frontend && npm run dev
```

### 2. Verify Services

| Service | URL | Expected |
|---------|-----|----------|
| Backend API | http://localhost:3001 | JSON response |
| Frontend | http://localhost:3000 | Next.js app |
| PostgreSQL | localhost:5432 | Connection accepted |

### 3. Run Existing Tests

```bash
# Backend tests (existing budget tests)
cd backend && npm run test -- --testPathPattern=budgets

# Frontend tests (after implementation)
cd frontend && npm run test -- --testPathPattern=budgets
```

## Key File Locations

### Backend

```
backend/src/budgets/
├── budgets.controller.ts       # REST endpoints
├── budgets.service.ts          # CRUD + progress logic
├── budgets.module.ts           # Module config
├── dto/
│   ├── create-budget.dto.ts    # Validation
│   ├── update-budget.dto.ts
│   └── budget-progress.dto.ts
├── entities/
│   ├── budget.entity.ts        # Budget model
│   └── budget-alert.entity.ts  # Alert model
└── budget-template.entity.ts   # Template model
```

### Frontend

```
frontend/
├── components/budgets/         # NEW - Component directory
│   ├── budget-list/           # List view
│   ├── budget-card/           # Card component
│   ├── budget-detail/         # Detail view
│   ├── budget-form/           # Create/Edit form
│   ├── template-browser/      # Template selection
│   ├── alert-center/          # Notification center
│   └── variance-report/       # Analysis charts
├── hooks/
│   ├── use-budgets.ts         # Budget data
│   ├── use-budget-progress.ts # Progress tracking
│   ├── use-budget-alerts.ts   # Alert management
│   └── use-budget-templates.ts # Template operations
└── lib/
    └── api.ts                 # Add budget endpoints
```

## Implementation Checklist

### Backend Tasks

- [ ] Review existing entities (`budget.entity.ts`, `budget-alert.entity.ts`)
- [ ] Create DTOs for all endpoints
- [ ] Implement `BudgetsController` REST endpoints
- [ ] Implement `BudgetProgressService` for real-time calculation
- [ ] Implement `BudgetVarianceService` for variance reports
- [ ] Add multi-currency support to progress calculation
- [ ] Add template CRUD endpoints
- [ ] Add pagination to list endpoints
- [ ] Write unit tests for new services
- [ ] Verify with existing integration tests

### Frontend Tasks

- [ ] Create `components/budgets/` directory structure
- [ ] Implement `useBudgets` hook with React Query
- [ ] Implement `BudgetList` page
- [ ] Implement `BudgetCard` component
- [ ] Implement `BudgetDetail` page with progress
- [ ] Implement `BudgetForm` component
- [ ] Implement `TemplateBrowser` component
- [ ] Implement `AlertCenter` component
- [ ] Implement `VarianceReport` component
- [ ] Add auto-refresh (60s for progress, 15s for alerts)
- [ ] Write component tests
- [ ] Verify with E2E tests

## Testing Commands

### Unit Tests

```bash
# Backend
npm run test -- --testPathPattern=budgets --coverage

# Frontend
npm run test -- --testPathPattern=budgets --coverage
```

### E2E Tests

```bash
# Run budget-related E2E tests
npm run test:e2e -- --grep="budget"

# Or run specific test file
npm run test:e2e -- tests/budgets.spec.ts
```

## API Testing

### Create Budget

```bash
curl -X POST http://localhost:3001/api/v1/budgets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Monthly Food Budget",
    "type": "periodic",
    "amount": 5000,
    "currency": "HKD",
    "start_date": "2025-01-01",
    "period_type": "monthly",
    "alert_threshold": 0.8
  }'
```

### Get Budget Progress

```bash
curl http://localhost:3001/api/v1/budgets/{id}/progress \
  -H "Authorization: Bearer <token>"
```

### List Templates

```bash
curl http://localhost:3001/api/v1/budget-templates \
  -H "Authorization: Bearer <token>"
```

## Common Issues

| Issue | Solution |
|-------|----------|
| `TenantContext` not set | Ensure user is authenticated; middleware sets tenant ID |
| Currency conversion fails | Check rates service is running and has rates cached |
| Progress shows stale data | Trigger manual refresh or check cache TTL |
| Template not found | Verify template is active and belongs to tenant |

## Deployment Notes

- Ensure PostgreSQL indexes are created (see `data-model.md`)
- Seed system templates on tenant initialization
- Configure rate service cache TTL (default 1 hour)
- Monitor API response times (< 500ms target)
- Set up alert notification worker process

## Related Documentation

- Specification: [spec.md](./spec.md)
- Data Model: [data-model.md](./data-model.md)
- Research: [research.md](./research.md)
- API Contract: [contracts/openapi.yaml](./contracts/openapi.yaml)
