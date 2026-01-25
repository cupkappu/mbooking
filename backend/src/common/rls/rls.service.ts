import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Service for managing PostgreSQL Row Level Security (RLS) tenant context.
 *
 * This service provides utilities to set and clear the tenant context
 * for database sessions, which is required for RLS policies to work.
 *
 * @example
 * // Set tenant context before operations
 * await rlsService.setTenantContext(tenantId);
 * const users = await userRepository.find();
 *
 * // Clear context after operations
 * await rlsService.clearTenantContext();
 */
@Injectable()
export class RlsService {
  private readonly logger = new Logger(RlsService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Set the tenant context for the current database session.
   *
   * This sets the 'app.current_tenant_id' session parameter which
   * is used by RLS policies to filter rows by tenant.
   *
   * @param tenantId - The UUID of the tenant to set context for
   * @throws Error if database operation fails
   */
  async setTenantContext(tenantId: string): Promise<void> {
    try {
      await this.dataSource.query(
        `SELECT set_config('app.current_tenant_id', $1, false)`,
        [tenantId]
      );
      this.logger.debug(`Set tenant context: ${tenantId.substring(0, 8)}...`);
    } catch (error) {
      this.logger.error(`Failed to set tenant context: ${error}`);
      throw error;
    }
  }

  /**
   * Clear the tenant context for the current database session.
   *
   * This clears the 'app.current_tenant_id' session parameter.
   * Always call this after operations are complete, especially
   * in finally blocks or error handlers.
   */
  async clearTenantContext(): Promise<void> {
    try {
      await this.dataSource.query(
        `SELECT set_config('app.current_tenant_id', '', true)`
      );
      this.logger.debug('Cleared tenant context');
    } catch (error) {
      this.logger.warn(`Failed to clear tenant context: ${error}`);
      // Don't throw - clearing context failure shouldn't break the app
    }
  }

  /**
   * Get the current tenant context from the database session.
   *
   * @returns The current tenant UUID or null if not set
   */
  async getCurrentTenantId(): Promise<string | null> {
    try {
      const result = await this.dataSource.query(
        `SELECT NULLIF(current_setting('app.current_tenant_id', true), '') AS tenant_id`
      );
      return result[0]?.tenant_id || null;
    } catch (error) {
      this.logger.error(`Failed to get tenant context: ${error}`);
      return null;
    }
  }

  /**
   * Check if a record belongs to the current tenant.
   *
   * This is a belt-and-suspenders check that validates tenant access
   * at the database level using a stored function.
   *
   * @param tableName - The name of the table to check
   * @param recordId - The UUID of the record to check
   * @returns true if the record belongs to the current tenant
   */
  async validateTenantAccess(tableName: string, recordId: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
        `SELECT validate_tenant_access($1, $2) AS is_valid`,
        [tableName, recordId]
      );
      return result[0]?.is_valid || false;
    } catch (error) {
      this.logger.error(`Failed to validate tenant access: ${error}`);
      return false;
    }
  }

  /**
   * Execute a function with tenant context automatically set and cleared.
   *
   * This is a convenience wrapper that handles setting up and tearing down
   * the tenant context around an operation.
   *
   * @param tenantId - The tenant ID to set context for
   * @param operation - The async function to execute
   * @returns The result of the operation
   */
  async withTenantContext<T>(
    tenantId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    await this.setTenantContext(tenantId);
    try {
      return await operation();
    } finally {
      await this.clearTenantContext();
    }
  }

  /**
   * Get RLS status for all tenant-scoped tables.
   *
   * Useful for debugging and monitoring RLS configuration.
   *
   * @returns Array of table names with their RLS status
   */
  async getRlsStatus(): Promise<{ tableName: string; rlsEnabled: boolean }[]> {
    try {
      const result = await this.dataSource.query(
        `SELECT table_name, rls_enabled FROM v_tenant_rls_status`
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to get RLS status: ${error}`);
      return [];
    }
  }
}
