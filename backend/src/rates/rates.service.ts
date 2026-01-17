import { Injectable } from '@nestjs/common';
import { RateEngine } from './rate.engine';

@Injectable()
export class RatesService {
  constructor(private rateEngine: RateEngine) {}

  async getLatestRate(from: string, to: string): Promise<any> {
    return this.rateEngine.getRate(from, to);
  }

  async getRateAtDate(from: string, to: string, date: Date): Promise<any> {
    return this.rateEngine.getRate(from, to, { date });
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
    return this.rateEngine.getRateHistory(from, to, options);
  }

  async getRateTrend(from: string, to: string, days: number = 30): Promise<{
    min_rate: number;
    max_rate: number;
    avg_rate: number;
    trend: 'up' | 'down' | 'stable';
    change_percent: number;
    history: Array<{ date: string; rate: number }>;
  }> {
    return this.rateEngine.getRateTrend(from, to, days);
  }

  async convert(amount: number, from: string, to: string, date?: Date): Promise<any> {
    return this.rateEngine.convert(amount, from, to, date);
  }

  async getCrossRate(from: string, to: string, via?: string[]): Promise<number> {
    return this.rateEngine.getCrossRate(from, to, via);
  }
}
