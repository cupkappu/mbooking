import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextStore {
  tenantId: string;
  userId: string;
  requestId: string;
}

const tenantStorage = new AsyncLocalStorage<TenantContextStore>();

export class TenantContext {
  static run<T>(store: TenantContextStore, callback: () => T): T {
    return tenantStorage.run(store, callback);
  }

  static getStore(): TenantContextStore | undefined {
    return tenantStorage.getStore();
  }

  static get tenantId(): string | undefined {
    return this.getStore()?.tenantId;
  }

  static get userId(): string | undefined {
    return this.getStore()?.userId;
  }

  static get requestId(): string | undefined {
    return this.getStore()?.requestId;
  }

  static requireTenantId(): string {
    const tenantId = this.tenantId;
    if (!tenantId) {
      throw new Error('No tenant context available');
    }
    return tenantId;
  }

  static requireUserId(): string {
    const userId = this.userId;
    if (!userId) {
      throw new Error('No user context available');
    }
    return userId;
  }
}
