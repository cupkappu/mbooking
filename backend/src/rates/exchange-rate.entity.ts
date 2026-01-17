import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('exchange_rates')
@Index(['from_currency', 'to_currency', 'date'])
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  provider_id: string;

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
