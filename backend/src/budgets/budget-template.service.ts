import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BudgetTemplate, TemplateCategory, SYSTEM_BUDGET_TEMPLATES } from './entities/budget-template.entity';
import { Budget, BudgetType, PeriodType } from './budget.entity';
import { Account } from '../accounts/account.entity';

export interface CreateTemplateDto {
  name: string;
  description?: string;
  category?: TemplateCategory;
  account_pattern?: string;
  account_type?: string;
  default_period_type?: PeriodType;
  default_amount?: number;
  default_currency?: string;
  default_alert_threshold?: number;
  suggested_categories?: string[];
  metadata?: Record<string, any>;
}

export interface ApplyTemplateDto {
  template_id: string;
  account_id?: string;
  start_date: Date;
  end_date?: Date;
  amount?: number;
  currency?: string;
  alert_threshold?: number;
}

@Injectable()
export class BudgetTemplateService {
  constructor(
    @InjectRepository(BudgetTemplate)
    private templateRepository: Repository<BudgetTemplate>,
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async initializeSystemTemplates(tenantId: string): Promise<void> {
    for (const templateData of SYSTEM_BUDGET_TEMPLATES) {
      const existing = await this.templateRepository.findOne({
        where: {
          tenant_id: tenantId,
          name: templateData.name,
          is_system_template: true,
        },
      });

      if (!existing) {
        const template = this.templateRepository.create({
          id: uuidv4(),
          tenant_id: tenantId,
          ...templateData,
          created_at: new Date(),
          updated_at: new Date(),
        });
        await this.templateRepository.save(template);
      }
    }
  }

  async createTemplate(
    tenantId: string,
    data: CreateTemplateDto,
  ): Promise<BudgetTemplate> {
    const template = this.templateRepository.create({
      id: uuidv4(),
      tenant_id: tenantId,
      name: data.name,
      description: data.description,
      category: data.category || TemplateCategory.CUSTOM,
      account_pattern: data.account_pattern,
      account_type: data.account_type,
      default_period_type: data.default_period_type || PeriodType.MONTHLY,
      default_amount: data.default_amount,
      default_currency: data.default_currency || 'USD',
      default_alert_threshold: data.default_alert_threshold,
      suggested_categories: data.suggested_categories,
      metadata: data.metadata,
      is_system_template: false,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.templateRepository.save(template);
  }

  async listTemplates(
    tenantId: string,
    options: {
      category?: TemplateCategory;
      includeSystem?: boolean;
      search?: string;
    } = {},
  ): Promise<{ templates: BudgetTemplate[]; total: number }> {
    const { category, includeSystem = true, search } = options;

    const query = this.templateRepository
      .createQueryBuilder('template')
      .where('template.tenant_id = :tenantId', { tenantId })
      .andWhere('template.is_active = :isActive', { isActive: true });

    if (!includeSystem) {
      query.andWhere('template.is_system_template = :isSystem', { isSystem: false });
    }

    if (category) {
      query.andWhere('template.category = :category', { category });
    }

    if (search) {
      query.andWhere(
        '(template.name ILIKE :search OR template.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('template.is_system_template', 'DESC');
    query.addOrderBy('template.name', 'ASC');

    const [templates, total] = await query.getManyAndCount();

    return { templates, total };
  }

  async getTemplate(templateId: string, tenantId: string): Promise<BudgetTemplate | null> {
    return this.templateRepository.findOne({
      where: { id: templateId, tenant_id: tenantId },
    });
  }

  async updateTemplate(
    templateId: string,
    tenantId: string,
    data: Partial<CreateTemplateDto>,
  ): Promise<BudgetTemplate | null> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, tenant_id: tenantId },
    });

    if (!template) {
      return null;
    }

    if (template.is_system_template) {
      throw new Error('Cannot modify system templates');
    }

    Object.assign(template, {
      ...data,
      updated_at: new Date(),
    });

    return this.templateRepository.save(template);
  }

  async deleteTemplate(templateId: string, tenantId: string): Promise<boolean> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, tenant_id: tenantId },
    });

    if (!template) {
      return false;
    }

    if (template.is_system_template) {
      throw new Error('Cannot delete system templates');
    }

    template.is_active = false;
    await this.templateRepository.save(template);

    return true;
  }

  async applyTemplate(
    tenantId: string,
    userId: string,
    data: ApplyTemplateDto,
  ): Promise<Budget> {
    const template = await this.templateRepository.findOne({
      where: { id: data.template_id, tenant_id: tenantId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Find matching account if account_id not provided
    let accountId = data.account_id;
    if (!accountId && template.account_type) {
      const accounts = await this.accountRepository.find({
        where: {
          tenant_id: tenantId,
          type: template.account_type as any,
          is_active: true,
        },
        take: 1,
      });
      if (accounts.length > 0) {
        accountId = accounts[0].id;
      }
    }

    const budget = this.budgetRepository.create({
      id: uuidv4(),
      tenant_id: tenantId,
      account_id: accountId || null,
      name: template.name,
      type: BudgetType.PERIODIC,
      amount: data.amount || template.default_amount || 0,
      currency: data.currency || template.default_currency || 'USD',
      start_date: data.start_date,
      end_date: data.end_date || null,
      period_type: template.default_period_type,
      alert_threshold: data.alert_threshold ?? template.default_alert_threshold ?? 80,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.budgetRepository.save(budget);
  }

  async duplicateTemplate(
    templateId: string,
    tenantId: string,
    newName?: string,
  ): Promise<BudgetTemplate | null> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, tenant_id: tenantId },
    });

    if (!template) {
      return null;
    }

    const duplicate = this.templateRepository.create({
      id: uuidv4(),
      tenant_id: tenantId,
      name: newName || `${template.name} (Copy)`,
      description: template.description,
      category: TemplateCategory.CUSTOM,
      account_pattern: template.account_pattern,
      account_type: template.account_type,
      default_period_type: template.default_period_type,
      default_amount: template.default_amount,
      default_currency: template.default_currency,
      default_alert_threshold: template.default_alert_threshold,
      suggested_categories: template.suggested_categories,
      metadata: template.metadata,
      is_system_template: false,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.templateRepository.save(duplicate);
  }

  async getTemplateCategories(tenantId: string): Promise<{ category: string; count: number }[]> {
    const result = await this.templateRepository
      .createQueryBuilder('template')
      .select('template.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('template.tenant_id = :tenantId', { tenantId })
      .andWhere('template.is_active = :isActive', { isActive: true })
      .groupBy('template.category')
      .getRawMany();

    return result;
  }
}
