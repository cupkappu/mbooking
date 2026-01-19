import {
  Repository,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  SelectQueryBuilder,
} from 'typeorm';
import { TenantContext } from '../context/tenant.context';

export class TenantAwareRepository<T> {
  constructor(
    private repository: Repository<T>,
    private tenantId: string,
  ) {}

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const tenantFilter = this.buildTenantFilter(options?.where);
    return this.repository.find({
      ...options,
      where: tenantFilter,
    });
  }

  async findOne(options?: FindOneOptions<T>): Promise<T | null> {
    const tenantFilter = this.buildTenantFilter(options?.where);
    return this.repository.findOne({
      ...options,
      where: tenantFilter,
    });
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: { id, tenant_id: this.tenantId } as any,
    });
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    return this.repository
      .createQueryBuilder(alias)
      .andWhere(`${alias}.tenant_id = :tenantId`, { tenantId: this.tenantId });
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    const tenantFilter = this.buildTenantFilter(options?.where);
    return this.repository.count({
      ...options,
      where: tenantFilter,
    });
  }

  private buildTenantFilter(existingWhere?: any): any {
    if (!existingWhere) {
      return { tenant_id: this.tenantId } as any;
    }

    if (Array.isArray(existingWhere)) {
      return existingWhere.map((w) => ({ ...w, tenant_id: this.tenantId }));
    }

    return { ...existingWhere, tenant_id: this.tenantId };
  }
}

export function createTenantAwareRepository<T>(
  repository: Repository<T>,
  tenantId?: string,
): TenantAwareRepository<T> {
  const actualTenantId = tenantId || TenantContext.requireTenantId();
  return new TenantAwareRepository<T>(repository, actualTenantId);
}
