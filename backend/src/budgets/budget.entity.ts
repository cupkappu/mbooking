import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum BudgetType {
  PERIODIC = 'periodic',
  NON_PERIODIC = 'non_periodic',
}

export enum PeriodType {
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  YEARLY = 'yearly',
}

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column({ nullable: true })
  account_id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: BudgetType,
  })
  type: BudgetType;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  amount: number;

  @Column({ length: 10 })
  currency: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({
    type: 'enum',
    enum: PeriodType,
    nullable: true,
  })
  period_type: PeriodType;

  @Column({ type: 'decimal', precision: 20, scale: 4, default: 0 })
  spent_amount: number;

  @Column({ length: 10, default: 'USD' })
  spent_currency: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  alert_threshold: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
