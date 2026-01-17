import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './currency.entity';

@Injectable()
export class CurrenciesService {
  constructor(
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
  ) {}

  async findAll(): Promise<Currency[]> {
    return this.currencyRepository.find({
      where: { is_active: true },
      order: { code: 'ASC' },
    });
  }

  async findByCode(code: string): Promise<Currency | null> {
    return this.currencyRepository.findOne({ where: { code } });
  }

  async create(data: Partial<Currency>): Promise<Currency> {
    const currency = this.currencyRepository.create(data);
    return this.currencyRepository.save(currency);
  }

  async seedDefaultCurrencies(): Promise<void> {
    const defaultCurrencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2 },
      { code: 'EUR', name: 'Euro', symbol: '€', decimal_places: 2 },
      { code: 'GBP', name: 'British Pound', symbol: '£', decimal_places: 2 },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimal_places: 0 },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimal_places: 2 },
      { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimal_places: 2 },
      { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', decimal_places: 2 },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimal_places: 0 },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimal_places: 2 },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimal_places: 2 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimal_places: 2 },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', decimal_places: 2 },
      { code: 'BTC', name: 'Bitcoin', symbol: '₿', decimal_places: 8 },
      { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', decimal_places: 18 },
    ];

    for (const currency of defaultCurrencies) {
      const existing = await this.findByCode(currency.code);
      if (!existing) {
        await this.create(currency);
      }
    }
  }
}
