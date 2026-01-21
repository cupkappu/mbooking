import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Provider } from './provider.entity';

@Entity('exchange_rates')
@Index(['from_currency', 'to_currency', 'date'])
@Index(['provider_id'])
@Index(['fetched_at'])
@Index(['date', 'fetched_at'])
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  provider_id: string;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @Column({ length: 10 })
  @Index()
  from_currency: string;

  @Column({ length: 10 })
  @Index()
  to_currency: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  rate: number;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @Column({ type: 'timestamp' })
  fetched_at: Date;
}
