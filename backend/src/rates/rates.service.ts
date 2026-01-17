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

  async convert(amount: number, from: string, to: string, date?: Date): Promise<any> {
    return this.rateEngine.convert(amount, from, to, date);
  }

  async getCrossRate(from: string, to: string, via?: string[]): Promise<number> {
    return this.rateEngine.getCrossRate(from, to, via);
  }
}
