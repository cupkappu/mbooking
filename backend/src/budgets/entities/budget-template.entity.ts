import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { PeriodType } from '../budget.entity';

export enum TemplateCategory {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  SAVINGS = 'savings',
  EXPENSE = 'expense',
  CUSTOM = 'custom',
}

@Entity('budget_templates')
@Index(['category'])
@Index(['is_system_template'])
export class BudgetTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.PERSONAL,
  })
  category: TemplateCategory;

  @Column({ default: false })
  is_system_template: boolean;

  @Column({ nullable: true })
  account_pattern: string;

  @Column({ nullable: true })
  account_type: string;

  @Column({
    type: 'enum',
    enum: PeriodType,
    default: PeriodType.MONTHLY,
  })
  default_period_type: PeriodType;

  @Column({ type: 'decimal', precision: 20, scale: 4, nullable: true })
  default_amount: number;

  @Column({ length: 10, default: 'USD' })
  default_currency: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  default_alert_threshold: number;

  @Column({ type: 'jsonb', nullable: true })
  suggested_categories: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// Pre-defined system templates
export const SYSTEM_BUDGET_TEMPLATES: Partial<BudgetTemplate>[] = [
  {
    name: 'Monthly Living Expenses',
    description: 'Template for tracking monthly living expenses like rent, utilities, groceries',
    category: TemplateCategory.PERSONAL,
    is_system_template: true,
    account_type: 'expense',
    default_period_type: PeriodType.MONTHLY,
    default_alert_threshold: 80,
    suggested_categories: ['Housing', 'Utilities', 'Groceries', 'Transportation'],
  },
  {
    name: 'Business Operating Expenses',
    description: 'Template for tracking business operating expenses',
    category: TemplateCategory.BUSINESS,
    is_system_template: true,
    account_type: 'expense',
    default_period_type: PeriodType.MONTHLY,
    default_alert_threshold: 90,
    suggested_categories: ['Office Supplies', 'Software', 'Marketing', 'Travel'],
  },
  {
    name: 'Savings Goal',
    description: 'Template for tracking progress towards savings goals',
    category: TemplateCategory.SAVINGS,
    is_system_template: true,
    account_type: 'asset',
    default_period_type: PeriodType.MONTHLY,
    default_alert_threshold: 0,
    suggested_categories: ['Emergency Fund', 'Vacation', 'Investment'],
  },
  {
    name: 'Entertainment Budget',
    description: 'Template for tracking entertainment and leisure spending',
    category: TemplateCategory.PERSONAL,
    is_system_template: true,
    account_type: 'expense',
    default_period_type: PeriodType.MONTHLY,
    default_alert_threshold: 75,
    suggested_categories: ['Movies', 'Dining Out', 'Hobbies', 'Subscriptions'],
  },
  {
    name: 'Healthcare Expenses',
    description: 'Template for tracking healthcare and medical expenses',
    category: TemplateCategory.PERSONAL,
    is_system_template: true,
    account_type: 'expense',
    default_period_type: PeriodType.MONTHLY,
    default_alert_threshold: 60,
    suggested_categories: ['Doctor Visits', 'Pharmacy', 'Dental', 'Vision'],
  },
  {
    name: 'Weekly Grocery Budget',
    description: 'Template for weekly grocery shopping budget',
    category: TemplateCategory.PERSONAL,
    is_system_template: true,
    account_type: 'expense',
    default_period_type: PeriodType.WEEKLY,
    default_alert_threshold: 85,
    suggested_categories: ['Groceries', 'Household Items'],
  },
  {
    name: 'Quarterly Tax Reserve',
    description: 'Template for setting aside quarterly tax reserves',
    category: TemplateCategory.BUSINESS,
    is_system_template: true,
    account_type: 'liability',
    default_period_type: PeriodType.MONTHLY,
    default_alert_threshold: 100,
    suggested_categories: ['Income Tax', 'Sales Tax', 'Payroll Tax'],
  },
  {
    name: 'Annual Subscription Management',
    description: 'Template for tracking annual subscription services',
    category: TemplateCategory.PERSONAL,
    is_system_template: true,
    account_type: 'expense',
    default_period_type: PeriodType.YEARLY,
    default_alert_threshold: 50,
    suggested_categories: ['Software', 'Streaming', 'Memberships'],
  },
];
