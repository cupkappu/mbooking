# Requirements Index

**Cross-reference guide for decomposed requirements**

---

## File Overview

| File | Module | Purpose |
|------|--------|---------|
| `PRD.md` | Product | Master document, full vision |
| `REQUIREMENTS_CORE.md` | Core | Account types, journal entries, balance |
| `REQUIREMENTS_MULTI_CURRENCY.md` | Currency | Exchange rates, providers, conversion |
| `REQUIREMENTS_QUERY_ENGINE.md` | Query | Balance/transaction queries, filters |
| `REQUIREMENTS_REPORTS.md` | Reports | Balance sheet, income statement |
| `REQUIREMENTS_BUDGETS.md` | Budgets | Budget creation, tracking, alerts |
| `REQUIREMENTS_PLUGIN_SYSTEM.md` | Plugins | Rate provider extensibility |
| `REQUIREMENTS_ADMIN.md` | Admin | User management, system config, audit |
| `REQUIREMENTS_API.md` | API | REST endpoint specifications |
| `REQUIREMENTS_DATABASE.md` | Database | Entity definitions, RLS, schema |

---

## Dependency Graph

```
PRD.md (Master)
    │
    ├── REQUIREMENTS_CORE.md
    │       │
    │       ├── REQUIREMENTS_DATABASE.md (accounts, journal_entries)
    │       ├── REQUIREMENTS_API.md (account, journal endpoints)
    │       └── REQUIREMENTS_QUERY_ENGINE.md (balance queries)
    │
    ├── REQUIREMENTS_MULTI_CURRENCY.md
    │       │
    │       ├── REQUIREMENTS_DATABASE.md (currencies, exchange_rates)
    │       ├── REQUIREMENTS_PLUGIN_SYSTEM.md (providers)
    │       └── REQUIREMENTS_API.md (rate endpoints)
    │
    ├── REQUIREMENTS_QUERY_ENGINE.md
    │       │
    │       ├── REQUIREMENTS_CORE.md (account structure)
    │       ├── REQUIREMENTS_MULTI_CURRENCY.md (currency conversion)
    │       └── REQUIREMENTS_DATABASE.md (query optimization)
    │
    ├── REQUIREMENTS_REPORTS.md
    │       │
    │       ├── REQUIREMENTS_QUERY_ENGINE.md (balance queries)
    │       └── REQUIREMENTS_MULTI_CURRENCY.md (currency conversion)
    │
    ├── REQUIREMENTS_BUDGETS.md
    │       │
    │       ├── REQUIREMENTS_CORE.md (account hierarchy)
    │       └── REQUIREMENTS_QUERY_ENGINE.md (transaction queries)
    │
    ├── REQUIREMENTS_PLUGIN_SYSTEM.md
    │       │
    │       ├── REQUIREMENTS_MULTI_CURRENCY.md (rate system)
    │       └── REQUIREMENTS_DATABASE.md (providers table)
    │
    └── REQUIREMENTS_ADMIN.md
            │
            ├── REQUIREMENTS_API.md (admin endpoints)
            └── REQUIREMENTS_DATABASE.md (audit logs)

REQUIREMENTS_API.md (API)
    │
    ├── REQUIREMENTS_CORE.md (entity operations)
    ├── REQUIREMENTS_MULTI_CURRENCY.md (rate endpoints)
    ├── REQUIREMENTS_QUERY_ENGINE.md (query endpoints)
    ├── REQUIREMENTS_REPORTS.md (report endpoints)
    ├── REQUIREMENTS_BUDGETS.md (budget endpoints)
    ├── REQUIREMENTS_PLUGIN_SYSTEM.md (provider endpoints)
    └── REQUIREMENTS_ADMIN.md (admin endpoints)

REQUIREMENTS_DATABASE.md (Database)
    │
    ├── REQUIREMENTS_CORE.md (account, journal entities)
    ├── REQUIREMENTS_MULTI_CURRENCY.md (currency, rate entities)
    ├── REQUIREMENTS_BUDGETS.md (budget entity)
    ├── REQUIREMENTS_REPORTS.md (report entity)
    └── REQUIREMENTS_ADMIN.md (audit log entity)
```

---

## Quick Lookup by Task

### Adding a New Account Type
1. Read `REQUIREMENTS_CORE.md#account-types`
2. Check `REQUIREMENTS_DATABASE.md#accounts`
3. Update `REQUIREMENTS_API.md#account-management-api`
4. Update `REQUIREMENTS_QUERY_ENGINE.md#depth-control`

### Creating a Journal Entry
1. Read `REQUIREMENTS_CORE.md#journal-entries`
2. Check `REQUIREMENTS_DATABASE.md#journal-lines`
3. Review `REQUIREMENTS_API.md#journal-management-api`
4. Verify currency in `REQUIREMENTS_MULTI_CURRENCY.md`

### Adding a Rate Provider
1. Read `REQUIREMENTS_PLUGIN_SYSTEM.md`
2. Check `REQUIREMENTS_DATABASE.md#providers`
3. Review `REQUIREMENTS_API.md#provider-management-api`
4. Update `REQUIREMENTS_MULTI_CURRENCY.md#rate-retrieval`

### Generating a Balance Sheet
1. Read `REQUIREMENTS_REPORTS.md#balance-sheet`
2. Check `REQUIREMENTS_QUERY_ENGINE.md#balance-queries`
3. Review currency conversion in `REQUIREMENTS_MULTI_CURRENCY.md`
4. Verify account structure in `REQUIREMENTS_CORE.md`

### Setting Up a Budget
1. Read `REQUIREMENTS_BUDGETS.md`
2. Check `REQUIREMENTS_DATABASE.md#budgets`
3. Review `REQUIREMENTS_API.md#budget-management-api`
4. Understand tracking in `REQUIREMENTS_QUERY_ENGINE.md`

### Admin Operations
1. Read `REQUIREMENTS_ADMIN.md`
2. Check `REQUIREMENTS_API.md#admin-api-endpoints`
3. Review audit logging in `REQUIREMENTS_DATABASE.md#audit-logs`

---

## Cross-Reference Syntax

In each requirements file, use this pattern:

```markdown
**See also:**
- [Core Features](../REQUIREMENTS_CORE.md#account-types)
- [API Specs](../REQUIREMENTS_API.md#journal-endpoints)
- [Database](../REQUIREMENTS_DATABASE.md#journal-entries)
```

---

## Version Info

- **Last Updated:** 2026-01-18
- **Version:** 1.0.0
- **Status:** Initial decomposition
