# Frontend-Backend Data Sync Fix Design

**Created:** 2026-01-22
**Author:** Sisyphus AI Agent
**Status:** Draft

## Executive Summary

This document outlines the design for fixing frontend caching issues that cause data synchronization problems between frontend and backend. The core issue is that mutation hooks have empty `onSuccess` handlers, preventing automatic cache invalidation after data changes.

## Problem Statement

### Current Issues

1. **Mutation hooks have empty `onSuccess` handlers**
   - Location: `frontend/hooks/use-api.ts`, `frontend/hooks/use-currencies.ts`
   - Impact: Cache never invalidates after CRUD operations
   - User Experience: UI doesn't reflect changes immediately

2. **Inconsistent data fetching patterns**
   - Mix of React Query and direct `useEffect` API calls
   - Example: `settings/page.tsx` uses both patterns
   - Risk: Potential race conditions and stale data

3. **Global cache configuration not optimized**
   - Default `staleTime` of 5 minutes is too long for frequently changing data
   - No `refetchOnWindowFocus` enabled
   - Missing cache strategy documentation

### Affected Components

| Component | File | Issue |
|-----------|------|-------|
| Account mutations | `hooks/use-api.ts` | Empty onSuccess |
| Journal mutations | `hooks/use-api.ts` | Empty onSuccess |
| Currency mutations | `hooks/use-currencies.ts` | Empty onSuccess |
| Settings page | `settings/page.tsx` | Mixed data fetching |
| Accounts page | `accounts/page.tsx` | Mixed data fetching |
| Query provider | `query-provider.tsx` | Suboptimal config |

## Solution Overview

### Strategy: Bottom-Up Approach

**Phase 1:** Fix mutation hooks (highest priority)
**Phase 2:** Unify data fetching patterns
**Phase 3:** Improve infrastructure and documentation

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Fix strategy | Bottom-up | Start with core issues, validate incrementally |
| Data fetching | All React Query | Consistency, better cache management |
| Optimistic updates | Not included | Keep it simple, rely on cache invalidation |
| Testing approach | Automated + Manual | Balance reliability and speed |
| Test environment | Clean Docker compose | Reproducible, no persisted data |

## Phase 1: Mutation Hooks Fix

### Implementation Details

**File:** `frontend/hooks/use-api.ts`

```typescript
// BEFORE (problematic)
export function useCreateAccount() {
  return useMutation({
    mutationFn: (data: Partial<Account>) =>
      apiClient.post<Account>('/accounts', data),
    onSuccess: () => {},  // Empty - cache never invalidates
  });
}

// AFTER (fixed)
export function useCreateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Account>) =>
      apiClient.post<Account>('/accounts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
```

### Mutations to Fix

| Hook | Invalidated Cache Keys | Impacted Pages |
|------|----------------------|----------------|
| `useCreateAccount` | `['accounts']`, `['balances']` | accounts/page |
| `useUpdateAccount` | `['accounts']`, `['balances']` | accounts/page |
| `useDeleteAccount` | `['accounts']`, `['balances']` | accounts/page |
| `useCreateJournalEntry` | `['journal-entries']`, `['balances']` | journal/page |
| `useUpdateJournalEntry` | `['journal-entries']`, `['balances']` | journal/page |
| `useDeleteJournalEntry` | `['journal-entries']`, `['balances']` | journal/page |
| `useCreateCurrency` | `['currencies']`, `['admin-currencies']` | settings, admin/currencies |
| `useUpdateCurrency` | `['currencies']`, `['admin-currencies']` | settings, admin/currencies |
| `useDeleteCurrency` | `['currencies']`, `['admin-currencies']` | settings, admin/currencies |

### Code Changes Required

1. Import `useQueryClient` in each hooks file
2. Create queryClient instance in each mutation hook
3. Add `onSuccess` handler with `invalidateQueries` calls

## Phase 2: Unify Data Fetching

### Problem: Mixed Patterns

**Current problematic code** (`settings/page.tsx`):

```typescript
// React Query for tenant data
const { data: tenant } = useQuery({
  queryKey: ['tenant', 'current'],
  queryFn: () => tenantsApi.getCurrent(),
});

// Direct API call in useEffect (anti-pattern)
const [currencies, setCurrencies] = useState<Currency[]>([]);

useEffect(() => {
  const fetchCurrencies = async () => {
    const data = await currenciesApi.getAll();
    setCurrencies(data);
  };
  fetchCurrencies();
}, [activeTab, currencies.length]);  // Risk: circular dependency
```

### Solution:统一使用 React Query

```typescript
// Unified: Use React Query hook
const { data: currencies } = useCurrencies();

// Delete useState and useEffect
// Direct usage: currencies?.map(...)
```

### Files to Modify

| File | Change |
|------|--------|
| `settings/page.tsx` | Remove `useEffect` + `currenciesApi.getAll()`, use `useCurrencies()` |
| `accounts/page.tsx` | Remove `useEffect` + `currenciesApi.getAll()`, use `useCurrencies()` |
| `journal/page.tsx` | Remove `useEffect` + `currenciesApi.getAll()`, use `useCurrencies()` |

## Phase 3: Infrastructure Improvement

### Query Client Configuration

**File:** `frontend/providers/query-provider.tsx`

**Before:**
```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 30 * 60 * 1000,
    },
  },
})
```

**After:**
```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1 minute default
      gcTime: 10 * 60 * 1000,      // 10 minutes
      refetchOnWindowFocus: true,  // Refresh on window focus
    },
  },
})
```

### Cache Strategy Documentation

**File:** `docs/cache-strategy.md`

Recommended cache times by data type:

| Data Type | staleTime | Rationale |
|-----------|-----------|-----------|
| Account list/balance | 30s - 1min | Needs quick update after transactions |
| Journal entries | 30s - 1min | Frequent CRUD operations |
| Currency list | 5min | Rarely changes |
| Exchange rates | 1-5min | Has independent update mechanism |
| User settings | 5-10min | Very stable data |
| Admin user list | 1min | Needs update after admin actions |

## Test Environment

### Docker Compose for Testing

**File:** `docker-compose.test.yml`

Purpose: Isolated test environment with no data persistence.

```yaml
version: '3.8'

services:
  postgres_test:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test_db
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test -d test_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    tmpfs:
      - /var/lib/postgresql/data

  backend_test:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_HOST: postgres_test
      DATABASE_PORT: 5432
      DATABASE_USER: test
      DATABASE_PASSWORD: test
      DATABASE_NAME: test_db
    ports:
      - "8067:3001"
    depends_on:
      postgres_test:
        condition: service_healthy

  frontend_test:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8067
    ports:
      - "8068:3000"
    depends_on:
      - backend_test
```

### Usage

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run tests
npm run test:e2e

# Clean up (all data lost)
docker-compose -f docker-compose.test.yml down -v
```

### Environment Comparison

| Environment | DB Port | Frontend | Backend | Persistence |
|-------------|---------|----------|---------|-------------|
| Development | 5432 | 8068 | 8067 | Yes |
| Testing | 5433 | 8068 | 8067 | No (tmpfs) |

## Validation Plan

### Phase 1 Validation

| Test Case | Expected Result |
|-----------|-----------------|
| Create account | List auto-refreshes, new account appears |
| Edit account | Name updates immediately |
| Delete account | List auto-refreshes, account removed |
| Create journal entry | List and balances update |
| Edit journal entry | List updates |
| Delete journal entry | List updates |

### Phase 2 Validation

| Test Case | Expected Result |
|-----------|-----------------|
| Settings currency tab | Currencies display correctly |
| Network requests | No duplicate/looping requests |

### Phase 3 Validation

| Test Case | Expected Result |
|-----------|-----------------|
| Window focus | Data auto-refreshes |
| staleTime expiry | Data auto-refreshes |

## Rollback Plan

If issues arise during implementation:

1. **Phase 1 issues:** Revert mutation hooks to empty onSuccess
2. **Phase 2 issues:** Restore useEffect patterns selectively
3. **Phase 3 issues:** Revert query provider configuration

All changes are isolated and reversible.

## Dependencies

- No new external dependencies
- Uses existing TanStack Query infrastructure
- No backend changes required

## Timeline Estimate

| Phase | Effort | Risk |
|-------|--------|------|
| Phase 1: Mutation hooks | 1-2 hours | Low |
| Phase 2: Unify patterns | 1 hour | Low |
| Phase 3: Infrastructure | 1 hour | Low |

**Total estimated time:** 3-4 hours

## References

- TanStack Query Documentation: https://tanstack.com/query/latest
- Existing hooks: `frontend/hooks/use-api.ts`
- Query provider: `frontend/providers/query-provider.tsx`
