/**
 * Multi-Currency Accounting - AccountsService Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantContext } from '../common/context/tenant.context';
import { AccountsService } from './accounts.service';
import { Account, AccountType } from './account.entity';
import { CurrenciesService } from '../currencies/currencies.service';

// Helper for running tests with tenant context
const runWithTenant = <T>(tenantId: string, callback: () => T): T => {
  return TenantContext.run(
    { tenantId, userId: 'user-1', requestId: 'req-1' },
    callback,
  );
};

describe('AccountsService', () => {
  let service: AccountsService;
  let accountRepository: jest.Mocked<Repository<Account>>;

  const mockAccount: Account = {
    id: 'uuid-1',
    tenant_id: 'tenant-1',
    parent: null,
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
        AccountsService,
        {
          provide: getRepositoryToken(Account),
          useValue: {
            find: jest.fn(),
            findTrees: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            findDescendants: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            }),
            manager: {
              save: jest.fn((account) => Promise.resolve(account)),
            },
          },
        },
        {
          provide: CurrenciesService,
          useValue: {
            validateCurrencyExists: jest.fn().mockResolvedValue({ code: 'USD' }),
          },
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    accountRepository = module.get(getRepositoryToken(Account)) as any;
  });

  describe('findAll', () => {
    it('should return all active accounts for tenant', async () => {
      const mockAccounts = [mockAccount];
      accountRepository.find.mockResolvedValue(mockAccounts);

      const result = await runWithTenant('tenant-1', () => service.findAll());

      expect(result).toEqual(mockAccounts);
    });
  });

  describe('findById', () => {
    it('should return account when found', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await runWithTenant('tenant-1', () => service.findById('uuid-1'));

      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException when account not found', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      await expect(runWithTenant('tenant-1', () => service.findById('not-found')))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create top-level account', async () => {
      accountRepository.create.mockImplementation((data: any) => ({
        ...data,
        id: 'uuid-1',
        path: data.name || '',
        depth: 0,
        parent: null,
        children: [],
        tenant_id: data.tenant_id || 'tenant-1',
        type: data.type || AccountType.ASSETS,
        currency: data.currency || 'USD',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      }));
      (accountRepository.manager as any).save.mockImplementation((account: any) => Promise.resolve(account));

      const result = await runWithTenant('tenant-1', () =>
        service.create(
          {
            name: 'Bank',
            type: AccountType.ASSETS,
            currency: 'USD',
          } as any,
        ),
      );

      expect(result).toBeDefined();
      expect(result.path).toBe('Bank');
    });

    it('should create child account with correct path', async () => {
      const parentAccount = { ...mockAccount, path: 'assets', depth: 0 };
      const childAccount = {
        ...mockAccount,
        parent: parentAccount as Account,
        path: 'assets:bank',
        depth: 1,
      };

      accountRepository.findOne.mockResolvedValue(parentAccount);
      accountRepository.create.mockReturnValue(childAccount);
      accountRepository.save.mockResolvedValue(childAccount);

      const result = await runWithTenant('tenant-1', () =>
        service.create(
          {
            name: 'bank',
            type: AccountType.ASSETS,
            currency: 'USD',
            parent_id: 'uuid-1',
          } as any,
        ),
      );

      expect(result.path).toBe('assets:bank');
      expect(result.depth).toBe(1);
    });
  });

  describe('delete', () => {
    it('should throw BadRequestException when account has children', async () => {
      const accountWithChildren = { ...mockAccount };
      accountRepository.findOne.mockResolvedValue(accountWithChildren);
      // Mock findDescendants for TreeRepository
      (accountRepository as any).findDescendants.mockResolvedValue([accountWithChildren, {} as Account]);

      await expect(
        runWithTenant('tenant-1', () => service.delete('uuid-1')),
      ).rejects.toThrow(BadRequestException);
    });

    it('should remove account when no children', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);
      (accountRepository as any).findDescendants.mockResolvedValue([mockAccount]);
      accountRepository.remove.mockResolvedValue(mockAccount);

      await runWithTenant('tenant-1', () => service.delete('uuid-1'));

      expect(accountRepository.remove).toHaveBeenCalledWith(mockAccount);
    });
  });
});
