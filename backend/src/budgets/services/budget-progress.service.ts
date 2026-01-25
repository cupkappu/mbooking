import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../entities/budget.entity';
import { TenantContext } from '../../common/context/tenant.context';
import { QueryService } from '../../query/query.service';

/**
 * BudgetProgressService
 * 
 * Handles real-time budget progress updates with:
 * - Optimistic cache updates for immediate UI feedback
 * - Async validation of cache vs real calculation
 * - Cache correction when validation fails
 * 
 * This service is integrated with journal entry creation events to
 * automatically update budget progress without manual refresh.
 */
@Injectable()
export class BudgetProgressService {
  private readonly logger = new Logger(BudgetProgressService.name);
  
  // In-memory cache for budget progress (in production, use Redis)
  private progressCache: Map<string, { spentAmount: number; currency: string; timestamp: Date }> = new Map();

  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    private queryService: QueryService,
  ) {}

  /**
   * Get tenant ID from context
   */
  private getTenantId(): string {
    return TenantContext.requireTenantId();
  }

  /**
   * Get cached progress for a budget
   */
  getCachedProgress(budgetId: string): { spentAmount: number; currency: string; timestamp: Date } | null {
    return this.progressCache.get(budgetId) || null;
  }

  /**
   * Update progress cache (optimistic update)
   * Called immediately after journal entry creation for instant UI feedback
   */
  updateCacheOptimistically(budgetId: string, spentAmount: number, currency: string): void {
    this.progressCache.set(budgetId, {
      spentAmount,
      currency,
      timestamp: new Date(),
    });
    this.logger.debug(`Optimistic cache update for budget ${budgetId}: ${spentAmount} ${currency}`);
  }

  /**
   * Validate cached value against real calculation
   * Returns true if cache is valid, false if correction is needed
   */
  async validateCache(budgetId: string): Promise<boolean> {
    const cached = this.getCachedProgress(budgetId);
    if (!cached) {
      return true; // No cache to validate
    }

    try {
      // Get real calculation from query service
      const realSpentAmount = await this.calculateRealSpentAmount(budgetId);
      
      // Allow small tolerance for floating point differences
      const tolerance = 0.01;
      const isValid = Math.abs(realSpentAmount - cached.spentAmount) < tolerance;

      if (!isValid) {
        this.logger.warn(
          `Cache invalidation for budget ${budgetId}: cached=${cached.spentAmount}, real=${realSpentAmount}`,
        );
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Cache validation failed for budget ${budgetId}:`, error);
      return false;
    }
  }

  /**
   * Correct cache with real calculation
   * Called when validation fails
   */
  async correctCache(budgetId: string): Promise<number> {
    const realSpentAmount = await this.calculateRealSpentAmount(budgetId);
    const budget = await this.budgetRepository.findOne({ where: { id: budgetId } });
    
    if (budget) {
      this.progressCache.set(budgetId, {
        spentAmount: realSpentAmount,
        currency: budget.spent_currency || budget.currency,
        timestamp: new Date(),
      });
      this.logger.debug(`Cache corrected for budget ${budgetId}: ${realSpentAmount}`);
    }

    return realSpentAmount;
  }

  /**
   * Calculate real spent amount from journal entries
   */
  private async calculateRealSpentAmount(budgetId: string): Promise<number> {
    const budget = await this.budgetRepository.findOne({ where: { id: budgetId } });
    if (!budget) {
      return 0;
    }

    // If budget has an associated account, calculate from journal entries
    if (budget.account_id) {
      try {
        // Get all balances for the tenant
        const result = await this.queryService.getBalances({
          depth: 1,
          use_cache: false,
        });
        
        // Find the matching account balance
        const accountBalance = result.balances.find(b => b.account.id === budget.account_id);
        if (accountBalance && accountBalance.currencies.length > 0) {
          // Get total spent (absolute value, expenses are negative)
          const totalSpent = accountBalance.currencies.reduce((sum, curr) => {
            return sum + Math.abs(curr.amount);
          }, 0);
          return totalSpent;
        }
        
        return Number(budget.spent_amount) || 0;
      } catch (error) {
        this.logger.error(`Failed to get balances for account ${budget.account_id}:`, error);
        return Number(budget.spent_amount) || 0;
      }
    }

    // Fallback to stored spent_amount
    return Number(budget.spent_amount) || 0;
  }

  /**
   * Get progress for a budget (with cache validation)
   */
  async getProgress(budgetId: string): Promise<{
    budgetId: string;
    spentAmount: number;
    currency: string;
    isFromCache: boolean;
    lastUpdated: Date;
  }> {
    const cached = this.getCachedProgress(budgetId);
    
    // Validate and correct cache asynchronously (don't block)
    this.validateAndCorrectAsync(budgetId);

    if (cached) {
      return {
        budgetId,
        spentAmount: cached.spentAmount,
        currency: cached.currency,
        isFromCache: true,
        lastUpdated: cached.timestamp,
      };
    }

    // Get real value from database
    const budget = await this.budgetRepository.findOne({ where: { id: budgetId } });
    if (!budget) {
      return {
        budgetId,
        spentAmount: 0,
        currency: 'USD',
        isFromCache: false,
        lastUpdated: new Date(),
      };
    }

    return {
      budgetId,
      spentAmount: Number(budget.spent_amount) || 0,
      currency: budget.spent_currency || budget.currency,
      isFromCache: false,
      lastUpdated: budget.updated_at || new Date(),
    };
  }

  /**
   * Async validation and correction (fire and forget)
   */
  private async validateAndCorrectAsync(budgetId: string): Promise<void> {
    try {
      const isValid = await this.validateCache(budgetId);
      if (!isValid) {
        await this.correctCache(budgetId);
      }
    } catch (error) {
      this.logger.error(`Async cache validation failed for budget ${budgetId}:`, error);
    }
  }

  /**
   * Invalidate cache for a budget
   */
  invalidateCache(budgetId: string): void {
    this.progressCache.delete(budgetId);
    this.logger.debug(`Cache invalidated for budget ${budgetId}`);
  }

  /**
   * Clear all cache for current tenant
   */
  clearTenantCache(): void {
    const tenantId = this.getTenantId();
    for (const [key] of this.progressCache) {
      if (key.startsWith(tenantId)) {
        this.progressCache.delete(key);
      }
    }
    this.logger.debug(`Cache cleared for tenant ${tenantId}`);
  }

  /**
   * Handle journal entry creation event
   * Called from JournalService after saving a journal entry
   * Updates cache for all budgets associated with affected accounts
   * 
   * @param journalLines - Array of journal line objects with account_id and amount
   */
  async onJournalEntryCreated(journalLines: Array<{ account_id: string; amount: number; currency: string }>): Promise<void> {
    const tenantId = this.getTenantId();
    
    // Get unique account IDs from the journal lines
    const accountIds = [...new Set(journalLines.map(line => line.account_id))];
    
    if (accountIds.length === 0) {
      return;
    }

    // Find all budgets associated with these accounts
    const budgets = await this.budgetRepository.find({
      where: {
        tenant_id: tenantId,
        account_id: accountIds[0], // Start with first account
        is_active: true,
      },
    });

    // Also find budgets with other account IDs
    for (let i = 1; i < accountIds.length; i++) {
      const additionalBudgets = await this.budgetRepository.find({
        where: {
          tenant_id: tenantId,
          account_id: accountIds[i],
          is_active: true,
        },
      });
      budgets.push(...additionalBudgets);
    }

    // Update cache for each affected budget
    for (const budget of budgets) {
      // Calculate the change in spent amount from this journal entry
      const accountLines = journalLines.filter(line => line.account_id === budget.account_id);
      const amountChange = accountLines.reduce((sum, line) => {
        // Expenses are negative in the system, so we take absolute value
        return sum + Math.abs(line.amount);
      }, 0);

      if (amountChange > 0) {
        // Get current spent amount (from cache or database)
        const cached = this.getCachedProgress(budget.id);
        const currentSpent = cached ? cached.spentAmount : Number(budget.spent_amount) || 0;
        
        // Update cache with optimistic update
        this.updateCacheOptimistically(
          budget.id,
          currentSpent + amountChange,
          budget.spent_currency || budget.currency,
        );
        
        this.logger.debug(
          `Budget ${budget.id} cache updated after journal entry: ${currentSpent} -> ${currentSpent + amountChange}`,
        );
      }
    }
  }
}
