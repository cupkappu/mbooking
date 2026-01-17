import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { Budget, BudgetType } from './budget.entity';

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

      const result = await service.findAll('tenant-1');

      expect(result).toEqual(mockBudgets);
      expect(budgetRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: 'tenant-1', is_active: true },
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return budget when found', async () => {
      budgetRepository.findOne.mockResolvedValue(mockBudget);

      const result = await service.findById('uuid-1', 'tenant-1');

      expect(result).toEqual(mockBudget);
    });

    it('should throw NotFoundException when not found', async () => {
      budgetRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('not-found', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create new budget', async () => {
      budgetRepository.create.mockReturnValue(mockBudget);
      budgetRepository.save.mockResolvedValue(mockBudget);

      const result = await service.create(
        {
          name: 'Monthly Food Budget',
          type: BudgetType.PERIODIC,
          amount: 5000,
          currency: 'HKD',
          start_date: new Date('2025-01-01'),
          period_type: 'monthly' as any,
        },
        'tenant-1',
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Monthly Food Budget');
      expect(budgetRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Monthly Food Budget',
          tenant_id: 'tenant-1',
          spent_amount: 0,
        }),
      );
    });
  });

  describe('getProgress', () => {
    it('should return progress calculation', async () => {
      budgetRepository.findOne.mockResolvedValue(mockBudget);

      const result = await service.getProgress('uuid-1', 'tenant-1');

      expect(result.progress).toBe(50);
      expect(result.remaining).toBe(2500);
      expect(result.is_exceeded).toBe(false);
      expect(result.is_alert).toBe(false);
    });

    it('should trigger alert when threshold exceeded', async () => {
      const highSpendingBudget = { ...mockBudget, spent_amount: 4500, alert_threshold: 0.8 };
      budgetRepository.findOne.mockResolvedValue(highSpendingBudget);

      const result = await service.getProgress('uuid-1', 'tenant-1');

      expect(result.progress).toBe(90);
      expect(result.is_alert).toBe(true);
    });

    it('should mark as exceeded when spending > budget', async () => {
      const exceededBudget = { ...mockBudget, spent_amount: 6000 };
      budgetRepository.findOne.mockResolvedValue(exceededBudget);

      const result = await service.getProgress('uuid-1', 'tenant-1');

      expect(result.progress).toBe(100);
      expect(result.is_exceeded).toBe(true);
    });
  });

  describe('updateSpentAmount', () => {
    it('should update spent amount', async () => {
      const updatedBudget = { ...mockBudget, spent_amount: 3000 };
      budgetRepository.findOne.mockResolvedValue(mockBudget);
      budgetRepository.save.mockResolvedValue(updatedBudget);

      const result = await service.updateSpentAmount('uuid-1', 3000, 'HKD');

      expect(result.spent_amount).toBe(3000);
    });
  });
});
