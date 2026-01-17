import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Like } from 'typeorm';
import { Account, AccountType } from '../accounts/account.entity';
import { JournalEntry } from '../journal/journal-entry.entity';
import { JournalLine } from '../journal/journal-line.entity';
import { RateEngine } from '../rates/rate.engine';

export interface BalanceQuery {
  date_range?: { from: string; to: string };
  depth?: number;
  account_filter?: {
    types?: AccountType[];
    paths?: string[];
  };
  convert_to?: string;
  exchange_rate_date?: 'latest' | 'query_date' | 'specific_date';
  specific_date?: string;
  pagination?: { offset?: number; limit?: number };
  use_cache?: boolean;
}

export interface JournalQuery {
  date_range?: { from: string; to: string };
  account_filter?: {
    paths?: string[];
    types?: AccountType[];
    include_children?: boolean;
  };
  tags?: string[];
  search?: string;
  sort?: { field: string; order: 'asc' | 'desc' };
  pagination?: { offset?: number; limit?: number };
}

export interface CurrencyBalance {
  currency: string;
  amount: number;
}

export interface AccountBalance {
  account: Account;
  currencies: CurrencyBalance[];
  converted_amount?: number;
}

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(JournalEntry)
    private journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(JournalLine)
    private journalLineRepository: Repository<JournalLine>,
    private rateEngine: RateEngine,
  ) {}

  async getBalances(tenantId: string, query: BalanceQuery): Promise<{
    balances: AccountBalance[];
    pagination: { offset: number; limit: number; total: number; has_more: boolean };
    meta: { cache_hit: boolean; calculated_at: string };
  }> {
    const cacheKey = this.generateCacheKey('balances', tenantId, query);
    const cached = this.getFromCache(cacheKey);
    if (cached && query.use_cache !== false) {
      return { ...cached, meta: { ...cached.meta, cache_hit: true } };
    }

    const depth = query.depth || 1;
    let accounts = await this.accountRepository.find({
      where: { tenant_id: tenantId, is_active: true },
      order: { path: 'ASC' },
    });

    if (query.account_filter?.types?.length) {
      accounts = accounts.filter((a) => query.account_filter!.types!.includes(a.type));
    }

    const balances = await Promise.all(
      accounts.map(async (account) => {
        const currencyBalances = await this.calculateAccountBalance(
          account.id,
          query.date_range,
        );

        if (query.convert_to) {
          const converted = await this.convertBalances(
            currencyBalances,
            query.convert_to,
            query.exchange_rate_date,
            query.specific_date,
          );
          return { account, currencies: converted };
        }

        return { account, currencies: currencyBalances };
      }),
    );

    const merged = this.mergeByDepth(balances, query.depth);
    const total = merged.length;
    const offset = query.pagination?.offset || 0;
    const limit = query.pagination?.limit || 50;
    const paginated = merged.slice(offset, offset + limit);

    const result = {
      balances: paginated,
      pagination: {
        offset,
        limit,
        total,
        has_more: offset + limit < total,
      },
      meta: {
        cache_hit: false,
        calculated_at: new Date().toISOString(),
      },
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getJournalEntries(tenantId: string, query: JournalQuery): Promise<{
    entries: JournalEntry[];
    pagination: { offset: number; limit: number; total: number; has_more: boolean };
    meta: { cache_hit: boolean };
  }> {
    const offset = query.pagination?.offset || 0;
    const limit = query.pagination?.limit || 50;

    const whereClause: any = { tenant_id: tenantId };

    if (query.date_range) {
      whereClause.date = Between(new Date(query.date_range.from), new Date(query.date_range.to));
    }

    const [entries, total] = await this.journalEntryRepository.findAndCount({
      where: whereClause,
      relations: ['lines'],
      order: { date: query.sort?.order === 'asc' ? 'ASC' : 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      entries,
      pagination: {
        offset,
        limit,
        total,
        has_more: offset + limit < total,
      },
      meta: { cache_hit: false },
    };
  }

  private async calculateAccountBalance(accountId: string, dateRange?: { from: string; to: string }): Promise<CurrencyBalance[]> {
    const accountIds = await this.getDescendantIds(accountId);

    const query = this.journalLineRepository
      .createQueryBuilder('line')
      .select(['line.currency', 'SUM(line.converted_amount) as total'])
      .where('line.account_id IN (:...accountIds)', { accountIds })
      .groupBy('line.currency');

    if (dateRange) {
      query
        .innerJoin('line.journal_entry', 'entry')
        .andWhere('entry.date >= :fromDate', { fromDate: dateRange.from })
        .andWhere('entry.date <= :toDate', { toDate: dateRange.to });
    }

    const results = await query.getRawMany();

    return results.map((r) => ({
      currency: r.line_currency,
      amount: parseFloat(r.total) || 0,
    }));
  }

  private async getDescendantIds(accountId: string): Promise<string[]> {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) return [accountId];

    const descendants = await this.accountRepository
      .createQueryBuilder('account')
      .where('account.path LIKE :path', { path: `${account.path}%` })
      .getMany();

    return [accountId, ...descendants.map((d) => d.id)];
  }

  private async convertBalances(
    balances: CurrencyBalance[],
    targetCurrency: string,
    rateDate?: string,
    specificDate?: string,
  ): Promise<CurrencyBalance[]> {
    const converted: CurrencyBalance[] = [];

    for (const balance of balances) {
      if (balance.currency === targetCurrency) {
        converted.push(balance);
        continue;
      }

      const date = specificDate ? new Date(specificDate) : undefined;
      const rate = await this.rateEngine.getRate(balance.currency, targetCurrency, { date });

      if (rate) {
        converted.push({
          currency: targetCurrency,
          amount: balance.amount * rate.rate,
        });
      }
    }

    return converted;
  }

  private mergeByDepth(balances: AccountBalance[], depth: number | undefined): AccountBalance[] {
    if (!depth || depth <= 0) return balances;

    const grouped = new Map<string, AccountBalance[]>();

    for (const balance of balances) {
      const pathParts = balance.account.path.split(':');
      const groupKey = pathParts.slice(0, Math.min(depth, pathParts.length)).join(':');

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(balance);
    }

    return Array.from(grouped.entries()).map(([key, group]) => {
      const mergedCurrencies = this.mergeCurrencies(group.flatMap((b) => b.currencies));
      const pathParts = key.split(':');

      return {
        account: {
          id: group[0].account.id,
          parent_id: group[0].account.parent_id || null,
          children: [],
          path: key,
          name: pathParts[pathParts.length - 1] || key,
          type: group[0].account.type,
          depth: pathParts.length,
          tenant_id: group[0].account.tenant_id,
          currency: group[0].account.currency,
          is_active: true,
          created_at: group[0].account.created_at,
          updated_at: group[0].account.updated_at,
        },
        currencies: mergedCurrencies,
      };
    });
  }

  private mergeCurrencies(balances: CurrencyBalance[]): CurrencyBalance[] {
    const merged = new Map<string, number>();

    for (const balance of balances) {
      const current = merged.get(balance.currency) || 0;
      merged.set(balance.currency, current + balance.amount);
    }

    return Array.from(merged.entries()).map(([currency, amount]) => ({
      currency,
      amount: Math.round(amount * 10000) / 10000,
    }));
  }

  private generateCacheKey(type: string, tenantId: string, query: any): string {
    return `${type}:${tenantId}:${JSON.stringify(query)}`;
  }

  private getFromCache(key: string): any | null {
    const item = this.cache.get(key);
    if (item && Date.now() < item.expiresAt) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL,
    });
  }

  invalidateCache(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}
