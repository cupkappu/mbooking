import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from './currency.entity';
import { CurrencyProvider } from './currency-provider.entity';
import { CurrenciesService } from './currencies.service';
import { CurrencyProviderService } from './currency-provider.service';
import { CurrenciesController } from './currencies.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { RatesModule } from '../rates/rates.module';
import { Provider } from '../rates/provider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Currency, CurrencyProvider, Provider]),
    TenantsModule,
    RatesModule,
  ],
  controllers: [CurrenciesController],
  providers: [CurrenciesService, CurrencyProviderService],
  exports: [CurrenciesService, CurrencyProviderService],
})
export class CurrenciesModule {}
