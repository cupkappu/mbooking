# Budget Completion - Quickstart Guide

**Feature**: 007-budget-completion  
**Last Updated**: 2026-01-25

## Overview

This feature completes the Budget Management System with:
- Budget update validation (prevent reduction below spent amount)
- Real-time progress tracking with cache updates and async validation
- 24-hour alert deduplication
- System template seeding per tenant
- Multi-currency summary endpoint
- Template protection
- Comprehensive E2E test coverage

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15 (via Docker)
- Backend running on port 8067
- Frontend running on port 8068

## Development Setup

### 1. Start Development Environment

```bash
# Start Docker services
docker-compose up -d

# Verify services
docker-compose ps
# Should show: PostgreSQL (5433), Backend (8067), Frontend (8068)
```

### 2. Verify Budget Tables

```bash
# Connect to database
docker exec -it $(docker-compose ps -q backend) psql -U accounting -d accounting

# List budget-related tables
\dt budgets*
\dt budget_*

# Verify system templates exist (after first tenant access)
SELECT id, name, is_system_template FROM budget_templates LIMIT 10;
```

### 3. Run Budget-Specific Tests

```bash
# Run all tests
npm test

# Run only budget-related tests
npm run test:e2e -- --grep "budget"

# Run backend unit tests for budgets
cd backend && npm run test -- --testPathPattern="budgets"
```

## Key Files to Modify

### Backend

| File | Purpose | Changes |
|------|---------|---------|
| `backend/src/budgets/dto/update-budget.dto.ts` | Update validation | Add BudgetAmountValidator |
| `backend/src/budgets/budgets.service.ts` | Update logic | Add FR-C001/FR-C002 checks |
| `backend/src/budgets/budget-alert.service.ts` | Alert deduplication | Add 24-hour check |
| `backend/src/budgets/budget-template.service.ts` | Template seeding | Add seeding logic |
| `backend/src/budgets/budgets.controller.ts` | API endpoints | Add multicurrency endpoint |

### Frontend

| File | Purpose | Changes |
|------|---------|---------|
| `frontend/components/budgets/budget-form/budget-form.tsx` | Validation feedback | Show error messages |
| `frontend/hooks/use-budget-progress.ts` | Auto-refresh | Already implements 60s refresh |

### Tests

| File | Purpose |
|------|---------|
| `e2e/budget-workflow.spec.ts` | Complete budget workflow E2E |
| `e2e/budget-alerts.spec.ts` | Alert workflow E2E |

## Testing Checklist

- [ ] Budget update validation blocks reduction below spent
- [ ] Admin can override with audit log
- [ ] Alert deduplication prevents duplicates within 24 hours
- [ ] New tenants get 8 system templates
- [ ] System templates cannot be modified/deleted
- [ ] Multi-currency summary returns correct conversions
- [ ] E2E tests pass for budget workflow

## Common Issues

### Templates Not Appearing

**Cause**: Templates are seeded per tenant on first access.

**Solution**: Access any template endpoint after tenant is created:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8067/budgets/templates
```

### Budget Not Updating After Journal Entry

**Cause**: Cache update is async (up to 30s delay).

**Solution**: Wait 30s or manually trigger refresh:
```typescript
queryClient.invalidateQueries({ queryKey: ['budgets', id, 'progress'] });
```

### Alert Deduplication Not Working

**Cause**: Alert check runs before save.

**Solution**: Verify deduplication logic in `budget-alert.service.ts`:
```typescript
// Check 24-hour window before creating alert
const existingAlert = await this.findExistingAlert(budget.id, alertType);
if (!existingAlert || isOlderThan24Hours(existingAlert)) {
  // Create new alert
}
```

## Validation Commands

```bash
# Verify budget update validation
curl -X PUT http://localhost:8067/budgets/<id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}'  # Should fail if spent > 500

# Verify multi-currency summary
curl "http://localhost:8067/budgets/summary/multicurrency?base_currency=USD" \
  -H "Authorization: Bearer <token>"
```

## Next Steps

1. Run `/speckit.tasks 007-budget-completion` to generate implementation tasks
2. Implement changes in order of dependencies
3. Add/update tests for each feature
4. Run full E2E test suite
5. Commit and push changes
