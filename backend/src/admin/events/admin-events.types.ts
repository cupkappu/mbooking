export type AdminAction = 
  // 用户管理
  | 'admin.user.create'
  | 'admin.user.update'
  | 'admin.user.disable'
  | 'admin.user.reset_password'
  | 'admin.user.bulk_action'
  // 提供商管理
  | 'admin.provider.create'
  | 'admin.provider.update'
  | 'admin.provider.delete'
  | 'admin.provider.toggle'
  | 'admin.provider.test'
  // 货币管理
  | 'admin.currency.create'
  | 'admin.currency.update'
  | 'admin.currency.delete'
  | 'admin.currency.seed'
  // 调度器管理
  | 'admin.scheduler.config'
  | 'admin.scheduler.manual_fetch'
  // 插件管理
  | 'admin.plugin.upload'
  | 'admin.plugin.reload'
  // 系统配置
  | 'admin.config.update';

export interface AdminAuditEvent {
  id: string;
  action: AdminAction;
  entityType: string;
  entityId?: string;
  userId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  tenantId?: string;
  timestamp: Date;
}
