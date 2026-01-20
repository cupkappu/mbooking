import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Account, AccountType } from './account.entity';
import { TenantContext } from '../common/context/tenant.context';
import { CurrenciesService } from '../currencies/currencies.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let accountRepository: any;
  let currenciesService: jest.Mocked<CurrenciesService>;

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

  const runWithTenant = <T>(tenantId: string, callback: () => T): T => {
    return TenantContext.run(
      { tenantId, userId: 'user-1', requestId: 'req-1' },
      callback,
    );
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
            findDescendants: jest.fn(() => Promise.resolve([])),
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
            validateCurrencyExists: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    accountRepository = module.get(getRepositoryToken(Account)) as any;
    currenciesService = module.get(CurrenciesService);
  });

  describe('findAll', () => {
    it('should return all active accounts for tenant', async () => {
      const mockAccounts = [mockAccount];
      accountRepository.find.mockResolvedValue(mockAccounts);

      const result = await runWithTenant('tenant-1', () => service.findAll());

      expect(result).toEqual(mockAccounts);
      expect(accountRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: 'tenant-1', is_active: true },
        order: { path: 'ASC' },
      });
    });

    it('should return empty array when no accounts', async () => {
      accountRepository.find.mockResolvedValue([]);

      const result = await runWithTenant('tenant-1', () => service.findAll());

      expect(result).toEqual([]);
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
      const createdAccount = {
        ...mockAccount,
        tenant_id: 'tenant-1',
        path: 'Bank',
        depth: 0,
      };
      accountRepository.create.mockReturnValue(createdAccount);
      accountRepository.save.mockResolvedValue(createdAccount);

      const result = await runWithTenant('tenant-1', () =>
        service.create({
          name: 'Bank',
          type: AccountType.ASSETS,
          currency: 'USD',
        }),
      );

      expect(result).toBeDefined();
      expect(result.path).toBe('Bank');
      expect(result.depth).toBe(0);
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
        service.create({
          name: 'bank',
          type: AccountType.ASSETS,
          currency: 'USD',
          parent_id: 'uuid-1',
        } as any),
      );

      expect(result.path).toBe('assets:bank');
      expect(result.depth).toBe(1);
    });

    it('should throw BadRequestException when child account type does not match parent', async () => {
      const parentAccount = { ...mockAccount, type: AccountType.ASSETS };
      accountRepository.findOne.mockResolvedValue(parentAccount);

      await expect(
        runWithTenant('tenant-1', () =>
          service.create({
            name: 'loan',
            type: AccountType.LIABILITIES,
            currency: 'USD',
            parent_id: 'uuid-1',
          } as any),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow creating child account with same type as parent', async () => {
      const parentAccount = { ...mockAccount, path: 'assets', depth: 0, type: AccountType.ASSETS };
      const childAccount = {
        ...mockAccount,
        parent: parentAccount as Account,
        path: 'assets:savings',
        depth: 1,
        type: AccountType.ASSETS,
      };

      accountRepository.findOne.mockResolvedValue(parentAccount);
      accountRepository.create.mockReturnValue(childAccount);
      accountRepository.save.mockResolvedValue(childAccount);
      currenciesService.validateCurrencyExists.mockResolvedValue({ code: 'USD' } as any);

      const result = await runWithTenant('tenant-1', () =>
        service.create({
          name: 'savings',
          type: AccountType.ASSETS,
          currency: 'USD',
          parent_id: 'uuid-1',
        } as any),
      );

      expect(result).toBeDefined();
      expect(result.path).toBe('assets:savings');
      expect(result.depth).toBe(1);
    });

    it('should throw BadRequestException for invalid currency', async () => {
      currenciesService.validateCurrencyExists.mockRejectedValue(
        new BadRequestException("Currency 'INVALID' is not available. Contact your administrator."),
      );

      await expect(
        runWithTenant('tenant-1', () =>
          service.create({
            name: 'Bank',
            type: AccountType.ASSETS,
            currency: 'INVALID',
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update account name and path', async () => {
      const updatedAccount = { ...mockAccount, name: 'Updated Bank', path: 'assets:updated-bank' };
      accountRepository.findOne.mockResolvedValueOnce(mockAccount)

      accountRepository.save.mockResolvedValue(updatedAccount);

      const result = await runWithTenant('tenant-1', () =>
        service.update('uuid-1', { name: 'Updated Bank' }),
      );

      expect(result.name).toBe('Updated Bank');
    });

    it('should throw BadRequestException for invalid currency on update', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);
      currenciesService.validateCurrencyExists.mockRejectedValue(
        new BadRequestException("Currency 'INVALID' is not available. Contact your administrator."),
      );

      await expect(
        runWithTenant('tenant-1', () =>
          service.update('uuid-1', { currency: 'INVALID' }),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should throw BadRequestException when account has children', async () => {
      const accountWithChildren = { ...mockAccount, children: [{} as Account] };
      const childAccount = { ...mockAccount, id: 'uuid-2', parent: mockAccount as Account };
      accountRepository.findOne.mockResolvedValue(accountWithChildren);
      (accountRepository.findDescendants as jest.Mock).mockResolvedValue([mockAccount, childAccount]);

      await expect(runWithTenant('tenant-1', () => service.delete('uuid-1')))
        .rejects.toThrow(BadRequestException);
    });

    it('should remove account when no children', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);
      accountRepository.remove.mockResolvedValue(mockAccount);

      await runWithTenant('tenant-1', () => service.delete('uuid-1'));

      expect(accountRepository.remove).toHaveBeenCalledWith(mockAccount);
    });
  });
});
