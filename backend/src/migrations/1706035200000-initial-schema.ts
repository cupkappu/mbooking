import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1706035200000 implements MigrationInterface {
  name = 'InitialSchema1706035200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable required extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // Users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(100),
        password VARCHAR(255),
        image VARCHAR(255),
        provider VARCHAR(50) DEFAULT 'credentials',
        provider_id VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        role VARCHAR(50) DEFAULT 'user',
        tenant_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Tenants table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE,
        settings JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Accounts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        type VARCHAR(50) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        balance DECIMAL(20, 8) DEFAULT 0,
        parent_id UUID,
        mpath TEXT,
        path TEXT,
        depth INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        tenant_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Journal entries table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entry_number VARCHAR(50) UNIQUE,
        description TEXT,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        tags TEXT[],
        reference_id VARCHAR(255),
        is_pending BOOLEAN DEFAULT false,
        tenant_id UUID NOT NULL,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Journal lines table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS journal_lines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        journal_entry_id UUID NOT NULL,
        account_id UUID NOT NULL,
        amount DECIMAL(20, 4) DEFAULT 0,
        debit DECIMAL(20, 8) DEFAULT 0,
        credit DECIMAL(20, 8) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        exchange_rate DECIMAL(20, 8) DEFAULT 1,
        description TEXT,
        tenant_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Currencies table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS currencies (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        symbol VARCHAR(10),
        decimal_places INTEGER DEFAULT 2,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Providers table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        config JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        last_fetch_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Currency providers table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS currency_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        currency_code VARCHAR(10) NOT NULL,
        provider_id UUID NOT NULL,
        priority INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE,
        UNIQUE (currency_code, provider_id)
      )
    `);

    // Exchange rates table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_currency VARCHAR(10) NOT NULL,
        target_currency VARCHAR(10) NOT NULL,
        rate DECIMAL(20, 8) NOT NULL,
        provider_id UUID,
        fetch_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (source_currency, target_currency, fetch_at)
      )
    `);

    // Budgets table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        alert_threshold DECIMAL(5, 2) DEFAULT 80,
        tenant_id UUID NOT NULL,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Budget templates table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS budget_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        period_type VARCHAR(20) DEFAULT 'monthly',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Budget alerts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS budget_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        budget_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT false,
        tenant_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Report storage table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS report_storage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_type VARCHAR(50) NOT NULL,
        name VARCHAR(200),
        params JSONB DEFAULT '{}',
        data JSONB,
        expires_at TIMESTAMP WITH TIME ZONE,
        tenant_id UUID NOT NULL,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Admin audit logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id UUID,
        old_data JSONB,
        new_data JSONB,
        user_id UUID NOT NULL,
        user_email VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        tenant_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON accounts(tenant_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(parent_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_accounts_path ON accounts USING GIST(path gist_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant ON journal_entries(tenant_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_journal_lines_journal_entry ON journal_lines(journal_entry_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines(account_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_budgets_tenant ON budgets(tenant_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_budgets_dates ON budgets(start_date, end_date)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(source_currency, target_currency)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_exchange_rates_fetch ON exchange_rates(fetch_at)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_exchange_rates_fetch`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_exchange_rates_currencies`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_budgets_dates`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_budgets_tenant`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_journal_lines_account`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_journal_lines_journal_entry`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_journal_entries_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_journal_entries_tenant`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_accounts_path`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_accounts_parent`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_accounts_tenant`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_tenant`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS admin_audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS report_storage`);
    await queryRunner.query(`DROP TABLE IF EXISTS budget_alerts`);
    await queryRunner.query(`DROP TABLE IF EXISTS budget_templates`);
    await queryRunner.query(`DROP TABLE IF EXISTS budgets`);
    await queryRunner.query(`DROP TABLE IF EXISTS exchange_rates`);
    await queryRunner.query(`DROP TABLE IF EXISTS currency_providers`);
    await queryRunner.query(`DROP TABLE IF EXISTS providers`);
    await queryRunner.query(`DROP TABLE IF EXISTS currencies`);
    await queryRunner.query(`DROP TABLE IF EXISTS journal_lines`);
    await queryRunner.query(`DROP TABLE IF EXISTS journal_entries`);
    await queryRunner.query(`DROP TABLE IF EXISTS accounts`);
    await queryRunner.query(`DROP TABLE IF EXISTS tenants`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
