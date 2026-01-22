import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject, bufferTime, filter, Subscription } from 'rxjs';
import { AuditLog } from '../entities/audit-log.entity';
import { AdminAuditEvent } from './admin-events.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditEventPublisher {
  private readonly logger = new Logger(AuditEventPublisher.name);
  private eventSubject = new Subject<AdminAuditEvent>();
  private subscription?: Subscription;

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {
    this.initializeSubscription();
  }

  private initializeSubscription(): void {
    this.subscription = this.eventSubject.pipe(
      bufferTime(1000),
      filter(events => events.length > 0),
    ).subscribe({
      next: async (events) => {
        await this.batchSave(events);
      },
      error: (error) => {
        this.logger.error('Audit event subscription error', error);
      },
    });
  }

  publish(event: AdminAuditEvent): void {
    const enrichedEvent: AdminAuditEvent = {
      ...event,
      id: event.id || uuidv4(),
      timestamp: event.timestamp || new Date(),
    };

    this.eventSubject.next(enrichedEvent);
  }

  private async batchSave(events: AdminAuditEvent[]): Promise<void> {
    try {
      const logs = events.map(event =>
        this.auditLogRepository.create({
          id: event.id,
          tenant_id: event.tenantId,
          user_id: event.userId,
          action: event.action,
          entity_type: event.entityType,
          entity_id: event.entityId,
          old_value: event.oldValue ? JSON.parse(JSON.stringify(event.oldValue)) : undefined,
          new_value: event.newValue ? JSON.parse(JSON.stringify(event.newValue)) : undefined,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          created_at: event.timestamp,
        }),
      );

      await this.auditLogRepository.save(logs);
      this.logger.debug(`Batch saved ${logs.length} audit logs`);
    } catch (error) {
      this.logger.error('Failed to batch save audit logs', error);
    }
  }

  async flush(): Promise<void> {
    this.subscription?.unsubscribe();
    this.initializeSubscription();
  }

  async close(): Promise<void> {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }
}
