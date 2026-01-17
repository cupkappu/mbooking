import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AlertStatus {
  PENDING = 'pending',
  SENT = 'sent',
  ACKNOWLEDGED = 'acknowledged',
  DISMISSED = 'dismissed',
}

export enum AlertType {
  BUDGET_WARNING = 'budget_warning',
  BUDGET_EXCEEDED = 'budget_exceeded',
  BUDGET_DEPLETED = 'budget_depleted',
  BUDGET_PERIOD_END = 'budget_period_end',
}

@Entity('budget_alerts')
@Index(['tenant_id', 'budget_id'])
@Index(['tenant_id', 'status'])
@Index(['tenant_id', 'created_at'])
export class BudgetAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  budget_id: string;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  alert_type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.PENDING,
  })
  status: AlertStatus;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  threshold_percent: number;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  spent_amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  budget_amount: number;

  @Column({ length: 10 })
  currency: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  acknowledged_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
