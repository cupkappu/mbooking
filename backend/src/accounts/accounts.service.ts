import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { Account, AccountType } from './account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: TreeRepository<Account>,
  ) {}

  async findAll(tenantId: string): Promise<Account[]> {
    return this.accountRepository.find({
      where: { tenant_id: tenantId, is_active: true },
      order: { path: 'ASC' },
    });
  }

  async findTree(tenantId: string): Promise<Account[]> {
    const trees = await this.accountRepository.findTrees();
    return trees.filter(a => a.tenant_id === tenantId && a.is_active);
  }

  async findById(id: string, tenantId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    return account;
  }

  async create(data: Partial<Account>, tenantId: string): Promise<Account> {
    const account = this.accountRepository.create({
      ...data,
      tenant_id: tenantId,
    });

    if (data.parent_id) {
      const parent = await this.findById(data.parent_id, tenantId);
      account.path = `${parent.path}:${data.name}`;
      account.depth = parent.depth + 1;
    } else {
      account.path = data.name;
      account.depth = 0;
    }

    return this.accountRepository.save(account);
  }

  async update(id: string, data: Partial<Account>, tenantId: string): Promise<Account> {
    const account = await this.findById(id, tenantId);
    
    if (data.name && data.name !== account.name) {
      if (account.parent_id) {
        const parent = await this.findById(account.parent_id, tenantId);
        data.path = `${parent.path}:${data.name}`;
      } else {
        data.path = data.name;
      }
    }

    Object.assign(account, data);
    return this.accountRepository.save(account);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const account = await this.findById(id, tenantId);
    
    const children = await this.accountRepository.findDescendants(account);
    if (children.length > 1) {
      throw new BadRequestException('Cannot delete account with children');
    }

    await this.accountRepository.remove(account);
  }

  async getBalance(accountId: string, tenantId: string): Promise<any[]> {
    // TODO: Implement balance calculation with journal entries
    return [];
  }
}
