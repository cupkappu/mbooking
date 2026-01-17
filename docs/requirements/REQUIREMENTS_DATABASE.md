# Database Requirements

**Module:** Data Model & Schema
**References:** [PRD](../PRD.md), [Core Features](../REQUIREMENTS_CORE.md), [API](../REQUIREMENTS_API.md)

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Global Tables (No RLS)                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│    currencies   │  ◄─── Currency definitions (USD, HKD, CNY, BTC)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│    providers    │  ◄─── Rate provider configurations
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  exchange_rates │  ◄─── Historical exchange rates (daily)
└─────────────────┘
         │
         │  ┌─────────────────────────────────────────────────────┐
         │  │                   Tenant-Isolated Tables            │
         └  └─────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  tenants                                                        │
│  - id                                                           │
│  - user_id (auth.js)                                            │
│  - name                                                         │
│  - settings (JSON)                                              │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  accounts (Hierarchical tree)                                   │
│  - id                                                           │
│  - tenant_id                                                    │
│  - parent_id (nullable)                                         │
│  - name                                                         │
│  - type (assets/liabilities/equity/revenue/expense)            │
│  - currency                                                     │
│  - path (computed: assets:bank:checking)                        │
│  - depth (computed)                                             │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  journal_entries                                                │
│  - id                                                           │
│  - tenant_id                                                    │
│  - date                                                         │
│  - description                                                  │
│  - reference_id                                                 │
│  - is_pending                                                   │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  journal_lines                                                  │
│  - id                                                           │
│  - journal_entry_id                                             │
│  - tenant_id                                                    │
│  - account_id                                                   │
│  - amount (positive/negative for debit/credit)                  │
│  - currency                                                     │
│  - exchange_rate                                                │
│  - converted_amount                                             │
│  - tags (JSON array)                                            │
│  - remarks                                                      │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  budgets                                                        │
│  - id                                                           │
│  - tenant_id                                                    │
│  - account_id (optional)                                        │
│  - name                                                         │
│  - type (periodic/non_periodic)                                 │
│  - amount                                                       │
│  - currency                                                     │
│  - period_type                                                  │
│  - start_date                                                   │
│  - end_date                                                     │
│  - alert_threshold                                              │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  reports                                                        │
│  - id                                                           │
│  - tenant_id                                                    │
│  - type (balance_sheet/income_statement/cash_flow)              │
│  - title                                                        │
│  - content (JSON)                                               │
│  - generated_at                                                 │
│  - date_range                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Table Definitions

### currencies

```typescript
interface Currency {
  code: string;           // PK: USD, HKD, CNY, BTC
  name: string;          // US Dollar, 港币
  symbol: string;        // $, HK$, ¥, ₿
  decimal_places: number; // 2 or 8
  is_active: boolean;
  created_at: Timestamp;
}
```

### providers

```typescript
interface Provider {
  id: UUID;              // PK
  name: string;          // Display name
  type: 'js_plugin' | 'rest_api';
  config: JSON;          // Encrypted credentials
  supported_currencies: string[];
  supports_historical: boolean;
  supports_date_query: boolean;
  record_history: boolean;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### exchange_rates

```typescript
interface ExchangeRate {
  id: UUID;              // PK
  provider_id: UUID;     // FK to providers
  from_currency: string; // FK to currencies
  to_currency: string;   // FK to currencies
  rate: Decimal;
  date: Date;            // Rate date
  fetched_at: Timestamp;
}
```

### accounts

```typescript
interface Account {
  id: UUID;              // PK
  tenant_id: UUID;       // FK to tenants, RLS enabled
  parent_id: UUID | null; // FK to accounts (self-ref)
  name: string;
  type: 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expense';
  currency: string;      // FK to currencies
  path: string;          // Computed: assets:bank:checking
  depth: number;         // Computed: 0-∞
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### journal_entries

```typescript
interface JournalEntry {
  id: UUID;              // PK
  tenant_id: UUID;       // FK to tenants, RLS enabled
  date: Timestamp;
  description: string;
  reference_id?: string; // External reference
  is_pending: boolean;
  created_by: UUID;      // FK to users
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### journal_lines

```typescript
interface JournalLine {
  id: UUID;              // PK
  journal_entry_id: UUID; // FK to journal_entries
  tenant_id: UUID;       // FK to tenants, RLS enabled
  account_id: UUID;      // FK to accounts
  amount: Decimal;       // Signed amount
  currency: string;      // FK to currencies
  exchange_rate?: Decimal;
  converted_amount?: Decimal;
  tags: string[];        // JSON array
  remarks?: string;
  created_at: Timestamp;
}
```

### budgets

```typescript
interface Budget {
  id: UUID;              // PK
  tenant_id: UUID;       // FK to tenants, RLS enabled
  account_id?: UUID;     // FK to accounts (optional)
  name: string;
  type: 'periodic' | 'non_periodic';
  amount: Decimal;
  currency: string;
  period_type?: 'monthly' | 'weekly' | 'yearly';
  start_date: Date;
  end_date?: Date;
  alert_threshold?: Decimal;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### reports

```typescript
interface Report {
  id: UUID;              // PK
  tenant_id: UUID;       // FK to tenants, RLS enabled
  type: 'balance_sheet' | 'income_statement' | 'cash_flow';
  title: string;
  content: JSON;         // Report data
  generated_at: Timestamp;
  date_range: {
    from: Date;
    to: Date;
  };
}
```

---

## Row Level Security (RLS)

### 9.1 RLS Enabled Tables

All tenant-isolated tables have RLS:
- `accounts`
- `journal_entries`
- `journal_lines`
- `budgets`
- `reports`

### 9.2 RLS Policy

```sql
-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Tenant isolation"
  ON accounts FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Set tenant context
-- NestJS interceptor sets current_setting('app.current_tenant_id')
```

---

## Soft Delete

### 10.1 Pattern

All tables use `deleted_at` column:
- Never hard delete data
- Query with `WHERE deleted_at IS NULL`
- Preserves audit trail

### 10.2 Implementation

```typescript
// TypeORM
@DeleteDateColumn()
deleted_at?: Date;
```

---

## Cross-References

```
See also:
- [Core Features - Business logic](../REQUIREMENTS_CORE.md)
- [API - Entity operations](../REQUIREMENTS_API.md)
- [Admin - Audit logging](../REQUIREMENTS_ADMIN.md#audit-logs)
```
