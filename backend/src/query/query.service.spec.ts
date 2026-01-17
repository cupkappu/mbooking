import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryService } from './query.service';
import { Account, AccountType } from '../accounts/account.entity';
import { JournalEntry } from '../journal/journal-entry.entity';
import { JournalLine } from '../journal/journal-line.entity';
import { RateEngine } from '../rates/rate.engine';

describe('QueryService', () => {
  let service: QueryService;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let journalEntryRepository: jest.Mocked<Repository<JournalEntry>>;
  let journalLineRepository: jest.Mocked<Repository<JournalLine>>;
  let rateEngine: jest.Mocked<RateEngine>;

  const mockAccount: Account = {
    id: 'acc-1',
    tenant_id: 'tenant-1',
    parent_id: null,
    children: [],
    name: 'Bank',
    type: AccountType.ASSETS,
    currency: 'USD',
    path: 'assets:bank',
    depth: 1,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryService,
        {
          provide: getRepositoryToken(Account),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: {
            findAndCount: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(JournalLine),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: RateEngine,
          useValue: {
            getRate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QueryService>(QueryService);
    accountRepository = module.get(getRepositoryToken(Account));
    journalEntryRepository = module.get(getRepositoryToken(JournalEntry));
    journalLineRepository = module.get(getRepositoryToken(JournalLine));
    rateEngine = module.get(RateEngine);
  });

  describe('getBalances', () => {
    it('should return balances with default depth', async () => {
      accountRepository.find.mockResolvedValue([mockAccount]);
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      journalLineRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getBalances('tenant-1', {});

      expect(result.balances).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.meta.cache_hit).toBe(false);
    });

    it('should use cache when available', async () => {
      const cachedResult = {
        balances: [],
        pagination: { offset: 0, limit: 50, total: 0, has_more: false },
        meta: { cache_hit: false, calculated_at: new Date().toISOString() },
      };

      jest.spyOn(service as any, 'getFromCache').mockReturnValue(cachedResult);

      accountRepository.find.mockResolvedValue([]);

      const result = await service.getBalances('tenant-1', { use_cache: true });

      expect(result.meta.cache_hit).toBe(true);
    });

    it('should convert currencies when specified', async () => {
      accountRepository.find.mockResolvedValue([mockAccount]);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { line_currency: 'USD', total: '1000' },
        ]),
      };
      journalLineRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      rateEngine.getRate.mockResolvedValue({
        from: 'USD',
        to: 'EUR',
        rate: 0.85,
        timestamp: new Date(),
        source: 'test',
      });

      const result = await service.getBalances('tenant-1', {
        convert_to: 'EUR',
        exchange_rate_date: 'latest',
      });

      expect(rateEngine.getRate).toHaveBeenCalled();
    });
  });

  describe('getJournalEntries', () => {
    it('should return paginated journal entries', async () => {
       const mockEntries: JournalEntry[] = [{
        id: '1',
        tenant_id: 'tenant-1',
        date: new Date(),
        description: 'Test',
        reference_id: null,
        is_pending: false,
        created_by: 'user-1',
        lines: [],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      }];
      journalEntryRepository.findAndCount.mockResolvedValue([mockEntries, 1]);

      const result = await service.getJournalEntries('tenant-1', {
        pagination: { offset: 0, limit: 10 },
      });

      expect(result.entries).toEqual(mockEntries);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.has_more).toBe(false);
    });

    it('should apply date range filter', async () => {
      journalEntryRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getJournalEntries('tenant-1', {
        date_range: { from: '2025-01-01', to: '2025-12-31' },
      });

      expect(journalEntryRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenant_id: 'tenant-1',
          }),
        }),
      );
    });
  });
});
