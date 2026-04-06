import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@chamuco/shared-types';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import type { AuthenticatedUser } from '@/types/express.d';
import type { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<PlatformRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (user.platformRole === PlatformRole.SUPPORT_ADMIN) {
      return true;
    }

    if (requiredRoles.includes(user.platformRole)) {
      return true;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
