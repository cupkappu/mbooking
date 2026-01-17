# Multi-Currency Requirements

**Module:** Currency & Exchange Rates
**References:** [PRD](../PRD.md), [Core Features](../REQUIREMENTS_CORE.md), [Database](../REQUIREMENTS_DATABASE.md), [API](../REQUIREMENTS_API.md)

---

## Currency Registry

### 1.1 Supported Currency Types

| Type | Decimal Places | Examples |
|------|----------------|----------|
| **Fiat** | 2 | USD, HKD, CNY, EUR, JPY |
| **Crypto** | 8 | BTC, ETH, USDT |

#### Currency Fields
| Field | Type | Description |
|-------|------|-------------|
| `code` | String(3) | ISO 4217 code (primary key) |
| `name` | String | Display name (e.g., "US Dollar") |
| `symbol` | String | Currency symbol (e.g., "$", "¥") |
| `decimal_places` | Integer | 2 for fiat, 8 for crypto |
| `is_active` | Boolean | Whether usable in transactions |

**See also:**
- [Database - currencies table](../REQUIREMENTS_DATABASE.md#currencies)
- [API - Currency endpoints](../REQUIREMENTS_API.md#currency-management)

### 1.2 Currency Operations

#### Active Currencies
- Only active currencies can be used in accounts/transactions
- Deactivating a currency prevents new usage (existing data preserved)
- Cascade deactivation blocked if in use

#### Currency Display
- Format based on `decimal_places`
- Symbol placement (before/after varies by locale)
- Thousand separators

---

## Exchange Rate System

### 2.1 Rate Storage

#### exchange_rates Table
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `provider_id` | UUID | Source provider |
| `from_currency` | String(3) | Source currency |
| `to_currency` | String(3) | Target currency |
| `rate` | Decimal | Exchange rate value |
| `date` | Date | Rate date (one rate per date) |
| `fetched_at` | Timestamp | When rate was retrieved |

**See also:**
- [Database - exchange_rates](../REQUIREMENTS_DATABASE.md#exchange-rates)
- [Plugin System - Rate providers](../REQUIREMENTS_PLUGIN_SYSTEM.md)

### 2.2 Rate Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Latest** | Most recent available rate | Real-time conversions |
| **Historical** | Rate for specific date | Past transaction conversion |
| **Average** | Daily/monthly average | Reports and analytics |

### 2.3 Rate Retrieval Priority

When requesting rate for a currency pair:

1. Check cache (latest rates, configurable TTL)
2. Query provider for latest if cache miss
3. Fallback to other providers if primary fails
4. Use manual rate if all providers fail (admin input)

**See also:**
- [Plugin System - Provider fallback](../REQUIREMENTS_PLUGIN_SYSTEM.md#fallback-strategy)

---

## Transaction Currency Handling

### 3.1 Multi-Currency Transactions

When creating a journal entry with multiple currencies:

```
Example: USD to HKD conversion

Entry Date: 2025-01-15
Description: Exchange USD to HKD

Lines:
┌─────────────────┬─────────┬──────────┬─────────────┐
│ Account         │ Amount  │ Currency │ Rate        │
├─────────────────┼─────────┼──────────┼─────────────┤
│ assets:bank:USD │ -1000   │ USD      │ 1.0         │
│ assets:cash:HKD │ +7785   │ HKD      │ 7.785       │
└─────────────────┴─────────┴──────────┴─────────────┘
```

#### Requirements
1. One line must use account's default currency (base)
2. All other lines require `exchange_rate` field
3. `converted_amount` calculated and stored for reporting

### 3.2 Currency Conversion Formula

```
converted_amount = amount * exchange_rate
```

```
exchange_rate = from_rate / to_rate
(when rates stored as "to USD")
```

### 3.3 Rate Date Selection

| Setting | Behavior |
|---------|----------|
| `transaction_date` | Use rate from journal entry date |
| `settlement_date` | Use rate from actual settlement |
| `custom_date` | Admin-specified date |

**See also:**
- [Core Features - Journal validation](../REQUIREMENTS_CORE.md#validation-rules)

---

## Rate Provider Integration

### 4.1 Provider Types

| Type | Description | Configuration |
|------|-------------|---------------|
| **JS Plugin** | Custom Node.js module | File path reference |
| **REST API** | HTTP-based provider | Base URL, API key, endpoints |
| **Manual** | Admin-entered rates | No external source |

### 4.2 Provider Capabilities

| Capability | Description |
|------------|-------------|
| `supports_historical` | Can query rates for past dates |
| `supports_date_query` | Accepts date parameter |
| `record_history` | Auto-save rates to database |

**See also:**
- [Plugin System - Provider interface](../REQUIREMENTS_PLUGIN_SYSTEM.md#provider-interface)
- [API - Provider management](../REQUIREMENTS_API.md#provider-management-api)

---

## Cross-References

```
See also:
- [Core Features - Journal entries](../REQUIREMENTS_CORE.md#journal-entries)
- [Database - exchange_rates table](../REQUIREMENTS_DATABASE.md#exchange-rates)
- [API - Rate endpoints](../REQUIREMENTS_API.md#rate-engine-api)
- [Plugin System - Provider architecture](../REQUIREMENTS_PLUGIN_SYSTEM.md)
- [Query Engine - Currency conversion in queries](../REQUIREMENTS_QUERY_ENGINE.md#currency-conversion)
```
