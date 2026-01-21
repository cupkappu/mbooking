-- Migration: Add performance indexes to exchange_rates table
-- Created: 2026-01-22 for rate-graph-engine performance optimization

-- Add missing indexes for rate-graph-engine performance
CREATE INDEX IF NOT EXISTS "exchange_rates_provider_id_idx" ON "exchange_rates" ("provider_id");
CREATE INDEX IF NOT EXISTS "exchange_rates_fetched_at_idx" ON "exchange_rates" ("fetched_at");
CREATE INDEX IF NOT EXISTS "exchange_rates_date_fetched_idx" ON "exchange_rates" ("date", "fetched_at" DESC);

-- Add index for active providers lookup
CREATE INDEX IF NOT EXISTS "providers_is_active_idx" ON "providers" ("is_active") WHERE "is_active" = true;

-- Add foreign key constraint if not exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'providers') THEN
        ALTER TABLE "exchange_rates" ADD CONSTRAINT IF NOT EXISTS "exchange_rates_provider_fk" 
            FOREIGN KEY ("provider_id") REFERENCES "providers" ("id") ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN NULL;
END $$;