import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { ExchangeRate } from './exchange-rate.entity';
import { Provider, ProviderType } from './provider.entity';

interface RateResult {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  source: string;
}

@Injectable()
export class RateEngine {
  private readonly logger = new Logger(RateEngine.name);
  private providerCache: Map<string, any> = new Map();

  constructor(
    @InjectRepository(ExchangeRate)
    private rateRepository: Repository<ExchangeRate>,
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
  ) {}

  async getRate(from: string, to: string, options: {
    date?: Date;
    providerId?: string;
  } = {}): Promise<RateResult | null> {
    if (from === to) {
      return { from, to, rate: 1, timestamp: new Date(), source: 'identity' };
    }

    const date = options.date || new Date();

    const cachedRate = await this.rateRepository.findOne({
      where: {
        from_currency: from,
        to_currency: to,
        date: date,
      },
    });

    if (cachedRate) {
      return {
        from,
        to,
        rate: Number(cachedRate.rate),
        timestamp: cachedRate.fetched_at,
        source: cachedRate.provider_id,
      };
    }

    const provider = options.providerId
      ? await this.providerRepository.findOne({ where: { id: options.providerId } })
      : await this.providerRepository.findOne({ where: { is_active: true } });

    if (!provider) {
      return null;
    }

    let rate: RateResult | null = null;

    if (provider.type === ProviderType.REST_API) {
      rate = await this.fetchFromRestApi(provider, from, to, date);
    } else if (provider.type === ProviderType.JS_PLUGIN) {
      rate = await this.executeJsPlugin(provider, from, to, date);
    }

    if (rate && provider.record_history) {
      await this.saveRate(rate, provider.id, date);
    }

    return rate;
  }

  async convert(amount: number, from: string, to: string, date?: Date): Promise<{
    amount: number;
    from: string;
    to: string;
    converted_amount: number;
    rate: number;
    date: Date;
  }> {
    const rateResult = await this.getRate(from, to, { date });
    const rate = rateResult?.rate || 1;

    return {
      amount,
      from,
      to,
      converted_amount: amount * rate,
      rate,
      date: date || new Date(),
    };
  }

  async getCrossRate(from: string, to: string, via: string[] = ['USD']): Promise<number> {
    if (from === to) return 1;

    let totalRate = 1;

    for (const currency of via) {
      const rate = await this.getRate(from, currency);
      if (rate) {
        totalRate *= rate.rate;
        from = currency;
      }
    }

    const finalRate = await this.getRate(from, to);
    if (finalRate) {
      totalRate *= finalRate.rate;
    }

    return totalRate;
  }

  private async fetchFromRestApi(provider: Provider, from: string, to: string, date: Date): Promise<RateResult | null> {
    try {
      const baseUrl = provider.config.base_url;
      const url = date
        ? `${baseUrl}/${date.toISOString().split('T')[0]}?base=${from}&symbols=${to}`
        : `${baseUrl}/latest?base=${from}&symbols=${to}`;

      const response = await axios.get(url, {
        headers: provider.config.headers || {},
      });

      const rate = response.data.rates?.[to];
      if (!rate) return null;

      return {
        from,
        to,
        rate,
        timestamp: date,
        source: provider.name,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch rate from ${provider.name}: ${error.message}`);
      return null;
    }
  }

  private async executeJsPlugin(provider: Provider, from: string, to: string, date: Date): Promise<RateResult | null> {
    try {
      const pluginPath = provider.config.file_path;
      if (!pluginPath) return null;

      const module = require(pluginPath);
      const plugin = module.default || module;

      const result = date
        ? await plugin.getRateAtDate(from, to, date)
        : await plugin.getLatestRate(from, to);

      return result;
    } catch (error) {
      this.logger.error(`Failed to execute JS plugin ${provider.name}: ${error.message}`);
      return null;
    }
  }

  async getRateHistory(
    from: string,
    to: string,
    options: {
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    } = {},
  ): Promise<{
    rates: Array<{
      from: string;
      to: string;
      rate: number;
      date: Date;
      fetched_at: Date;
      provider_id: string;
    }>;
    total: number;
  }> {
    const { fromDate, toDate, limit = 100 } = options;

    const query = this.rateRepository
      .createQueryBuilder('rate')
      .where('rate.from_currency = :from', { from })
      .andWhere('rate.to_currency = :to', { to });

    if (fromDate) {
      query.andWhere('rate.date >= :fromDate', { fromDate });
    }

    if (toDate) {
      query.andWhere('rate.date <= :toDate', { toDate });
    }

    query.orderBy('rate.date', 'DESC');
    query.take(limit);

    const rates = await query.getMany();

    return {
      rates: rates.map(r => ({
        from: r.from_currency,
        to: r.to_currency,
        rate: Number(r.rate),
        date: r.date,
        fetched_at: r.fetched_at,
        provider_id: r.provider_id,
      })),
      total: rates.length,
    };
  }

  async getRateTrend(
    from: string,
    to: string,
    days: number = 30,
  ): Promise<{
    min_rate: number;
    max_rate: number;
    avg_rate: number;
    trend: 'up' | 'down' | 'stable';
    change_percent: number;
    history: Array<{ date: string; rate: number }>;
  }> {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { rates } = await this.getRateHistory(from, to, {
      fromDate,
      toDate,
      limit: days,
    });

    if (rates.length === 0) {
      return {
        min_rate: 0,
        max_rate: 0,
        avg_rate: 0,
        trend: 'stable',
        change_percent: 0,
        history: [],
      };
    }

    const rateValues = rates.map(r => r.rate);
    const minRate = Math.min(...rateValues);
    const maxRate = Math.max(...rateValues);
    const avgRate = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;

    const sortedRates = rates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstRate = sortedRates[0]?.rate || 0;
    const lastRate = sortedRates[sortedRates.length - 1]?.rate || 0;
    const changePercent = firstRate !== 0 ? ((lastRate - firstRate) / firstRate) * 100 : 0;

    let trend: 'up' | 'down' | 'stable';
    if (changePercent > 1) trend = 'up';
    else if (changePercent < -1) trend = 'down';
    else trend = 'stable';

    return {
      min_rate: parseFloat(minRate.toFixed(8)),
      max_rate: parseFloat(maxRate.toFixed(8)),
      avg_rate: parseFloat(avgRate.toFixed(8)),
      trend,
      change_percent: parseFloat(changePercent.toFixed(2)),
      history: rates.map(r => ({
        date: r.date.toISOString().split('T')[0],
        rate: Number(r.rate),
      })),
    };
  }

  private async saveRate(rate: RateResult, providerId: string, date: Date): Promise<void> {
    const existing = await this.rateRepository.findOne({
      where: {
        from_currency: rate.from,
        to_currency: rate.to,
        date,
      },
    });

    if (existing) {
      existing.rate = rate.rate;
      existing.fetched_at = new Date();
      await this.rateRepository.save(existing);
    } else {
      const newRate = this.rateRepository.create({
        provider_id: providerId,
        from_currency: rate.from,
        to_currency: rate.to,
        rate: rate.rate,
        date,
        fetched_at: new Date(),
      });
      await this.rateRepository.save(newRate);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async fetchDailyRates(): Promise<void> {
    this.logger.log('Starting daily rate fetch...');

    const providers = await this.providerRepository.find({
      where: { is_active: true, record_history: true },
    });

    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'HKD', 'AUD', 'CAD', 'CHF'];

    for (const provider of providers) {
      for (const base of currencies.slice(0, 3)) {
        for (const target of currencies) {
          if (base === target) continue;

          await this.getRate(base, target, {
            providerId: provider.id,
            date: new Date(),
          });
        }
      }
    }

    this.logger.log('Daily rate fetch completed');
  }
}
