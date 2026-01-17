import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ReportStorage, ReportType, ReportFormat } from './entities/report-storage.entity';

interface ReportCacheKey {
  reportType: ReportType;
  parameters: Record<string, any>;
}

@Injectable()
export class ReportCacheService {
  private readonly CACHE_TTL_HOURS = 24;

  constructor(
    @InjectRepository(ReportStorage)
    private reportStorageRepository: Repository<ReportStorage>,
  ) {}

  private generateCacheKey(params: ReportCacheKey): string {
    const sortedParams = Object.keys(params.parameters)
      .sort()
      .map((key) => `${key}:${JSON.stringify(params.parameters[key])}`)
      .join('|');
    return `${params.reportType}:${sortedParams}`;
  }

  async getCachedReport(reportType: ReportType, parameters: Record<string, any>): Promise<ReportStorage | null> {
    const cacheKey = this.generateCacheKey({ reportType, parameters });

    const cached = await this.reportStorageRepository.findOne({
      where: {
        report_type: reportType,
        is_cached: true,
        expires_at: null, // Never expires OR
      },
      order: { created_at: 'DESC' },
    });

    if (!cached) return null;

    // Check if cached result matches parameters
    const cachedParams = cached.parameters as Record<string, any>;
    const paramsMatch = this.compareParameters(parameters, cachedParams);

    if (!paramsMatch) return null;

    return cached;
  }

  async cacheReport(
    tenantId: string,
    reportType: ReportType,
    parameters: Record<string, any>,
    result: any,
    format: ReportFormat = ReportFormat.JSON,
  ): Promise<ReportStorage> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.CACHE_TTL_HOURS);

    const reportStorage = this.reportStorageRepository.create({
      id: uuidv4(),
      tenant_id: tenantId,
      report_type: reportType,
      parameters,
      format,
      result,
      size_bytes: JSON.stringify(result).length,
      is_cached: true,
      expires_at: expiresAt,
      created_at: new Date(),
    });

    return this.reportStorageRepository.save(reportStorage);
  }

  async invalidateCache(reportType?: ReportType): Promise<void> {
    if (reportType) {
      await this.reportStorageRepository.delete({
        report_type: reportType,
        is_cached: true,
      });
    } else {
      await this.reportStorageRepository.delete({ is_cached: true });
    }
  }

  async getCacheStats(tenantId: string): Promise<{
    total_cached: number;
    total_size_bytes: number;
    by_type: Record<string, number>;
  }> {
    const cached = await this.reportStorageRepository.find({
      where: { tenant_id: tenantId, is_cached: true },
    });

    const byType: Record<string, number> = {};
    let totalSize = 0;

    for (const report of cached) {
      byType[report.report_type] = (byType[report.report_type] || 0) + 1;
      totalSize += report.size_bytes;
    }

    return {
      total_cached: cached.length,
      total_size_bytes: totalSize,
      by_type: byType,
    };
  }

  private compareParameters(params1: Record<string, any>, params2: Record<string, any>): boolean {
    const keys1 = Object.keys(params1).sort();
    const keys2 = Object.keys(params2).sort();

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (JSON.stringify(params1[key]) !== JSON.stringify(params2[key])) {
        return false;
      }
    }

    return true;
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.reportStorageRepository
      .createQueryBuilder()
      .delete()
      .from(ReportStorage)
      .where('is_cached = :isCached', { isCached: true })
      .andWhere('expires_at < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }
}
