# API Specifications

**Module:** REST API Design
**References:** [PRD](../PRD.md), [Core Features](../REQUIREMENTS_CORE.md), [Database](../REQUIREMENTS_DATABASE.md)

---

## API Design Principles

### 1.1 Style

- **RESTful**: Resource-oriented URLs
- **JSON Body**: Complex queries via POST body
- **Authentication**: Bearer token (JWT from Auth.js)
- **Versioning**: URL path `/api/v1/`

### 1.2 Response Format

#### Success Response
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      offset: number;
      limit: number;
      total: number;
      has_more: boolean;
    };
    cache_hit?: boolean;
  };
}
```

#### Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;      // ERROR_AUTH_INVALID, ERROR_VALIDATION_FAILED
    message: string;
    details?: any;
  };
}
```

---

## Account Management API

### 2.1 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/accounts` | Get account tree |
| POST | `/api/v1/accounts` | Create account |
| GET | `/api/v1/accounts/:id` | Get account |
| PUT | `/api/v1/accounts/:id` | Update account |
| DELETE | `/api/v1/accounts/:id` | Delete account |
| POST | `/api/v1/accounts/move` | Move account |

### 2.2 Create Account Request

```typescript
// POST /api/v1/accounts
{
  "name": "Checking Account",
  "type": "assets",
  "parent_id": "uuid-of-bank",  // Optional
  "currency": "HKD"
}
```

### 2.3 Response (Account Tree)

```typescript
// GET /api/v1/accounts
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "uuid",
        "name": "Assets",
        "type": "assets",
        "path": "assets",
        "depth": 0,
        "children": [...]
      }
    ]
  }
}
```

---

## Journal Management API

### 3.1 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/journal` | List journal entries |
| POST | `/api/v1/journal` | Create journal entry |
| GET | `/api/v1/journal/:id` | Get entry |
| PUT | `/api/v1/journal/:id` | Update entry |
| DELETE | `/api/v1/journal/:id` | Delete entry |

### 3.2 Create Journal Request

```typescript
// POST /api/v1/journal
{
  "date": "2025-01-15T12:00:00Z",
  "description": "7-11便利店午餐",
  "lines": [
    {
      "account_path": "expense:food",
      "amount": -50,
      "currency": "HKD",
      "tags": ["food", "lunch"],
      "remarks": "叉烧饭"
    },
    {
      "account_path": "assets:cash",
      "amount": 50,
      "currency": "HKD"
    }
  ]
}
```

---

## Rate Engine API

### 4.1 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/rates/latest` | Get latest rates |
| GET | `/api/v1/rates/history` | Get rate history |
| GET | `/api/v1/rates/convert` | Convert amount |
| GET | `/api/v1/rates/providers` | List providers |
| POST | `/api/v1/rates/providers` | Create provider |
| PUT | `/api/v1/rates/providers/:id` | Update provider |
| POST | `/api/v1/rates/fetch` | Manual fetch |

### 4.2 Rate Examples

```typescript
// GET /api/v1/rates/latest?from=USD&to=HKD,CNY
{
  "success": true,
  "data": {
    "timestamp": "2025-01-17T10:00:00Z",
    "rates": [
      { "from": "USD", "to": "HKD", "rate": 7.7850 },
      { "from": "USD", "to": "CNY", "rate": 7.2450 }
    ]
  }
}

// GET /api/v1/rates/convert?amount=100&from=HKD&to=USD
{
  "success": true,
  "data": {
    "amount": 100,
    "from": "HKD",
    "to": "USD",
    "converted_amount": 12.844,
    "rate": 7.785,
    "date": "2025-01-17"
  }
}
```

---

## Provider Management API

### 5.1 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/providers` | List providers |
| POST | `/api/v1/providers` | Create provider |
| GET | `/api/v1/providers/:id` | Get provider |
| PUT | `/api/v1/providers/:id` | Update provider |
| DELETE | `/api/v1/providers/:id` | Delete provider |
| POST | `/api/v1/providers/:id/test` | Test connection |

### 5.2 Provider Config (REST API Type)

```typescript
// POST /api/v1/providers
{
  "name": "Exchangerate.host",
  "type": "rest_api",
  "config": {
    "base_url": "https://api.exchangerate.host",
    "headers": { "Accept": "application/json" }
  },
  "supported_currencies": ["USD", "EUR", "GBP", "JPY", "CNY", "HKD"],
  "supports_historical": true,
  "supports_date_query": true,
  "record_history": true,
  "is_active": true
}
```

---

## Budget Management API

### 6.1 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/budgets` | List budgets |
| POST | `/api/v1/budgets` | Create budget |
| GET | `/api/v1/budgets/:id` | Get budget |
| PUT | `/api/v1/budgets/:id` | Update budget |
| DELETE | `/api/v1/budgets/:id` | Delete budget |
| GET | `/api/v1/budgets/:id/progress` | Get progress |

---

## Query Engine API

### 7.1 Balance Query

**POST** `/api/v1/query/balances`

```typescript
// Request
{
  "date_range": { "from": "2025-01-01", "to": "2025-12-31" },
  "depth": 1,
  "convert_to": "USD",
  "pagination": { "offset": 0, "limit": 50 }
}
```

### 7.2 Journal Query

**POST** `/api/v1/query/journal-entries`

```typescript
// Request
{
  "date_range": { "from": "2025-01-01", "to": "2025-12-31" },
  "tags": ["food"],
  "pagination": { "offset": 0, "limit": 50 }
}
```

---

## Admin API Endpoints

### 8.1 User Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/users` | List users |
| POST | `/api/v1/admin/users` | Create user |
| PUT | `/api/v1/admin/users/:id` | Update user |
| DELETE | `/api/v1/admin/users/:id` | Soft-delete user |

### 8.2 System Config

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/system/config` | Get config |
| PUT | `/api/v1/admin/system/config` | Update config |

### 8.3 Audit Logs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/logs` | Query audit logs |
| GET | `/api/v1/admin/export` | Trigger export |

### 8.4 Health Check

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/health` | System health |

**See also:**
- [Admin Requirements - Full details](../REQUIREMENTS_ADMIN.md)

---

## Authentication

### 9.1 Auth Flow

- **Frontend**: Auth.js (NextAuth) handles OAuth/Credentials
- **Backend**: JWT validation via Passport
- **Token**: Bearer token in `Authorization` header

### 9.2 Authelia Support

Authelia handled at reverse proxy level:
- Header: `X-Auth-User` passed to backend
- Backend validates header, sets user context

---

## Cross-References

```
See also:
- [Core Features - Detailed entity specs](../REQUIREMENTS_CORE.md)
- [Database - Entity definitions](../REQUIREMENTS_DATABASE.md)
- [Admin Requirements - Admin endpoints](../REQUIREMENTS_ADMIN.md)
```
