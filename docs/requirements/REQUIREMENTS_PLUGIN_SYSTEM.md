# Plugin System Requirements

**Module:** Rate Provider Extensibility
**References:** [PRD](../PRD.md), [Multi-Currency](../REQUIREMENTS_MULTI_CURRENCY.md), [Database](../REQUIREMENTS_DATABASE.md), [API](../REQUIREMENTS_API.md)

---

## Overview

Plugin system enables extensible exchange rate providers through:
- **JS Plugins**: Custom Node.js modules for specialized sources
- **REST API Providers**: HTTP-based providers with config-only setup
- **Built-in Providers**: Common exchange rate services

---

## Provider Types

### 1.1 JS Plugin Provider

Custom Node.js module loaded dynamically.

#### Plugin Structure
```javascript
// backend/plugins/js/my-provider.js
class MyRateProvider {
  constructor(config) {
    this.config = config;
    this.id = 'my-provider';
    this.name = 'My Rate Provider';
    this.version = '1.0.0';
    this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];
    this.supportsHistorical = true;
    this.supportsDateQuery = true;
  }

  async getLatestRate(from, to) {
    // Implementation
  }

  async getRateAtDate(from, to, date) {
    // Implementation
  }

  async getAllRates(baseCurrency) {
    // Implementation
  }

  async testConnection() {
    // Health check
  }

  destroy() {
    // Cleanup
  }
}

module.exports = (config) => new MyRateProvider(config);
```

#### Plugin Location
```
backend/plugins/js/
├── providers/
│   ├── exchangerate-host.js
│   ├── coinbase.js
│   └── custom-provider.js
└── index.js  # Registry
```

### 1.2 REST API Provider

HTTP-based provider configured via JSON (no code).

#### Configuration Structure
```json
{
  "name": "ExchangeRate.host",
  "type": "rest_api",
  "config": {
    "base_url": "https://api.exchangerate.host",
    "endpoints": {
      "latest": "/latest",
      "historical": "/{date}"
    },
    "response_mapping": {
      "rate": "rates.{to}",
      "timestamp": "date"
    },
    "headers": {
      "Accept": "application/json"
    }
  },
  "supported_currencies": ["USD", "EUR", "GBP", "JPY", "CNY", "HKD"],
  "supports_historical": true,
  "supports_date_query": true,
  "record_history": true
}
```

### 1.3 Built-in Providers

| Provider | Type | Currencies | Historical |
|----------|------|------------|------------|
| **ExchangeRate.host** | REST API | Major fiat | Yes |
| **Coinbase** | REST API | Crypto | Yes |
| **Manual** | Manual | All | N/A |

---

## Provider Interface

### 2.1 Required Methods

```typescript
interface RateProvider {
  // Metadata
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly supportedCurrencies: string[];

  // Capabilities
  readonly supportsHistorical: boolean;
  readonly supportsDateQuery: boolean;

  // Core methods
  getLatestRate(from: string, to: string): Promise<RateResult>;
  getRateAtDate(from: string, to: string, date: Date): Promise<RateResult>;
  getAllRates(baseCurrency: string): Promise<Map<string, number>>;

  // Lifecycle
  testConnection(): Promise<boolean>;
  destroy(): void;
}

interface RateResult {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  source: string;
}
```

### 2.2 Optional Methods

| Method | Description | Default |
|--------|-------------|---------|
| `getRateRange(from, to, dateRange)` | Batch historical rates | Per-date calls |
| `validateConfig(config)` | Config validation | Skip |

---

## Plugin Management

### 3.1 Plugin Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  Plugin States                                              │
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│  │ Created │───►│ Testing │───►│ Active  │───►│ Disabled│ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘ │
│       │              │              │              │       │
│       ▼              ▼              ▼              ▼       │
│  Config error   Connection    Serving      No queries     │
│                 failed         requests                    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Plugin Operations

| Operation | Description |
|-----------|-------------|
| **Install** | Register new JS plugin file |
| **Configure** | Set provider parameters |
| **Test** | Validate connection |
| **Enable** | Start serving requests |
| **Disable** | Stop serving, keep config |
| **Update** | Replace plugin file |
| **Uninstall** | Remove plugin and config |

**See also:**
- [API - Provider management](../REQUIREMENTS_API.md#provider-management-api)

---

## Fallback Strategy

### 4.1 Provider Priority

When requesting a rate:

1. **Primary provider** (user-configured)
2. **Secondary provider** (fallback)
3. **Built-in provider** (last resort)
4. **Manual rate** (admin input)

### 4.2 Fallback Configuration

```json
{
  "provider_chain": [
    { "id": "primary", "fallback": "secondary" },
    { "id": "secondary", "fallback": "built-in" }
  ]
}
```

### 4.3 Failure Handling

| Failure Type | Action |
|--------------|--------|
| **Timeout** | Try fallback after 5s |
| **HTTP Error** | Try fallback, log error |
| **No Rate** | Return error, manual entry option |

---

## Security

### 5.1 Plugin Sandboxing

- JS plugins run in isolated context
- No access to filesystem outside plugins dir
- Network access limited to configured domains
- Timeout protection (max 30s per call)

### 5.2 Credential Storage

- API keys encrypted at rest
- Credentials never logged
- Per-tenant credential isolation

---

## Cross-References

```
See also:
- [Multi-Currency - Exchange rate system](../REQUIREMENTS_MULTI_CURRENCY.md#exchange-rate-system)
- [Database - providers table](../REQUIREMENTS_DATABASE.md#providers)
- [API - Provider endpoints](../REQUIREMENTS_API.md#provider-management-api)
- [Scheduler - Rate fetching](../REQUIREMENTS_SCHEDULER.md) (if exists)
```
