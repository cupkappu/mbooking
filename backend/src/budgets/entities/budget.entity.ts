import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

export enum BudgetType {
  PERIODIC = 'periodic',
  NON_PERIODIC = 'non_periodic',
}

export enum PeriodType {
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  YEARLY = 'yearly',
}

export enum BudgetStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLETED = 'completed',
}

@Entity('budgets')
@Index(['tenant_id', 'is_active'])
@Index(['tenant_id', 'type', 'period_type'])
@Index(['account_id'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column({ nullable: true })
  account_id: string | null;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: BudgetType,
    default: BudgetType.PERIODIC,
  })
  type: BudgetType;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  amount: number;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date | null;

  @Column({
    type: 'enum',
    enum: PeriodType,
    nullable: true,
  })
  period_type: PeriodType | null;

  @Column({ type: 'decimal', precision: 20, scale: 4, default: 0 })
  spent_amount: number;

  @Column({ length: 10, default: 'USD' })
  spent_currency: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  alert_threshold: number;

  @Column({
    type: 'enum',
    enum: BudgetStatus,
    default: BudgetStatus.ACTIVE,
  })
  status: BudgetStatus;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
