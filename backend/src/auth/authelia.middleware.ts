import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AutheliaMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authUser = req.headers['x-auth-user'] as string;
    const authEmail = req.headers['x-auth-email'] as string;
    const authGroups = req.headers['x-auth-groups'] as string;
    const authRoles = req.headers['x-auth-roles'] as string;

    if (authUser && authEmail) {
      (req as any).user = {
        id: authUser,
        email: authEmail,
        groups: authGroups ? authGroups.split(',') : [],
        roles: authRoles ? authRoles.split(',') : [],
        provider: 'authelia',
      };
    }

    next();
  }
}
