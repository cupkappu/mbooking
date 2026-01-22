import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRate } from './exchange-rate.entity';
import { Provider } from './provider.entity';
import { RatesService } from './rates.service';
import { RatesController } from './rates.controller';
import { RateGraphEngine } from './rate-graph-engine';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate, Provider])],
  controllers: [RatesController],
  providers: [RatesService, RateGraphEngine],
  exports: [RatesService, RateGraphEngine],
})
export class RatesModule {}
