import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntry } from './journal-entry.entity';
import { JournalLine } from './journal-line.entity';
import { QueryService } from '../query/query.service';
import { TenantContext } from '../common/context/tenant.context';

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(JournalEntry)
    private journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(JournalLine)
    private journalLineRepository: Repository<JournalLine>,
    @Inject(forwardRef(() => QueryService))
    private queryService: QueryService,
  ) {}

  private getTenantId(): string {
    return TenantContext.requireTenantId();
  }

  private getUserId(): string {
    return TenantContext.requireUserId();
  }

  async findAll(options: any = {}): Promise<JournalEntry[]> {
    const tenantId = this.getTenantId();
    return this.journalEntryRepository.find({
      where: { tenant_id: tenantId },
      relations: ['lines'],
      order: { date: 'DESC' },
      skip: options.offset || 0,
      take: options.limit || 50,
    });
  }

  async findById(id: string): Promise<JournalEntry> {
    const tenantId = this.getTenantId();
    const entry = await this.journalEntryRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['lines'],
    });
    if (!entry) {
      throw new NotFoundException(`Journal entry ${id} not found`);
    }
    return entry;
  }

  async create(data: {
    date: Date;
    description: string;
    reference_id?: string;
    lines: Array<{
      account_id: string;
      amount: number;
      currency: string;
      exchange_rate?: number;
      converted_amount?: number;
      tags?: string[];
      remarks?: string;
    }>;
  }): Promise<JournalEntry> {
    const tenantId = this.getTenantId();
    const userId = this.getUserId();
    this.validateBalancedLines(data.lines);

    const entry = this.journalEntryRepository.create({
      tenant_id: tenantId,
      date: data.date,
      description: data.description,
      reference_id: data.reference_id,
      created_by: userId,
    });

    const savedEntry = await this.journalEntryRepository.save(entry);

    const lines = data.lines.map((line) =>
      this.journalLineRepository.create({
        journal_entry_id: savedEntry.id,
        tenant_id: tenantId,
        ...line,
      }),
    );

    await this.journalLineRepository.save(lines);
    savedEntry.lines = lines;

    this.queryService.invalidateCache('balances:*');

    return savedEntry;
  }

  private validateBalancedLines(lines: any[]): void {
    const totalByCurrency: Map<string, number> = new Map();

    for (const line of lines) {
      const current = totalByCurrency.get(line.currency) || 0;
      totalByCurrency.set(line.currency, current + line.amount);
    }

    for (const [, total] of totalByCurrency) {
      if (Math.abs(total) > 0.0001) {
        throw new BadRequestException('Journal entry must be balanced');
      }
    }
  }

  async update(id: string, data: any): Promise<JournalEntry> {
    const tenantId = this.getTenantId();
    const userId = this.getUserId();
    const entry = await this.findById(id);

    if (data.lines) {
      this.validateBalancedLines(data.lines);
      await this.journalLineRepository.delete({ journal_entry_id: id });

      const lines = data.lines.map((line: any) =>
        this.journalLineRepository.create({
          journal_entry_id: id,
          tenant_id: tenantId,
          ...line,
        }),
      );
      await this.journalLineRepository.save(lines);
    }

    Object.assign(entry, {
      ...data,
      lines: undefined,
      updated_by: userId,
    });

    const savedEntry = await this.journalEntryRepository.save(entry);

    this.queryService.invalidateCache('balances:*');

    return savedEntry;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.journalEntryRepository.delete(id);

    this.queryService.invalidateCache('balances:*');
  }
}
