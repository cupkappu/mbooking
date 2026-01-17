# Query Engine Requirements

**Module:** Balance & Transaction Query Engine
**References:** [PRD](../PRD.md), [Core Features](../REQUIREMENTS_CORE.md), [Database](../REQUIREMENTS_DATABASE.md), [API](../REQUIREMENTS_API.md)

---

## Overview

The Query Engine provides flexible, powerful APIs for querying account balances and journal entries with advanced filtering, pagination, and currency conversion capabilities.

**Key capabilities:**
- Balance queries with depth merging
- Transaction search with multi-dimensional filters
- Progressive loading via cursor-based pagination
- Real-time and cached results

---

## Balance Queries

### 1.1 Query Endpoint

**POST** `/api/v1/query/balances`

### 1.2 Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date_range` | Object | No | Filter by transaction date |
| `depth` | Number | No | Account depth (1-3 or 'all') |
| `account_filter` | Object | No | Filter by types, paths |
| `convert_to` | String | No | Target currency for conversion |
| `exchange_rate_date` | String | No | 'latest' or 'specific_date' |
| `specific_date` | String | No | Date for historical rates |
| `pagination` | Object | No | Offset/limit for pagination |
| `use_cache` | Boolean | No | Enable/disable caching |

### 1.3 Depth Control

| Depth Value | Behavior |
|-------------|----------|
| `1` | Top-level accounts only (assets, liabilities, etc.) |
| `2` | One level of children |
| `3` | Two levels of children |
| `'all'` | Full hierarchy |

#### Depth Merging
When querying depth > 1:
- Child balances included in parent total
- Parent shows aggregated balance
- Children shown separately for drill-down

**Example:**
```
Query: depth=2, convert_to=USD

Response:
{
  "assets": { "amount": 50000, "children": [...] },
  "liabilities": { "amount": -5000, "children": [...] }
}
```

**See also:**
- [Core Features - Account hierarchy](../REQUIREMENTS_CORE.md#account-hierarchy)

### 1.4 Account Filters

#### Filter by Type
```json
{
  "account_filter": {
    "types": ["assets", "expense"]
  }
}
```

#### Filter by Path
```json
{
  "account_filter": {
    "paths": ["expense:food:*", "expense:transport:*"]
  }
}
```

#### Combined Filters
All filters applied with AND logic.

---

## Journal Entry Queries

### 2.1 Query Endpoint

**POST** `/api/v1/query/journal-entries`

### 2.2 Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date_range` | Object | No | Filter by transaction date |
| `account_filter` | Object | No | Filter by accounts |
| `amount_filter` | Object | No | Filter by amount range |
| `tags` | String[] | No | Filter by tags (AND logic) |
| `search` | String | No | Search in description |
| `sort` | Object | No | Field + order |
| `pagination` | Object | No | Offset/limit |

### 2.3 Filter Examples

#### Date Range
```json
{
  "date_range": {
    "from": "2025-01-01",
    "to": "2025-12-31"
  }
}
```

#### Account with Children
```json
{
  "account_filter": {
    "paths": ["expense:food"],
    "include_children": true
  }
}
```

#### Amount Range
```json
{
  "amount_filter": {
    "min": 100,
    "max": 10000,
    "currency": "USD"
  }
}
```

#### Tag Filtering
```json
{
  "tags": ["food", "lunch"]
}
```
Matches entries with ALL specified tags.

### 2.4 Sorting
```json
{
  "sort": {
    "field": "date",
    "order": "desc"
  }
}
```

Valid fields: `date`, `amount`, `created_at`

---

## Pagination

### 3.1 Offset-Based Pagination

```json
{
  "pagination": {
    "offset": 0,
    "limit": 50
  }
}
```

**Response includes:**
```json
{
  "pagination": {
    "offset": 0,
    "limit": 50,
    "total": 150,
    "has_more": true
  }
}
```

### 3.2 Cursor-Based Pagination (Future)

For infinite scroll:
- Use `cursor` instead of `offset`
- Return `next_cursor` in response
- More efficient for large datasets

---

## Currency Conversion in Queries

### 4.1 Conversion Options

| Parameter | Description |
|-----------|-------------|
| `convert_to` | Target currency code |
| `exchange_rate_date` | Source of exchange rate |
| `specific_date` | Date for historical rate |

### 4.2 Rate Date Options

| Option | Behavior |
|--------|----------|
| `latest` | Use most recent available rate |
| `query_date` | Use rate from date_range.to |
| `specific_date` | Use rate from specific_date |

**See also:**
- [Multi-Currency - Rate types](../REQUIREMENTS_MULTI_CURRENCY.md#rate-types)

---

## Caching Strategy

### 5.1 Cache Keys

Balance cache key:
```
balances:{tenant_id}:{date_hash}:{depth}:{convert_to}
```

### 5.2 Cache Invalidation

| Trigger | Invalidate |
|---------|------------|
| New journal entry | Related account balances |
| Journal entry update | Related balances |
| Currency rate change | Converted balances |
| Account structure change | All descendant balances |

### 5.3 Cache Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `CACHE_TTL_BALANCE` | 300s | Balance cache lifetime |
| `CACHE_TTL_RATE` | 3600s | Rate cache lifetime |
| `CACHE_MAX_SIZE` | 1000 | Max cached balances |

---

## Cross-References

```
See also:
- [Core Features - Balance calculation](../REQUIREMENTS_CORE.md#balance-calculation)
- [Database - Query optimization](../REQUIREMENTS_DATABASE.md#query-performance)
- [API - Query endpoints](../REQUIREMENTS_API.md#query-engine-api)
- [Multi-Currency - Exchange rate retrieval](../REQUIREMENTS_MULTI_CURRENCY.md#exchange-rate-system)
```
