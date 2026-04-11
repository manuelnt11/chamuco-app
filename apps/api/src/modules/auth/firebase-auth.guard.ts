import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';
import { users } from '@/modules/users/schema/users.schema';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly firebaseAdminService: FirebaseAdminService,
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const decodedToken = await this.firebaseAdminService.auth().verifyIdToken(token);

      const user = await this.db.query.users.findFirst({
        where: eq(users.firebaseUid, decodedToken.uid),
      });

      if (!user) {
        // Firebase token is valid but the user has not completed Chamuco registration.
        // 404 is semantically correct here: authenticated identity exists, Chamuco user does not.
        // The frontend (sign-in and onboarding pages) relies on this to route new users to /onboarding.
        throw new NotFoundException('User not registered');
      }

      request.firebaseUser = decodedToken;
      request.user = user;

      this.updateLastActive(user.id).catch((err: unknown) => {
        this.logger.error('Failed to update last_active_at', err);
      });

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return undefined;
    }
    return authHeader.slice(7);
  }

  private async updateLastActive(userId: string): Promise<void> {
    await this.db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, userId));
  }
}
