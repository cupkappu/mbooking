# Cache Strategy Documentation

This document describes the caching strategy for the Multi-Currency Accounting frontend using TanStack Query (React Query).

## Overview

The frontend uses TanStack Query for server state management. Proper cache configuration ensures data freshness while minimizing unnecessary network requests.

## Global Cache Configuration

**File:** `frontend/providers/query-provider.tsx`

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 1 minute default
      gcTime: 10 * 60 * 1000,    // 10 minutes
      refetchOnWindowFocus: true, // Refresh on window focus
    },
  },
})
```

### Configuration Explained

| Setting | Value | Purpose |
|---------|-------|---------|
| `staleTime` | 1 minute | Data is considered fresh for 1 minute. Within this window, queries return cached data without network requests. |
| `gcTime` | 10 minutes | Unused cached data is garbage collected after 10 minutes of inactivity. |
| `refetchOnWindowFocus` | true | Automatically refetch when the window regains focus, ensuring fresh data after tab switches. |

## Per-Query Cache Times

Different data types have different cache time recommendations based on their volatility:

| Data Type | staleTime | Rationale |
|-----------|-----------|-----------|
| Account list/balance | 30s - 1min | Needs quick update after transactions, but not instant |
| Journal entries | 30s - 1min | Frequent CRUD operations, balances depend on this |
| Currency list | 5min | Rarely changes, dropdown usage benefits from longer cache |
| Exchange rates | 1-5min | Has independent update mechanism via scheduler |
| User settings | 5-10min | Very stable data, changes rarely |
| Admin user list | 1min | Needs update after admin actions |

### Per-Query Configuration Examples

**Short cache (frequently changing data):**
```typescript
const { data: accounts } = useAccounts({
  staleTime: 30 * 1000, // 30 seconds
});
```

**Long cache (stable data):**
```typescript
const { data: currencies } = useCurrencies({
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

## Cache Invalidation Strategy

All mutations should invalidate related queries to ensure UI consistency:

### Account Mutations

```typescript
const createAccount = useCreateAccount({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['balances'] });
  },
});
```

### Journal Entry Mutations

```typescript
const createJournalEntry = useCreateJournalEntry({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    queryClient.invalidateQueries({ queryKey: ['balances'] });
  },
});
```

### Currency Mutations

```typescript
const createCurrency = useCreateCurrency({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['currencies'] });
    queryClient.invalidateQueries({ queryKey: ['admin-currencies'] });
  },
});
```

## Anti-Patterns to Avoid

### ❌ Don't: Skip cache invalidation
```typescript
// BAD - UI won't update after create
const createAccount = useCreateAccount({
  onSuccess: () => {}, // Empty handler
});
```

### ❌ Don't: Manual state + useEffect
```typescript
// BAD - Race conditions, stale data
const [accounts, setAccounts] = useState([]);
useEffect(() => {
  const fetch = async () => {
    const data = await api.getAccounts();
    setAccounts(data);
  };
  fetch();
}, []);
```

### ✅ Do: Use React Query with cache invalidation
```typescript
// GOOD - Automatic cache invalidation
const createAccount = useCreateAccount({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  },
});
```

## Debugging Cache Issues

### Query Keys Pattern

Use descriptive, hierarchical query keys:

```typescript
// Good - hierarchical and descriptive
['accounts']
['accounts', 'tree']
['accounts', id]
['journal-entries', { offset: 0, limit: 50 }]
['balances', { depth: 2, convert_to: 'USD' }]

// Bad - unclear hierarchy
['data-1']
['accounts-list-v2']
```

### Invalidate All Related Keys

When data changes might affect multiple views:

```typescript
// Invalidate entire namespace
queryClient.invalidateQueries({ queryKey: ['accounts'] });

// Or invalidate specific queries
queryClient.invalidateQueries({ queryKey: ['balances'] });
```

## Testing Considerations

When testing components that use React Query:

1. **Mock the query client** to control cache behavior
2. **Wait for queries to settle** before asserting
3. **Test cache invalidation** by verifying queries are refetched after mutations

```typescript
test('creates account and refreshes list', async () => {
  const { result } = renderHook(() => useCreateAccount());

  await act(async () => {
    await result.current.mutateAsync({ name: 'Test', type: 'assets' });
  });

  // Verify query was invalidated and refetched
  expect(queryClient.getQueryState(['accounts'])?.isInvalidated).toBe(true);
});
```

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Query Cache Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/cache-invalidation)
- [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
