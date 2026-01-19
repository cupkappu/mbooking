# Row Level Security (RLS) Architecture Requirements

**Module:** Security & Tenant Isolation  
**Date:** 2026-01-19  
**Status:** Requirements Specification  
**Priority:** Critical Security  

---

## Executive Summary

**Current State:** The application relies entirely on manual application-level tenant filtering with **inconsistent implementation** and **critical security vulnerabilities**.

**Target State:** Multi-layer tenant isolation with database-level RLS enforcement, automatic application-level filtering, and comprehensive audit logging.

---

## 1. Problem Statement

### 1.1 Critical Vulnerabilities Found

| ID | Severity | Location | Issue |
|----|----------|----------|-------|
| RLS-001 | **CRITICAL** | `admin.service.ts:640` | `journalLineRepository.find()` without tenant filter in data export |
| RLS-002 | **CRITICAL** | `admin.service.ts:655` | `journalLineRepository.find()` without tenant filter in journal export |
| RLS-003 | HIGH | `app.module.ts` | `synchronize: true` bypasses migration system, prevents RLS implementation |
| RLS-004 | HIGH | All services | Manual tenant filtering, no automatic enforcement |
| RLS-005 | HIGH | Database | No PostgreSQL RLS policies enabled |

### 1.2 Impact Assessment

- **Data Breach Risk:** Admin users can export data from other tenants
- **Compliance Violation:** Multi-tenant systems require database-level isolation
- **Development Risk:** Manual filtering is error-prone, easy to miss in new code

---

## 2. Current Architecture Analysis

### 2.1 Tenant Isolation Implementation (As-Is)

```
Current Flow:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   JWT Auth  │────▶│  Extract    │────▶│  Manual     │────▶│  Database   │
│             │     │  tenantId   │     │  .where()   │     │  Query      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                            │
                     ❌ No validation
                     ❌ Easy to forget
                     ❌ No automatic enforcement
```

### 2.2 Entity Classification

#### Tenant-Isolated Tables (Require RLS)

| Entity | File | tenant_id Column | Current Filtering |
|--------|------|------------------|-------------------|
| accounts | `account.entity.ts` | ✅ `tenant_id: string` | Manual |
| journal_entries | `journal-entry.entity.ts` | ✅ `tenant_id: string` | Manual |
| journal_lines | `journal-line.entity.ts` | ✅ `tenant_id: string` | Manual (with bugs) |
| budgets | `budget.entity.ts` | ✅ `tenant_id: string` | Manual |
| budget_alerts | `budget-alert.entity.ts` | ✅ `tenant_id: string` | Manual |
| budget_templates | `budget-template.entity.ts` | ✅ `tenant_id: string` | Manual |
| reports | `report-storage.entity.ts` | ✅ `tenant_id: string` | Manual |
| audit_logs | `audit-log.entity.ts` | ⚠️ `tenant_id: string \| null` | Manual |

#### Global Tables (No RLS - Correct)

| Entity | File | Reason |
|--------|------|--------|
| users | `user.entity.ts` | Global authentication |
| tenants | `tenant.entity.ts` | Tenant definitions |
| currencies | `currency.entity.ts` | Global registry |
| exchange_rates | `exchange-rate.entity.ts` | Global rates |
| providers | `provider.entity.ts` | Global configs |

---

## 3. Target Architecture

### 3.1 Multi-Layer Security Model

```
Target Flow - Defense in Depth:
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: PostgreSQL RLS (Database Level)                                │
│   - ALTER TABLE ... ENABLE ROW LEVEL SECURITY                          │
│   - CREATE POLICY ... USING (tenant_id = current_setting)              │
│   - Blocks direct database access, SQL injection                        │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 2: TypeORM Tenant Subscriber (ORM Level)                          │
│   - @Injectable() TenantSubscriber                                     │
│   - beforeInsert: Auto-inject tenant_id                                │
│   - beforeUpdate: Verify tenant_id matches context                     │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 3: Tenant Middleware & Context (Application Level)               │
│   - AsyncLocalStorage for tenant context                               │
│   - Middleware sets current_setting('app.current_tenant_id')           │
│   - Request-scoped tenant isolation                                    │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 4: Service-Level Validation (Code Level)                         │
│   - Repository base class with automatic tenant filtering              │
│   - BaseService<T>.find() always includes tenant_id                    │
│   - Audit logging for all tenant-scoped operations                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL Database                              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;            │  │
│  │  CREATE POLICY tenant_isolation ON journal_lines                  │  │
│  │    FOR ALL USING (tenant_id = current_setting('app.tenant_id')); │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│   NestJS Application      │     │   TypeORM Subscriber       │
│  ┌─────────────────────┐  │     │  ┌─────────────────────┐  │
│  │ TenantMiddleware    │  │     │  │ TenantSubscriber    │  │
│  │ - AsyncLocalStorage │──┼────▶│  │ - beforeInsert()    │  │
│  │ - Set RLS Context   │  │     │  │ - beforeUpdate()    │  │
│  └─────────────────────┘  │     │  │ - beforeRemove()    │  │
│  ┌─────────────────────┐  │     │  └─────────────────────┘  │
│  │ BaseRepository<T>   │  │     └───────────────────────────┘
│  │ - Auto tenant filter│  │
│  │ - find(), findOne() │  │
│  └─────────────────────┘  │
└───────────────────────────┘
```

---

## 4. Functional Requirements

### 4.1 Database-Level RLS

**REQ-RLS-001:** Enable RLS on Tenant-Isolated Tables

```
Description:
All tables with tenant_id column must have PostgreSQL Row Level Security enabled.

Implementation:
- Create migration: database/migrations/001_enable_rls.sql
- Enable RLS on: accounts, journal_entries, journal_lines, budgets,
  budget_alerts, budget_templates, reports, audit_logs

SQL:
```sql
-- Enable RLS on accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY accounts_tenant_isolation ON accounts
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Enable RLS on journal_lines
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_lines_tenant_isolation ON journal_lines
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
```

**REQ-RLS-002:** RLS Policy for Bypass Roles

```
Description:
Admin users may need to access cross-tenant data for system maintenance.

Implementation:
```sql
-- Create bypass role
CREATE ROLE admin_bypass;
GRANT admin_bypass TO postgres;  -- Or service account

-- Modify policy to allow bypass
CREATE POLICY admin_bypass_policy ON journal_lines
  FOR ALL USING (
    current_setting('app.current_tenant_id', true)::uuid IS NULL
    OR
    pg_has_role(current_user, 'admin_bypass', 'member')
  );
```
```

### 4.2 Application-Level Tenant Context

**REQ-RLS-003:** Tenant Middleware

```
Description:
Set PostgreSQL session context for RLS before each request.

File: backend/src/common/middleware/tenant.middleware.ts

Implementation:
```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private dataSource: DataSource,
  ) {}

  async use(req: Request, res: Response, next: () => void) {
    const tenantId = req.user?.tenantId;
    
    if (tenantId) {
      await this.dataSource.query(
        `SELECT set_config('app.current_tenant_id', ?, false)`,
        [tenantId]
      );
    }
    
    next();
  }
}
```
```

**REQ-RLS-004:** AsyncLocalStorage for Tenant Context

```
Description:
Store tenant context in Node.js AsyncLocalStorage for access in subscribers.

File: backend/src/common/context/tenant.context.ts

Implementation:
```typescript
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  userId: string;
  requestId: string;
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

export class TenantContext {
  static run<T>(context: TenantContext, callback: () => T): T {
    return tenantStorage.run(context, callback);
  }

  static getCurrent(): TenantContext | undefined {
    return tenantStorage.getStore();
  }

  static get tenantId(): string | undefined {
    return this.getCurrent()?.tenantId;
  }

  static get userId(): string | undefined {
    return this.getCurrent()?.userId;
  }
}
```
```

### 4.3 TypeORM Tenant Subscriber

**REQ-RLS-005:** Auto-Inject tenant_id on Insert

```
Description:
Automatically inject tenant_id into all new entities.

File: backend/src/common/subscribers/tenant.subscriber.ts

Implementation:
```typescript
@Injectable()
export class TenantSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  beforeInsert(event: InsertEvent<any>) {
    if (event.entity.tenant_id === undefined) {
      const tenantId = TenantContext.tenantId;
      if (tenantId) {
        event.entity.tenant_id = tenantId;
      } else {
        throw new Error('No tenant context for insert operation');
      }
    }
  }

  beforeUpdate(event: UpdateEvent<any>) {
    // Ensure tenant_id cannot be changed
    if (event.entity?.tenant_id && event.databaseEntity?.tenant_id) {
      if (event.entity.tenant_id !== event.databaseEntity.tenant_id) {
        throw new Error('Cannot change tenant_id of existing record');
      }
    }
  }
}
```
```

### 4.4 Base Repository with Automatic Filtering

**REQ-RLS-006:** Tenant-Aware Repository

```
Description:
Create base repository class that automatically filters by tenant.

File: backend/src/common/repositories/tenant-aware.repository.ts

Implementation:
```typescript
export class TenantAwareRepository<T extends BaseEntity> extends Repository<T> {
  constructor(
    entityTarget: EntityTarget<T>,
    manager: EntityManager,
    private tenantId: string,
  ) {
    super(entityTarget, manager);
  }

  find(options?: FindManyOptions<T>): Promise<T[]> {
    return super.find({
      ...options,
      where: {
        ...(options?.where || {}),
        tenant_id: this.tenantId,
      },
    });
  }

  findOne(options?: FindOneOptions<T>): Promise<T | null> {
    return super.findOne({
      ...options,
      where: {
        ...(options?.where || {}),
        tenant_id: this.tenantId,
      },
    });
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    const qb = super.createQueryBuilder(alias);
    return qb.andWhere(`${alias}.tenant_id = :tenantId`, { tenantId: this.tenantId });
  }
}
```
```

---

## 5. Security Requirements

### 5.1 Audit Logging

**REQ-RLS-007:** Tenant-Aware Audit Logs

```
Description:
All tenant-scoped operations must be logged with tenant_id.

Implementation:
- Update audit_log entity: tenant_id becomes NON-NULLABLE
- Log tenant context for all create/update/delete operations
- Include tenant_id in all audit entries

File: backend/src/common/decorators/audit.decorator.ts
```

### 5.2 Validation

**REQ-RLS-008:** Tenant Validation on All Controllers

```
Description:
Controllers must validate that the requesting user belongs to the target tenant.

Implementation:
```typescript
@Controller('accounts')
export class AccountsController {
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const account = await this.accountsService.findOne(id, tenantId);
    if (account.tenant_id !== tenantId) {
      throw new ForbiddenException('Access denied to this account');
    }
    return account;
  }
}
```
```

---

## 6. Migration Plan

### 6.1 Phase 1: Critical Security Fixes

| Task | File | Action |
|------|------|--------|
| Fix admin.service.ts data leak | `admin.service.ts:640,655` | Add tenant_id filter ✅ DONE |
| Disable synchronize: true | `app.module.ts` | Set to false |
| Create initial RLS migration | `database/migrations/001_enable_rls.sql` | Enable RLS |

### 6.2 Phase 2: Infrastructure

| Task | File | Action |
|------|------|--------|
| Create TenantContext | `common/context/tenant.context.ts` | AsyncLocalStorage |
| Create TenantMiddleware | `common/middleware/tenant.middleware.ts` | Set RLS context |
| Create TenantSubscriber | `common/subscribers/tenant.subscriber.ts` | Auto-inject tenant_id |

### 6.3 Phase 3: Repository Refactoring

| Task | File | Action |
|------|------|--------|
| Create TenantAwareRepository | `common/repositories/...` | Base repository |
| Refactor accounts service | `accounts.service.ts` | Use base repository |
| Refactor journal service | `journal.service.ts` | Use base repository |
| Refactor budgets service | `budgets.service.ts` | Use base repository |

### 6.4 Phase 4: Testing & Validation

| Task | Description |
|------|-------------|
| Unit Tests | Test tenant filtering on all repositories |
| Integration Tests | Verify cross-tenant access is blocked |
| Security Audit | Verify no tenant_id bypass vulnerabilities |

---

## 7. API Requirements

### 7.1 JWT Token Changes

**REQ-RLS-009:** Include tenant_id in JWT Payload

```
Current:
{
  "sub": "user-id",
  "email": "user@example.com",
  "tenant_id": "uuid",  // ✅ Already present
  "role": "admin"
}

Required:
- Keep existing structure
- Ensure tenant_id is ALWAYS present for authenticated users
```

### 7.2 Query Endpoint Changes

**REQ-RLS-010:** Consistent use_cache Parameter

```
Current Issue:
frontend/hooks/use-api.ts sends use_balances without use_cache control

Required:
- Add `use_cache?: boolean` to all query endpoints
- Cache key must include tenant_id (already implemented)
- Cache invalidation on journal entry changes (already implemented)
```

---

## 8. Non-Functional Requirements

### 8.1 Performance

- RLS adds minimal overhead (single session variable lookup per query)
- TypeORM subscriber adds ~0.1ms per insert
- Caching strategy remains unchanged

### 8.2 Compatibility

- PostgreSQL 15+ required for RLS
- No breaking changes to API contracts
- Frontend unchanged

### 8.3 Monitoring

- Log RLS policy violations (should not occur in normal operation)
- Monitor query performance after RLS enablement
- Track tenant isolation errors

---

## 9. Testing Requirements

### 9.1 Unit Tests

```typescript
describe('TenantSubscriber', () => {
  it('should inject tenant_id on insert', async () => {
    const entity = new JournalLine();
    await subscriber.beforeInsert({ entity } as any);
    expect(entity.tenant_id).toBe('test-tenant-id');
  });

  it('should throw error if no tenant context', async () => {
    const entity = new JournalLine();
    await expect(subscriber.beforeInsert({ entity } as any))
      .rejects.toThrow('No tenant context');
  });
});

describe('TenantMiddleware', () => {
  it('should set PostgreSQL session variable', async () => {
    await middleware.use(req, res, next);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('set_config'),
      ['test-tenant-id']
    );
  });
});
```

### 9.2 Integration Tests

```typescript
describe('Tenant Isolation', () => {
  it('should not allow User A to access User B data', async () => {
    // Create data for tenant A
    const accountA = await createAccount(tenantA);
    
    // Try to access from tenant B
    await expect(
      accountsService.findOne(accountA.id, tenantB)
    ).rejects.toThrow(ForbiddenException);
  });

  it('should export only own data in admin export', async () => {
    // Create data for multiple tenants
    await createJournalLine(tenantA);
    await createJournalLine(tenantB);
    
    // Export as tenant A
    const exportData = await adminService.exportData(tenantA, 'journal');
    
    expect(exportData.lines.length).toBe(1);
    expect(exportData.lines[0].tenant_id).toBe(tenantA);
  });
});
```

---

## 10. Rollback Plan

### 10.1 Emergency Rollback

```sql
-- Disable RLS in emergency
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines DISABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
```

### 10.2 Feature Flag

```typescript
// app.module.ts
const rlsEnabled = process.env.RLS_ENABLED === 'true';

// TypeORM subscriber
@Injectable()
export class TenantSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<any>) {
    if (!rlsEnabled) return;  // Skip if RLS disabled
    // ... normal logic
  }
}
```

---

## 11. References

- See Also:
  - [Core Features](../REQUIREMENTS_CORE.md#account-types)
  - [API Specs](../REQUIREMENTS_API.md#journal-endpoints)
  - [Database](../REQUIREMENTS_DATABASE.md#entity-relationship-diagram)
  - [PRD](../PRD.md)

---

## 12. Implementation Checklist

- [ ] Fix admin.service.ts data leak ✅ DONE
- [ ] Disable synchronize: true
- [ ] Create RLS migration file
- [ ] Enable RLS on all tenant-isolated tables
- [ ] Create TenantContext with AsyncLocalStorage
- [ ] Create TenantMiddleware
- [ ] Create TenantSubscriber
- [ ] Create TenantAwareRepository base class
- [ ] Refactor all services to use base repository
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Security audit review
- [ ] Production deployment
