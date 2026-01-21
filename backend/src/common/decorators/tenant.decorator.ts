import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../context/tenant.context';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // JWT strategy returns tenantId (camelCase), check both formats
    const tenantId = request.user?.tenant_id || request.user?.tenantId;
    if (!tenantId) {
      throw new Error('No tenant context in request');
    }
    return tenantId;
  },
);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.sub || request.user?.id;
  },
);
