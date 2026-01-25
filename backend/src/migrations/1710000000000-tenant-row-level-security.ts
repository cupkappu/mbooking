import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PostgreSQL Row Level Security (RLS) migration for multi-tenant isolation.
 *
 * This migration adds database-level security to ensure tenant data isolation
 * even if application-level filtering is bypassed.
 *
 * IMPORTANT: This requires the application to set 'app.current_tenant_id'
 * using set_tenant_context() before executing queries on tenant-scoped tables.
 */
export class TenantRowLevelSecurity1710000000000 implements MigrationInterface {
  name = 'TenantRowLevelSecurity1710000000000';

  /**
   * List of tables that are tenant-scoped and need RLS policies
   */
  private get tenantScopedTables(): string[] {
    return [
      'users',
      'accounts',
      'journal_entries',
      'journal_lines',
      'budgets',
      'budget_alerts',
      'report_storage',
      'admin_audit_logs',
      'providers',
      'currency_providers',
    ];
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create extension for session-level parameters if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_plan_cache"`);

    // 2. Create function to set tenant context for current session
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 3. Create function to get current tenant context
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION current_tenant_id()
      RETURNS uuid AS $$
      BEGIN
        RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);

    // 4. Create function to clear tenant context
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION clear_tenant_context()
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.current_tenant_id', '', true);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 5. Create helper view to check RLS status
    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_tenant_rls_status AS
      SELECT
        c.relname AS table_name,
        c.relrowsecurity AS rls_enabled,
        c.relrowsecurity AS rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relname IN (
          'users', 'accounts', 'journal_entries', 'journal_lines',
          'budgets', 'budget_alerts', 'report_storage', 'admin_audit_logs',
          'providers', 'currency_providers'
        );
    `);

    // 6. Enable RLS on all tenant-scoped tables and create policies
    for (const table of this.tenantScopedTables) {
      try {
        // Enable RLS
        await queryRunner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);

        // Create policy for SELECT, UPDATE, DELETE - only allow rows matching tenant_id
        await queryRunner.query(`
          CREATE POLICY IF NOT EXISTS tenant_isolation_policy ON ${table}
          FOR ALL
          USING (tenant_id = current_tenant_id())
          WITH CHECK (tenant_id = current_tenant_id())
        `);

        // Ensure table owner is also subject to RLS
        await queryRunner.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
      } catch (error: any) {
        // Table might not exist yet (some are created in later migrations)
        console.warn(`Could not enable RLS on ${table}: ${error.message}`);
      }
    }

    // 7. Create indexes for tenant isolation performance
    // These indexes are crucial for RLS performance
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_tenant_rls ON users(tenant_id) WHERE deleted_at IS NULL;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_accounts_tenant_rls ON accounts(tenant_id) WHERE deleted_at IS NULL;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_rls ON journal_entries(tenant_id) WHERE deleted_at IS NULL;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_budgets_tenant_rls ON budgets(tenant_id) WHERE deleted_at IS NULL;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_providers_tenant_rls ON providers(tenant_id) WHERE deleted_at IS NULL;`);

    // 8. Create function to validate tenant access (for use in business logic)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION validate_tenant_access(table_name text, record_id uuid)
      RETURNS boolean AS $$
      DECLARE
        tenant_match boolean;
      BEGIN
        EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE id = $1 AND tenant_id = current_tenant_id())',
                       table_name)
        INTO tenant_match
        USING record_id;
        RETURN tenant_match;
      END;
      $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
    `);

    // 9. Grant execute on helper functions to application role
    await queryRunner.query(`GRANT EXECUTE ON FUNCTION set_tenant_context(uuid) TO application_user;`);
    await queryRunner.query(`GRANT EXECUTE ON FUNCTION current_tenant_id() TO application_user;`);
    await queryRunner.query(`GRANT EXECUTE ON FUNCTION clear_tenant_context() TO application_user;`);
    await queryRunner.query(`GRANT EXECUTE ON FUNCTION validate_tenant_access(text, uuid) TO application_user;`);
    await queryRunner.query(`GRANT SELECT ON v_tenant_rls_status TO application_user;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop helper view
    await queryRunner.query(`DROP VIEW IF EXISTS v_tenant_rls_status CASCADE`);

    // 2. Drop policies
    for (const table of this.tenantScopedTables) {
      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON ${table}`);
      await queryRunner.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
    }

    // 3. Drop RLS performance indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_tenant_rls`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_accounts_tenant_rls`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_journal_entries_tenant_rls`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_budgets_tenant_rls`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_providers_tenant_rls`);

    // 4. Drop helper functions
    await queryRunner.query(`DROP FUNCTION IF EXISTS validate_tenant_access(table_name text, record_id uuid) CASCADE`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS clear_tenant_context() CASCADE`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS current_tenant_id() CASCADE`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_tenant_context(tenant_id uuid) CASCADE`);
  }
}
