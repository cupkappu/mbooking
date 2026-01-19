# RLS Architecture - Detailed Design Document

**Created:** 2026-01-19  
**Author:** Sisyphus AI Agent  
**Based On:** `docs/requirements/REQUIREMENTS_RLS_ARCHITECTURE.md`  
**Status:** Design Complete - Ready for Implementation

---

## 1. Executive Summary

### 1.1 Current State Assessment

The application currently relies on **manual application-level tenant filtering** with:
- 108 occurrences of `tenant_id` across 30 files
- No database-level RLS enforcement
- No automatic tenant context management
- Critical vulnerability: `synchronize: true` in production

### 1.2 Target State

Four-layer defense-in-depth security model:
1. **PostgreSQL RLS** - Database-level enforcement
2. **TypeORM Subscriber** - ORM-level auto-injection
3. **Tenant Middleware** - Application-level context setting
4. **TenantAwareRepository** - Code-level automatic filtering

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL Database                              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;                  │  │
│  │  CREATE POLICY tenant_isolation ON accounts                       │  │
│  │    FOR ALL USING (tenant_id = current_setting('app.tenant_id')); │  │
│  │  CREATE POLICY admin_bypass ON accounts                           │  │
│  │    FOR ALL TO admin_bypass_role USING (true);                     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌───────────────────────────┐     ┌───────────────────────────────┐
│   NestJS Application      │     │   TypeORM Subscriber          │
│  ┌─────────────────────┐  │     │  ┌─────────────────────────┐  │
│  │ TenantMiddleware    │  │     │  │ TenantSubscriber        │  │
│  │ - AsyncLocalStorage │──┼────▶│  │ - beforeInsert()        │  │
│  │ - Set RLS Context   │  │     │  │ - beforeUpdate()        │  │
│  └─────────────────────┘  │     │  └─────────────────────────┘  │
│  ┌─────────────────────┐  │     └───────────────────────────────┘
│  │ TenantContext       │  │
│  │ - getTenantId()     │  │
│  │ - getUserId()       │  │
│  └─────────────────────┘  │
│  ┌─────────────────────┐  │
│  │ TenantAwareRepository│ │     ┌───────────────────────────────┐
│  │ - Auto tenant filter│──────▶│   Services                     │
│  │ - find(), findOne() │  │     │  - AccountsService            │
│  └─────────────────────┘  │     │  - JournalService             │
└───────────────────────────┘     │  - BudgetsService             │
                                  │  - etc.                       │
                                  └───────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1 TenantContext (AsyncLocalStorage)

**File:** `backend/src/common/context/tenant.context.ts`

```typescript
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextStore {
  tenantId: string;
  userId: string;
  requestId: string;
}

const tenantStorage = new AsyncLocalStorage<TenantContextStore>();

export class TenantContext {
  /**
   * Run callback with tenant context
   */
  static run<T>(store: TenantContextStore, callback: () => T): T {
    return tenantStorage.run(store, callback);
  }

  /**
   * Get current tenant context
   */
  static getStore(): TenantContextStore | undefined {
    return tenantStorage.getStore();
  }

  /**
   * Get current tenant ID
   */
  static get tenantId(): string | undefined {
    return this.getStore()?.tenantId;
  }

  /**
   * Get current user ID
   */
  static get userId(): string | undefined {
    return this.getStore()?.userId;
  }

  /**
   * Get current request ID
   */
  static get requestId(): string | undefined {
    return this.getStore()?.requestId;
  }

  /**
   * Require tenant context (throws if not set)
   */
  static requireTenantId(): string {
    const tenantId = this.tenantId;
    if (!tenantId) {
      throw new Error('No tenant context available');
    }
    return tenantId;
  }

  /**
   * Require user context (throws if not set)
   */
  static requireUserId(): string {
    const userId = this.userId;
    if (!userId) {
      throw new Error('No user context available');
    }
    return userId;
  }
}
```

**Usage:**
```typescript
// In middleware
TenantContext.run({ tenantId, userId, requestId }, () => {
  handler(req, res, next);
});

// In service
const tenantId = TenantContext.tenantId;
```

### 3.2 TenantMiddleware

**File:** `backend/src/common/middleware/tenant.middleware.ts`

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { TenantContext } from '../context/tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const tenantId = (req as any).user?.tenant_id;
    const userId = (req as any).user?.sub || (req as any).user?.id;
    const requestId = req.headers['x-request-id'] as string || this.generateRequestId();

    if (!tenantId) {
      // For non-authenticated routes, skip tenant context
      return next();
    }

    // Run with AsyncLocalStorage context
    TenantContext.run(
      { tenantId, userId, requestId },
      async () => {
        // Set PostgreSQL session variable for RLS
        await this.dataSource.query(
          `SELECT set_config('app.current_tenant_id', $1, false)`,
          [tenantId]
        );
        next();
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

**Module Registration:**
```typescript
// app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({...})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        // Exclude paths that don't need tenant context
        '(api/v1/health)',
        '(api/v1/auth/login)',
        '(api/v1/auth/register)',
      )
      .forRoutes('*');
  }
}
```

### 3.3 TenantSubscriber

**File:** `backend/src/common/subscribers/tenant.subscriber.ts`

```typescript
import {
  Injectable,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  InsertEvent as TypeORMInsertEvent,
  UpdateEvent as TypeORMUpdateEvent,
  RemoveEvent as TypeORMRemoveEvent,
} from 'typeorm';
import { TenantContext } from '../context/tenant.context';

@Injectable()
@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  /**
   * Called before entity insertion
   * Auto-injects tenant_id if not provided
   */
  beforeInsert(event: TypeORMInsertEvent<any>): void {
    if (!event.entity) return;

    // Skip if tenant_id already set (explicit override)
    if (event.entity.tenant_id !== undefined && event.entity.tenant_id !== null) {
      return;
    }

    const tenantId = TenantContext.tenantId;
    if (!tenantId) {
      throw new Error(
        'Cannot insert entity without tenant context. ' +
        'Ensure TenantMiddleware is configured and user is authenticated.'
      );
    }

    // Set tenant_id automatically
    event.entity.tenant_id = tenantId;
  }

  /**
   * Called before entity update
   * Prevents tenant_id modification
   */
  beforeUpdate(event: TypeORMUpdateEvent<any>): void {
    if (!event.entity || !event.databaseEntity) return;

    // Prevent changing tenant_id
    if (
      event.entity.tenant_id &&
      event.databaseEntity.tenant_id &&
      event.entity.tenant_id !== event.databaseEntity.tenant_id
    ) {
      throw new Error('Cannot change tenant_id of an existing record');
    }
  }

  /**
   * Called before entity removal
   * Log tenant-scoped deletions
   */
  beforeRemove(event: TypeORMRemoveEvent<any>): void {
    if (!event.entity) return;

    const tenantId = event.entity.tenant_id || TenantContext.tenantId;
    const currentTenantId = TenantContext.tenantId;

    // Verify tenant isolation for deletes
    if (tenantId && currentTenantId && tenantId !== currentTenantId) {
      throw new Error('Cannot delete entity from different tenant');
    }
  }
}
```

### 3.4 TenantAwareRepository

**File:** `backend/src/common/repositories/tenant-aware.repository.ts`

```typescript
import {
  Repository,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  SelectQueryBuilder,
} from 'typeorm';
import { TenantContext } from '../context/tenant.context';

/**
 * Wrapper repository that automatically filters by tenant
 * Wraps existing repositories, doesn't replace them
 */
export class TenantAwareRepository<T> {
  constructor(
    private repository: Repository<T>,
    private tenantId: string,
  ) {}

  /**
   * Find all entities with tenant filter
   */
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const tenantFilter = this.buildTenantFilter(options?.where);
    return this.repository.find({
      ...options,
      where: tenantFilter,
    });
  }

  /**
   * Find one entity with tenant filter
   */
  async findOne(options?: FindOneOptions<T>): Promise<T | null> {
    const tenantFilter = this.buildTenantFilter(options?.where);
    return this.repository.findOne({
      ...options,
      where: tenantFilter,
    });
  }

  /**
   * Find by ID with tenant filter
   */
  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: { id, tenant_id: this.tenantId } as any,
    });
  }

  /**
   * Create QueryBuilder with tenant filter
   */
  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    return this.repository
      .createQueryBuilder(alias)
      .andWhere(`${alias}.tenant_id = :tenantId`, { tenantId: this.tenantId });
  }

  /**
   * Count entities with tenant filter
   */
  async count(options?: FindManyOptions<T>): Promise<number> {
    const tenantFilter = this.buildTenantFilter(options?.where);
    return this.repository.count({
      ...options,
      where: tenantFilter,
    });
  }

  /**
   * Build tenant filter object
   */
  private buildTenantFilter(existingWhere?: any): any {
    if (!existingWhere) {
      return { tenant_id: this.tenantId } as any;
    }

    if (Array.isArray(existingWhere)) {
      return existingWhere.map((w) => ({ ...w, tenant_id: this.tenantId }));
    }

    return { ...existingWhere, tenant_id: this.tenantId };
  }
}

/**
 * Factory function to create TenantAwareRepository
 */
export function createTenantAwareRepository<T>(
  repository: Repository<T>,
  tenantId?: string,
): TenantAwareRepository<T> {
  const actualTenantId = tenantId || TenantContext.requireTenantId();
  return new TenantAwareRepository<T>(repository, actualTenantId);
}
```

### 3.5 TreeTenantAwareRepository (for Account hierarchy)

**File:** `backend/src/common/repositories/tree-tenant-aware.repository.ts`

```typescript
import { TreeRepository, EntityManager, EntityTarget } from 'typeorm';
import { TenantAwareRepository } from './tenant-aware.repository';

/**
 * Tenant-aware TreeRepository for hierarchical data (Accounts)
 */
export class TreeTenantAwareRepository<T> extends TenantAwareRepository<T> {
  constructor(
    private treeRepository: TreeRepository<T>,
    tenantId: string,
  ) {
    super(treeRepository as any, tenantId);
  }

  /**
   * Find descendants with tenant filter
   */
  async findDescendants(node: T): Promise<T[]> {
    const tenantFilter = { tenant_id: (node as any).tenant_id };
    return this.treeRepository.findDescendants(node, {
      where: tenantFilter,
    });
  }

  /**
   * Find ancestors with tenant filter
   */
  async findAncestors(node: T): Promise<T[]> {
    const tenantFilter = { tenant_id: (node as any).tenant_id };
    return this.treeRepository.findAncestors(node, {
      where: tenantFilter,
    });
  }

  /**
   * Create path with tenant filter
   */
  async createPathStr(node: T): Promise<string> {
    return this.treeRepository
      .createQueryBuilder('node')
      .andWhere('node.tenant_id = :tenantId', { tenantId: this.tenantId })
      .getRawMany()
      .then((nodes) => {
        // Build path based on your hierarchy implementation
        return '';
      });
  }
}
```

---

## 4. Database Migration

**File:** `database/migrations/001_enable_rls.sql`

```sql
-- Enable Row Level Security on all tenant-isolated tables
-- Run this migration AFTER disabling synchronize: true

-- Create admin bypass role
DO $$ BEGIN
    CREATE ROLE admin_bypass;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant bypass role to postgres (or your service account)
GRANT admin_bypass TO postgres;

-- Enable RLS on accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS accounts_tenant_isolation ON accounts;
CREATE POLICY accounts_tenant_isolation ON accounts
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Enable RLS on journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS journal_entries_tenant_isolation ON journal_entries;
CREATE POLICY journal_entries_tenant_isolation ON journal_entries
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Enable RLS on journal_lines
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS journal_lines_tenant_isolation ON journal_lines;
CREATE POLICY journal_lines_tenant_isolation ON journal_lines
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Enable RLS on budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS budgets_tenant_isolation ON budgets;
CREATE POLICY budgets_tenant_isolation ON budgets
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Enable RLS on budget_alerts
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS budget_alerts_tenant_isolation ON budget_alerts;
CREATE POLICY budget_alerts_tenant_isolation ON budget_alerts
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Enable RLS on budget_templates
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS budget_templates_tenant_isolation ON budget_templates;
CREATE POLICY budget_templates_tenant_isolation ON budget_templates
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Enable RLS on reports
ALTER TABLE report_storage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS report_storage_tenant_isolation ON report_storage;
CREATE POLICY report_storage_tenant_isolation ON report_storage
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Create index on tenant_id for all tables (performance)
CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant ON journal_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_tenant ON journal_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budgets_tenant ON budgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_tenant ON budget_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_templates_tenant ON budget_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_storage_tenant ON report_storage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
```

**Rollback Script:**

```sql
-- Rollback: Disable RLS on all tables
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_storage DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Drop policies
DROP POLICY IF EXISTS accounts_tenant_isolation ON accounts;
DROP POLICY IF EXISTS journal_entries_tenant_isolation ON journal_entries;
DROP POLICY IF EXISTS journal_lines_tenant_isolation ON journal_lines;
DROP POLICY IF EXISTS budgets_tenant_isolation ON budgets;
DROP POLICY IF EXISTS budget_alerts_tenant_isolation ON budget_alerts;
DROP POLICY IF EXISTS budget_templates_tenant_isolation ON budget_templates;
DROP POLICY IF EXISTS report_storage_tenant_isolation ON report_storage;
DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
```

---

## 5. Migration Plan Summary

### Phase 1: Critical Security Fixes

| Task | File | Action |
|------|------|--------|
| Disable synchronize | `app.module.ts` | `synchronize: false` |
| Create RLS migration | `database/migrations/001_enable_rls.sql` | Enable RLS |
| Update .env.example | `.env.example` | Add RLS_ENABLED flag |

### Phase 2: Infrastructure

| Task | File | Action |
|------|------|--------|
| Create TenantContext | `common/context/tenant.context.ts` | AsyncLocalStorage |
| Create TenantMiddleware | `common/middleware/tenant.middleware.ts` | Set RLS context |
| Create TenantSubscriber | `common/subscribers/tenant.subscriber.ts` | Auto-inject tenant_id |
| Create TenantAwareRepository | `common/repositories/tenant-aware.repository.ts` | Auto-filter wrapper |

### Phase 3: Service Integration

| Task | File | Action |
|------|------|--------|
| Update AccountsService | `accounts/accounts.service.ts` | Use TenantAwareRepository |
| Update JournalService | `journal/journal.service.ts` | Use TenantAwareRepository |
| Update BudgetsService | `budgets/budgets.service.ts` | Use TenantAwareRepository |
| Update QueryService | `query/query.service.ts` | Use TenantAwareRepository |
| Update Report generators | `reports/*.ts` | Use TenantAwareRepository |
| Update AdminService | `admin/admin.service.ts` | Fix export functions |

### Phase 4: Testing & Validation

| Task | Description |
|------|-------------|
| Unit Tests | Test TenantSubscriber, TenantMiddleware |
| Integration Tests | Verify tenant isolation |
| Security Audit | Verify no bypass vulnerabilities |
| Performance Test | Measure RLS overhead |

---

## 6. Backward Compatibility Strategy

### Gradual Migration Path

1. **Phase 1-2:** Infrastructure only, no service changes
   - Existing code continues to work
   - Tenant filtering still manual

2. **Phase 3:** Service-by-service migration
   - Each service can be migrated independently
   - Manual filtering can coexist with TenantAwareRepository
   - No breaking changes to API contracts

3. **Phase 4:** Deprecation warnings
   - Add deprecation warnings to manual tenant filtering
   - Log when manual filtering is used
   - Eventually, make manual filtering optional

### Feature Flag

```typescript
// app.module.ts
const rlsEnabled = process.env.RLS_ENABLED === 'true';
const tenantContextEnabled = process.env.TENANT_CONTEXT_ENABLED === 'true';

// TenantSubscriber
@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<any>) {
    if (!rlsEnabled) return;  // Skip if RLS disabled
    // ... normal logic
  }
}

// TenantAwareRepository
export class TenantAwareRepository<T> {
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    if (!tenantContextEnabled) {
      return this.repository.find(options);  // Fallback to regular repo
    }
    // ... tenant-aware logic
  }
}
```

---

## 7. File Structure

```
backend/src/
├── common/
│   ├── context/
│   │   └── tenant.context.ts          # AsyncLocalStorage wrapper
│   ├── middleware/
│   │   └── tenant.middleware.ts        # Set PostgreSQL session context
│   ├── subscribers/
│   │   └── tenant.subscriber.ts        # Auto-inject tenant_id
│   ├── repositories/
│   │   ├── tenant-aware.repository.ts  # Auto-filter wrapper
│   │   └── tree-tenant-aware.repository.ts  # For Account hierarchy
│   └── decorators/
│       └── current-tenant.decorator.ts # @CurrentTenant() decorator
│
database/
└── migrations/
    └── 001_enable_rls.sql              # RLS enablement migration
```

---

## 8. API Changes

### No Breaking Changes

All existing API contracts remain unchanged:
- JWT token structure unchanged (tenant_id already present)
- Request/response formats unchanged
- Service method signatures unchanged

### New Decorators

```typescript
// Usage in controllers
@Get(':id')
async findOne(
  @Param('id') id: string,
  @CurrentTenant() tenantId: string,
) {
  return this.service.findOne(id, tenantId);
}

// Custom decorator
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../context/tenant.context';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.user?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException('No tenant context');
    }
    return tenantId;
  },
);
```

---

## 9. Testing Strategy

### Unit Tests

```typescript
describe('TenantSubscriber', () => {
  it('should inject tenant_id on insert', async () => {
    // Setup
    TenantContext.run({ tenantId: 'test-tenant', userId: 'user-1', requestId: 'req-1' }, () => {
      const entity = new JournalLine();
      subscriber.beforeInsert({ entity } as any);
      expect(entity.tenant_id).toBe('test-tenant');
    });
  });

  it('should throw error if no tenant context', async () => {
    const entity = new JournalLine();
    expect(() => subscriber.beforeInsert({ entity } as any))
      .toThrow('Cannot insert entity without tenant context');
  });

  it('should prevent tenant_id modification', async () => {
    const databaseEntity = new JournalLine();
    databaseEntity.tenant_id = 'tenant-a';
    const entity = new JournalLine();
    entity.tenant_id = 'tenant-b';

    expect(() => subscriber.beforeUpdate({ entity, databaseEntity } as any))
      .toThrow('Cannot change tenant_id');
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

### Integration Tests

```typescript
describe('Tenant Isolation', () => {
  it('should not allow User A to access User B data', async () => {
    // Create data for tenant A
    const accountA = await createAccount(tenantA);

    // Try to access from tenant B
    await expect(
      accountsService.findById(accountA.id, tenantB)
    ).rejects.toThrow(NotFoundException);
  });

  it('should export only own data in admin export', async () => {
    // Create data for multiple tenants
    await createJournalLine(tenantA);
    await createJournalLine(tenantB);

    // Export as tenant A
    const exportData = await adminService.exportData(tenantA, 'journal');

    // Should only return tenant A's data
    expect(exportData.lines.length).toBe(1);
    expect(exportData.lines[0].tenant_id).toBe(tenantA);
  });
});
```

---

## 10. Performance Considerations

### RLS Overhead

- **Query-level:** ~0.1ms additional latency per query (session variable lookup)
- **Index usage:** Existing indexes on `tenant_id` will be used
- **Connection pooling:** No impact

### Caching Strategy

- Cache keys already include tenant_id (unchanged)
- No additional cache invalidation needed
- RLS doesn't affect Redis/memory cache behavior

### Monitoring

```typescript
// Log slow queries with RLS
@Injectable()
export class TenantAwareRepository<T> {
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const start = Date.now();
    const result = await this.repository.find(options);
    const duration = Date.now() - start;

    if (duration > 100) {
      // Log slow query warning
      logger.warn(`Slow query with tenant filter: ${duration}ms`);
    }

    return result;
  }
}
```

---

## 11. Rollback Plan

### Emergency Rollback

```bash
# 1. Run rollback migration
npm run migration:revert

# 2. Or manually execute rollback SQL
psql -f database/migrations/001_enable_rls_rollback.sql

# 3. Disable RLS in environment
RLS_ENABLED=false
```

### Feature Flag Rollback

```bash
# Environment-based rollback (no code change)
RLS_ENABLED=false
TENANT_CONTEXT_ENABLED=false
```

---

## 12. Open Questions

1. **Admin Bypass Strategy:**
   - Should admin users have a separate API endpoint?
   - Should admin bypass require elevated role check?
   - How to audit admin cross-tenant access?

2. **Migration Order:**
   - Should we enable RLS before or after creating TenantAwareRepository?
   - Risk assessment needed

3. **Testing Database:**
   - How to test RLS in CI/CD pipeline?
   - Need dedicated multi-tenant test setup

---

## 13. References

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [TypeORM Subscribers](https://typeorm.io/listeners-and-subscribers)
- [NestJS Middleware](https://docs.nestjs.com/middleware)
- [AsyncLocalStorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage)
- [Requirements: RLS Architecture](../requirements/REQUIREMENTS_RLS_ARCHITECTURE.md)
- [Requirements: Database](../requirements/REQUIREMENTS_DATABASE.md)

---

**Document Version:** 1.0  
**Next Steps:** Create implementation plan and start Phase 1
