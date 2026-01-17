# Admin Management System Requirements

**Module:** System Administration
**References:** [PRD](../PRD.md), [API](../REQUIREMENTS_API.md), [Database](../REQUIREMENTS_DATABASE.md)

---

## Overview

Admin system provides comprehensive management capabilities for system administrators.

**Requires:** `admin` role (separate from regular users)

---

## User Management

### 1.1 User Operations

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| List users | `GET /api/v1/admin/users` | Paginated list with filters |
| Create user | `POST /api/v1/admin/users` | Create new user account |
| Get user | `GET /api/v1/admin/users/:id` | User details |
| Update user | `PUT /api/v1/admin/users/:id` | Modify user |
| Disable user | `DELETE /api/v1/admin/users/:id` | Soft delete (preserves data) |
| Reset password | `POST /api/v1/admin/users/:id/reset-password` | Force password reset |

### 1.2 User Fields

| Field | Type | Editable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `email` | String | Yes | Login email |
| `name` | String | Yes | Display name |
| `role` | Enum | Yes | admin, user, viewer |
| `is_active` | Boolean | Yes | Account status |
| `created_at` | Timestamp | No | Creation date |
| `last_login` | Timestamp | No | Last login time |

### 1.3 Bulk Operations

```typescript
interface BulkUserAction {
  action: 'enable' | 'disable' | 'role_change';
  user_ids: string[];
  parameters?: {
    new_role?: string;
  };
}
```

**See also:**
- [API - Admin user endpoints](../REQUIREMENTS_API.md#admin-user-endpoints)
- [Frontend UI - Role-based Admin Access](../REQUIREMENTS_FRONTEND_UI.md#3-role-based-admin-access)

---

## System Settings

### 2.1 Configurable Settings

| Category | Setting | Type | Default |
|----------|---------|------|---------|
| **Currency** | default_currency | String | USD |
| **Currency** | fiat_decimals | Number | 2 |
| **Currency** | crypto_decimals | Number | 8 |
| **Localization** | timezone | String | UTC |
| **Localization** | date_format | String | YYYY-MM-DD |
| **Security** | session_timeout | Number | 3600 |
| **Security** | mfa_required | Boolean | false |

### 2.2 Settings API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/system/config` | Get all settings |
| PUT | `/api/v1/admin/system/config` | Update settings |
| GET | `/api/v1/admin/system/config/:key` | Get single setting |
| PUT | `/api/v1/admin/system/config/:key` | Update single setting |

### 2.3 Settings Audit

All setting changes logged:
```typescript
interface SettingChangeLog {
  setting_key: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  changed_at: Timestamp;
}
```

---

## Provider Administration

### 3.1 Provider Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/providers` | List all providers |
| POST | `/api/v1/admin/providers` | Create provider |
| GET | `/api/v1/admin/providers/:id` | Provider details |
| PUT | `/api/v1/admin/providers/:id` | Update provider |
| DELETE | `/api/v1/admin/providers/:id` | Delete provider |
| POST | `/api/v1/admin/providers/:id/test` | Test connection |
| POST | `/api/v1/admin/providers/:id/toggle` | Enable/disable |

### 3.2 Provider Status

| Status | Description |
|--------|-------------|
| **active** | Serving rate requests |
| **testing** | Connection test in progress |
| **error** | Last test failed |
| **disabled** | Manually disabled |

**See also:**
- [Plugin System - Provider lifecycle](../REQUIREMENTS_PLUGIN_SYSTEM.md#plugin-management)

---

## Audit Logs

### 4.1 Logged Events

| Category | Events |
|----------|--------|
| **Auth** | Login, logout, password change, MFA |
| **Data** | Create, update, delete (all entities) |
| **Config** | Settings changes, provider changes |
| **System** | Backup, migration, cache clear |

### 4.2 Audit Log Schema

```typescript
interface AuditLog {
  id: UUID;
  tenant_id?: UUID;        // Null for system-wide
  user_id: string;
  action: string;          // e.g., 'journal.create'
  entity_type: string;     // e.g., 'journal_entry'
  entity_id?: string;
  old_value?: JSON;
  new_value?: JSON;
  ip_address: string;
  user_agent: string;
  created_at: Timestamp;
}
```

### 4.3 Audit Query API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/logs` | Query logs with filters |
| GET | `/api/v1/admin/logs/:id` | Log details |
| GET | `/api/v1/admin/logs/export` | Export logs (CSV) |

### 4.4 Log Filters

```typescript
interface LogQuery {
  date_range?: { from: string; to: string };
  user_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  pagination?: { offset: number; limit: number };
}
```

---

## Data Export

### 5.1 Export Scope

| Scope | Description |
|-------|-------------|
| **Full** | All tenant data (accounts, journals, rates) |
| **Accounts** | Account hierarchy and balances |
| **Journal** | All journal entries |
| **Rates** | Exchange rate history |

### 5.2 Export Format

| Format | Description |
|--------|-------------|
| **JSON** | Full data restore |
| **CSV** | Spreadsheet analysis |
| **SQL** | Direct database import |

### 5.3 Export API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/export` | Trigger export |
| GET | `/api/v1/admin/export/:id` | Export status |
| GET | `/api/v1/admin/export/:id/download` | Download file |

### 5.4 Export Process

```
1. Admin triggers export
2. System creates background job
3. Generate file (may take minutes)
4. Compress and store
5. Notify admin when ready
6. Download link (valid 24 hours)
```

---

## Plugin Management

### 6.1 Plugin Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/plugins` | List installed plugins |
| POST | `/api/v1/admin/plugins` | Install new plugin |
| GET | `/api/v1/admin/plugins/:id` | Plugin details |
| PUT | `/api/v1/admin/plugins/:id` | Update plugin config |
| DELETE | `/api/v1/admin/plugins/:id` | Uninstall plugin |
| POST | `/api/v1/admin/plugins/:id/reload` | Hot-reload plugin |

### 6.2 Plugin Security

- Plugins reviewed before approval (future)
- Sandboxed execution
- Resource limits (memory, CPU, timeout)

**See also:**
- [Plugin System - Security](../REQUIREMENTS_PLUGIN_SYSTEM.md#security)

---

## Scheduler Control

### 7.1 Rate Fetching Schedule

| Setting | Description |
|---------|-------------|
| **enabled** | Enable/disable scheduled fetching |
| **interval** | Fetch interval in seconds |
| **providers** | Provider IDs to fetch |
| **currencies** | Target currency list |
| **base_currency** | Base currency for rates |

### 7.2 Scheduler API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/scheduler/config` | Get schedule config |
| PUT | `/api/v1/admin/scheduler/config` | Update schedule |
| POST | `/api/v1/admin/scheduler/fetch` | Manual trigger |
| GET | `/api/v1/admin/scheduler/history` | Fetch history |

### 7.3 Manual Fetch

```typescript
interface ManualFetchRequest {
  provider_ids?: string[];  // All if not specified
  currencies?: string[];    // All active if not specified
  date?: string;            // Specific date or 'latest'
}
```

---

## Health Monitoring

### 8.1 Health Check API

**GET** `/api/v1/admin/health`

### 8.2 Health Components

| Component | Status | Details |
|-----------|--------|---------|
| **Database** | healthy/degraded/fail | Connection, query time |
| **Cache** | healthy/degraded/fail | Redis connection, memory |
| **Providers** | healthy/degraded/fail | Active count, error rate |
| **Storage** | healthy/degraded/fail | Disk usage |

### 8.3 Health Response

```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'fail';
  timestamp: string;
  components: {
    database: ComponentHealth;
    cache: ComponentHealth;
    providers: ComponentHealth;
    storage: ComponentHealth;
  };
  metrics: {
    uptime: number;
    memory_usage: number;
    active_users: number;
    requests_per_minute: number;
  };
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'fail';
  message?: string;
  details?: Record<string, any>;
}
```

---

## Cross-References

```
See also:
- [API - Admin endpoints summary](../REQUIREMENTS_API.md#admin-api-endpoints)
- [Database - Audit log schema](../REQUIREMENTS_DATABASE.md#audit-logs)
- [Plugin System - Plugin management](../REQUIREMENTS_PLUGIN_SYSTEM.md#plugin-management)
- [Scheduler - Rate fetching](../REQUIREMENTS_SCHEDULER.md) (if exists)
```
