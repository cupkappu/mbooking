import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BudgetTemplate, TemplateCategory, SYSTEM_BUDGET_TEMPLATES } from '../entities/budget-template.entity';
import { PeriodType } from '../budget.entity';
import { TenantContext } from '../../common/context/tenant.context';

/**
 * TemplateSeedingService
 * 
 * Handles automatic seeding of system budget templates for new tenants.
 * FR-C011: New tenants get 8 system templates automatically
 * 
 * Features:
 * - Idempotent seeding (safe to call multiple times)
 * - 8 pre-defined templates created on first tenant access
 * - Templates cannot be modified or deleted by users
 */
@Injectable()
export class TemplateSeedingService {
  private readonly logger = new Logger(TemplateSeedingService.name);

  constructor(
    @InjectRepository(BudgetTemplate)
    private templateRepository: Repository<BudgetTemplate>,
  ) {}

  /**
   * Get tenant ID from context
   */
  private getTenantId(): string {
    return TenantContext.requireTenantId();
  }

  /**
   * Seed system templates for a tenant
   * FR-C011: New tenants get 8 system templates automatically
   * 
   * This method is idempotent - safe to call multiple times.
   * Only creates templates if they don't already exist.
   */
  async seedSystemTemplates(): Promise<{ created: number; skipped: number }> {
    const tenantId = this.getTenantId();
    let created = 0;
    let skipped = 0;

    this.logger.log(`Starting template seeding for tenant ${tenantId}`);

    for (const templateData of SYSTEM_BUDGET_TEMPLATES) {
      const exists = await this.checkTemplateExists(tenantId, templateData.name);
      
      if (!exists) {
        await this.createSystemTemplate(tenantId, templateData);
        created++;
        this.logger.debug(`Created system template: ${templateData.name}`);
      } else {
        skipped++;
        this.logger.debug(`Template already exists: ${templateData.name}`);
      }
    }

    this.logger.log(`Template seeding complete for tenant ${tenantId}: ${created} created, ${skipped} skipped`);
    return { created, skipped };
  }

  /**
   * Check if a template already exists for the tenant
   * Used for idempotency check
   */
  private async checkTemplateExists(tenantId: string, templateName: string): Promise<boolean> {
    const existing = await this.templateRepository.findOne({
      where: {
        tenant_id: tenantId,
        name: templateName,
        is_system_template: true,
      },
    });
    return !!existing;
  }

  /**
   * Create a single system template
   */
  private async createSystemTemplate(
    tenantId: string,
    templateData: typeof SYSTEM_BUDGET_TEMPLATES[0],
  ): Promise<BudgetTemplate> {
    const template = this.templateRepository.create({
      id: uuidv4(),
      tenant_id: tenantId,
      name: templateData.name,
      description: templateData.description,
      category: templateData.category,
      account_pattern: templateData.account_pattern,
      account_type: templateData.account_type,
      default_period_type: templateData.default_period_type,
      default_amount: templateData.default_amount,
      default_currency: templateData.default_currency,
      default_alert_threshold: templateData.default_alert_threshold,
      suggested_categories: templateData.suggested_categories,
      metadata: templateData.metadata,
      is_system_template: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.templateRepository.save(template);
  }

  /**
   * Get count of system templates for a tenant
   * Useful for verification and debugging
   */
  async getSystemTemplateCount(tenantId: string): Promise<number> {
    return this.templateRepository.count({
      where: {
        tenant_id: tenantId,
        is_system_template: true,
        is_active: true,
      },
    });
  }

  /**
   * Verify all system templates exist for a tenant
   * Returns true if all templates are present
   */
  async verifyAllTemplatesExist(tenantId: string): Promise<boolean> {
    const count = await this.getSystemTemplateCount(tenantId);
    return count === SYSTEM_BUDGET_TEMPLATES.length;
  }

  /**
   * Seed templates if not already seeded
   * Wrapper method for tenant creation flow
   * 
   * @returns true if seeding was performed, false if already seeded
   */
  async seedIfNeeded(): Promise<{ seeded: boolean; templatesCreated: number }> {
    const tenantId = this.getTenantId();
    const alreadySeeded = await this.verifyAllTemplatesExist(tenantId);
    
    if (alreadySeeded) {
      this.logger.debug(`Templates already seeded for tenant ${tenantId}`);
      return { seeded: false, templatesCreated: 0 };
    }

    const result = await this.seedSystemTemplates();
    return { seeded: true, templatesCreated: result.created };
  }
}
