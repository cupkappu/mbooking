import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JournalService } from './journal.service';
import { JournalEntry } from './journal-entry.entity';
import { JournalLine } from './journal-line.entity';
import { QueryService } from '../query/query.service';
import { TenantContext } from '../common/context/tenant.context';
import { CurrenciesService } from '../currencies/currencies.service';

const runWithTenant = <T>(tenantId: string, callback: () => T): T => {
  return TenantContext.run(
    { tenantId, userId: 'user-1', requestId: 'req-1' },
    callback,
  );
};

describe('JournalService', () => {
  let service: JournalService;
  let journalEntryRepository: jest.Mocked<Repository<JournalEntry>>;
  let journalLineRepository: jest.Mocked<Repository<JournalLine>>;
  let currenciesService: jest.Mocked<CurrenciesService>;

  const mockJournalEntry: JournalEntry = {
    id: 'uuid-1',
    tenant_id: 'tenant-1',
    date: new Date('2025-01-15'),
    description: 'Test Transaction',
    reference_id: null,
    is_pending: false,
    created_by: 'user-1',
    lines: [],
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalService,
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(JournalLine),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: QueryService,
          useValue: {
            invalidateCache: jest.fn(),
          },
        },
        {
          provide: CurrenciesService,
          useValue: {
            validateCurrencyExists: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JournalService>(JournalService);
    journalEntryRepository = module.get(getRepositoryToken(JournalEntry));
    journalLineRepository = module.get(getRepositoryToken(JournalLine));
    currenciesService = module.get(CurrenciesService);
  });

  describe('findAll', () => {
    it('should return journal entries for tenant', async () => {
      const mockEntries = [mockJournalEntry];
      journalEntryRepository.find.mockResolvedValue(mockEntries);

      const result = await runWithTenant('tenant-1', () => service.findAll());

      expect(result).toEqual(mockEntries);
      expect(journalEntryRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: 'tenant-1' },
        relations: ['lines'],
        order: { date: 'DESC' },
        skip: 0,
        take: 50,
      });
    });

    it('should apply pagination options', async () => {
      journalEntryRepository.find.mockResolvedValue([]);

      await runWithTenant('tenant-1', () =>
        service.findAll({ offset: 10, limit: 20 }),
      );

      expect(journalEntryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return journal entry with lines', async () => {
      const mockEntryWithLines = {
        ...mockJournalEntry,
        lines: [{ id: 'line-1' } as JournalLine],
      };
      journalEntryRepository.findOne.mockResolvedValue(mockEntryWithLines);

      const result = await runWithTenant('tenant-1', () =>
        service.findById('uuid-1'),
      );

      expect(result).toEqual(mockEntryWithLines);
    });

    it('should throw NotFoundException when not found', async () => {
      journalEntryRepository.findOne.mockResolvedValue(null);

      await expect(
        runWithTenant('tenant-1', () => service.findById('not-found')),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create balanced journal entry', async () => {
      const balancedLines = [
        { account_id: 'acc-1', amount: 100, currency: 'USD', tags: [] },
        { account_id: 'acc-2', amount: -100, currency: 'USD', tags: [] },
      ];

      const savedEntry = { ...mockJournalEntry, lines: balancedLines as any };
      journalEntryRepository.create.mockReturnValue(mockJournalEntry);
      journalEntryRepository.save.mockResolvedValue(mockJournalEntry);
      journalLineRepository.create.mockImplementation((data) => data as JournalLine);
      journalLineRepository.save.mockResolvedValue(balancedLines as any);

      const result = await runWithTenant('tenant-1', () =>
        service.create({
          date: new Date('2025-01-15'),
          description: 'Balanced Transaction',
          lines: balancedLines,
        }),
      );

      expect(result).toBeDefined();
      expect(journalLineRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for unbalanced entry', async () => {
      const unbalancedLines = [
        { account_id: 'acc-1', amount: 100, currency: 'USD', tags: [] },
        { account_id: 'acc-2', amount: -50, currency: 'USD', tags: [] },
      ];

      await expect(
        runWithTenant('tenant-1', () =>
          service.create({
            date: new Date('2025-01-15'),
            description: 'Unbalanced Transaction',
            lines: unbalancedLines,
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid currency', async () => {
      const balancedLines = [
        { account_id: 'acc-1', amount: 100, currency: 'INVALID', tags: [] },
        { account_id: 'acc-2', amount: -100, currency: 'INVALID', tags: [] },
      ];

      currenciesService.validateCurrencyExists.mockRejectedValue(
        new BadRequestException("Currency 'INVALID' is not available. Contact your administrator."),
      );

      await expect(
        runWithTenant('tenant-1', () =>
          service.create({
            date: new Date('2025-01-15'),
            description: 'Transaction with invalid currency',
            lines: balancedLines,
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate multiple currencies in entry', async () => {
      const balancedLines = [
        { account_id: 'acc-1', amount: 100, currency: 'USD', tags: [] },
        { account_id: 'acc-2', amount: -100, currency: 'USD', tags: [] },
        { account_id: 'acc-3', amount: 50, currency: 'EUR', tags: [] },
        { account_id: 'acc-4', amount: -50, currency: 'EUR', tags: [] },
      ];

      const savedEntry = { ...mockJournalEntry, lines: balancedLines as any };
      journalEntryRepository.create.mockReturnValue(mockJournalEntry);
      journalEntryRepository.save.mockResolvedValue(mockJournalEntry);
      journalLineRepository.create.mockImplementation((data) => data as JournalLine);
      journalLineRepository.save.mockResolvedValue(balancedLines as any);
      currenciesService.validateCurrencyExists.mockResolvedValue({ code: 'USD' } as any);

      const result = await runWithTenant('tenant-1', () =>
        service.create({
          date: new Date('2025-01-15'),
          description: 'Multi-currency Transaction',
          lines: balancedLines,
        }),
      );

      expect(result).toBeDefined();
      expect(currenciesService.validateCurrencyExists).toHaveBeenCalledWith('USD');
      expect(currenciesService.validateCurrencyExists).toHaveBeenCalledWith('EUR');
    });
  });

  describe('update', () => {
    it('should update journal entry and lines', async () => {
      const balancedLines = [
        { account_id: 'acc-1', amount: 200, currency: 'USD', tags: [] },
        { account_id: 'acc-2', amount: -200, currency: 'USD', tags: [] },
      ];

      const existingEntry = { ...mockJournalEntry };
      const updatedEntry = { ...mockJournalEntry, description: 'Updated' };

      journalEntryRepository.findOne.mockResolvedValue(existingEntry);
      journalLineRepository.delete.mockResolvedValue({ affected: 1 } as any);
      journalLineRepository.create.mockImplementation((data) => data as JournalLine);
      journalLineRepository.save.mockResolvedValue(balancedLines as any);
      journalEntryRepository.save.mockResolvedValue(updatedEntry);
      currenciesService.validateCurrencyExists.mockResolvedValue({ code: 'USD' } as any);

      const result = await runWithTenant('tenant-1', () =>
        service.update('uuid-1', { description: 'Updated', lines: balancedLines }),
      );

      expect(result.description).toBe('Updated');
      expect(journalLineRepository.delete).toHaveBeenCalledWith({
        journal_entry_id: 'uuid-1',
      });
    });

    it('should throw BadRequestException for invalid currency on update', async () => {
      const balancedLines = [
        { account_id: 'acc-1', amount: 200, currency: 'INVALID', tags: [] },
        { account_id: 'acc-2', amount: -200, currency: 'INVALID', tags: [] },
      ];

      const existingEntry = { ...mockJournalEntry };
      journalEntryRepository.findOne.mockResolvedValue(existingEntry);
      currenciesService.validateCurrencyExists.mockRejectedValue(
        new BadRequestException("Currency 'INVALID' is not available. Contact your administrator."),
      );

      await expect(
        runWithTenant('tenant-1', () =>
          service.update('uuid-1', { description: 'Updated', lines: balancedLines }),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should remove journal entry', async () => {
      journalEntryRepository.findOne.mockResolvedValue(mockJournalEntry);
      journalEntryRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await runWithTenant('tenant-1', () => service.delete('uuid-1'));

      expect(journalEntryRepository.delete).toHaveBeenCalledWith('uuid-1');
    });
  });
});
