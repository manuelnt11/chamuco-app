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
import { IS_FIREBASE_ONLY_KEY } from '@/common/decorators/firebase-only.decorator';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';
import { UsersService } from '@/modules/users/users.service';
import { users } from '@/modules/users/schema/users.schema';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly usersService: UsersService,
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

    const isFirebaseOnly = this.reflector.getAllAndOverride<boolean>(IS_FIREBASE_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    try {
      const decodedToken = await this.firebaseAdminService.auth().verifyIdToken(token);

      request.firebaseUser = decodedToken;

      // @FirebaseOnly() endpoints only verify the Firebase token — no DB user lookup.
      // Used for endpoints accessible during onboarding before Chamuco registration.
      if (isFirebaseOnly) {
        return true;
      }

      // findByFirebaseUid throws NotFoundException when the user has not completed
      // Chamuco registration. 404 is semantically correct: authenticated identity
      // exists, Chamuco user does not. The frontend relies on this to route new
      // users to /onboarding.
      const user = await this.usersService.findByFirebaseUid(decodedToken.uid);

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
