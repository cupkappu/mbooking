import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRate } from './exchange-rate.entity';
import { Provider } from './provider.entity';
import { RatesService } from './rates.service';
import { RatesController } from './rates.controller';
import { RateEngine } from './rate.engine';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate, Provider])],
  controllers: [RatesController],
  providers: [RatesService, RateEngine],
  exports: [RatesService, RateEngine],
})
export class RatesModule {}
