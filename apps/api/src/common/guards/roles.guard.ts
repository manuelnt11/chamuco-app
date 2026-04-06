import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@chamuco/shared-types';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import type { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

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
    const { user } = request;

    // req.user is undefined when FirebaseAuthGuard was bypassed via @Public().
    // Combining @Public() with @Roles() is a misconfiguration — this guard treats
    // it as a denial. The two decorators should never be used together.
    if (!user) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (user.platformRole === PlatformRole.SUPPORT_ADMIN) {
      return true;
    }

    if (requiredRoles.includes(user.platformRole)) {
      return true;
    }

    this.logger.warn(
      `Access denied: user ${user.id} (${user.platformRole}) attempted to reach route requiring [${requiredRoles.join(', ')}]`,
    );
    throw new ForbiddenException('Insufficient permissions');
  }
}
