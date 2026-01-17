import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum ReportType {
  BALANCE_SHEET = 'balance_sheet',
  INCOME_STATEMENT = 'income_statement',
  CASH_FLOW = 'cash_flow',
  INCOME_COMPARISON = 'income_comparison',
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
}

@Entity('report_storage')
@Index(['tenant_id', 'report_type'])
@Index(['tenant_id', 'created_at'])
export class ReportStorage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  report_type: ReportType;

  @Column({ type: 'jsonb' })
  parameters: {
    from_date?: string;
    to_date?: string;
    as_of_date?: string;
    depth?: number;
    currency?: string;
    comparison_period?: {
      prior_from_date?: string;
      prior_to_date?: string;
    };
  };

  @Column({
    type: 'enum',
    enum: ReportFormat,
    default: ReportFormat.JSON,
  })
  format: ReportFormat;

  @Column({ type: 'jsonb' })
  result: any;

  @Column({ type: 'int', default: 0 })
  size_bytes: number;

  @Column({ default: false })
  is_cached: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
