-- Enable Row Level Security on all tenant-isolated tables
-- Migration ID: 001_enable_rls
-- Run this migration AFTER disabling synchronize: true in app.module.ts

-- ============================================================================
-- Create admin bypass role for cross-tenant admin operations
-- ============================================================================
DO $$ BEGIN
    CREATE ROLE admin_bypass;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- Enable RLS on accounts
-- ============================================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS accounts_tenant_isolation ON accounts;
CREATE POLICY accounts_tenant_isolation ON accounts
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::text)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- ============================================================================
-- Enable RLS on journal_entries
-- ============================================================================
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS journal_entries_tenant_isolation ON journal_entries;
CREATE POLICY journal_entries_tenant_isolation ON journal_entries
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::text)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- ============================================================================
-- Enable RLS on journal_lines
-- ============================================================================
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS journal_lines_tenant_isolation ON journal_lines;
CREATE POLICY journal_lines_tenant_isolation ON journal_lines
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::text)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- ============================================================================
-- Enable RLS on budgets
-- ============================================================================
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS budgets_tenant_isolation ON budgets;
CREATE POLICY budgets_tenant_isolation ON budgets
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::text)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- ============================================================================
-- Enable RLS on budget_alerts
-- ============================================================================
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS budget_alerts_tenant_isolation ON budget_alerts;
CREATE POLICY budget_alerts_tenant_isolation ON budget_alerts
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::text)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- ============================================================================
-- Enable RLS on budget_templates
-- ============================================================================
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS budget_templates_tenant_isolation ON budget_templates;
CREATE POLICY budget_templates_tenant_isolation ON budget_templates
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::text)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- ============================================================================
-- Enable RLS on report_storage
-- ============================================================================
ALTER TABLE report_storage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS report_storage_tenant_isolation ON report_storage;
CREATE POLICY report_storage_tenant_isolation ON report_storage
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::text)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- ============================================================================
-- Enable RLS on admin_audit_logs (tenant_id is UUID in this table)
-- ============================================================================
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_audit_logs_tenant_isolation ON admin_audit_logs;
CREATE POLICY admin_audit_logs_tenant_isolation ON admin_audit_logs
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================================================
-- Create performance indexes on tenant_id for all tables
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant ON journal_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_tenant ON journal_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budgets_tenant ON budgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_tenant ON budget_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_templates_tenant ON budget_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_storage_tenant ON report_storage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_tenant ON admin_audit_logs(tenant_id);
