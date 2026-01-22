/**
 * Multi-Currency Accounting - BudgetsService Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TenantContext } from '../common/context/tenant.context';
import { BudgetsService } from './budgets.service';
import { Budget, BudgetType } from './budget.entity';

// Helper for running tests with tenant context
const runWithTenant = <T>(tenantId: string, callback: () => T): T => {
  return TenantContext.run(
    { tenantId, userId: 'user-1', requestId: 'req-1' },
    callback,
  );
};

describe('BudgetsService', () => {
  let service: BudgetsService;
  let budgetRepository: jest.Mocked<Repository<Budget>>;

  const mockBudget: Budget = {
    id: 'uuid-1',
    tenant_id: 'tenant-1',
    account_id: null,
    name: 'Monthly Food Budget',
    type: BudgetType.PERIODIC,
    amount: 5000,
    currency: 'HKD',
    start_date: new Date('2025-01-01'),
    end_date: new Date('2025-12-31'),
    period_type: 'monthly' as any,
    spent_amount: 2500,
    spent_currency: 'HKD',
    alert_threshold: 0.8,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: getRepositoryToken(Budget),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    budgetRepository = module.get(getRepositoryToken(Budget));
  });

  describe('findAll', () => {
    it('should return all active budgets for tenant', async () => {
      const mockBudgets = [mockBudget];
      budgetRepository.find.mockResolvedValue(mockBudgets);

      const result = await runWithTenant('tenant-1', () => service.findAll());

      expect(result).toEqual(mockBudgets);
    });
  });

  describe('findById', () => {
    it('should return budget when found', async () => {
      budgetRepository.findOne.mockResolvedValue(mockBudget);

      const result = await runWithTenant('tenant-1', () => service.findById('uuid-1'));

      expect(result).toEqual(mockBudget);
    });

    it('should throw NotFoundException when not found', async () => {
      budgetRepository.findOne.mockResolvedValue(null);

      await expect(
        runWithTenant('tenant-1', () => service.findById('not-found')),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProgress', () => {
    it('should return progress calculation', async () => {
      budgetRepository.findOne.mockResolvedValue(mockBudget);

      const result = await runWithTenant('tenant-1', () => service.getProgress('uuid-1'));

      expect(result.progress).toBe(50);
      expect(result.remaining).toBe(2500);
      expect(result.is_exceeded).toBe(false);
      expect(result.is_alert).toBe(false);
    });

    it('should trigger alert when threshold exceeded', async () => {
      const highSpendingBudget = { ...mockBudget, spent_amount: 4500, alert_threshold: 0.8 };
      budgetRepository.findOne.mockResolvedValue(highSpendingBudget);

      const result = await runWithTenant('tenant-1', () => service.getProgress('uuid-1'));

      expect(result.progress).toBe(90);
      expect(result.is_alert).toBe(true);
    });

    it('should mark as exceeded when spending > budget', async () => {
      const exceededBudget = { ...mockBudget, spent_amount: 6000 };
      budgetRepository.findOne.mockResolvedValue(exceededBudget);

      const result = await runWithTenant('tenant-1', () => service.getProgress('uuid-1'));

      expect(result.progress).toBe(100);
      expect(result.is_exceeded).toBe(true);
    });
  });
});
