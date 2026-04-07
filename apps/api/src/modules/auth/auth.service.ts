import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AuthProvider } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';
import { userPreferences } from '@/modules/users/schema/user-preferences.schema';
import { users } from '@/modules/users/schema/users.schema';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { UsernameCheckResponseDto } from './dto/username-check-response.dto';

const PROVIDER_MAP: Record<string, AuthProvider> = {
  'google.com': AuthProvider.GOOGLE,
  'facebook.com': AuthProvider.FACEBOOK,
};

// PostgreSQL unique_violation error code
const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as Record<string, unknown>).code === PG_UNIQUE_VIOLATION
  );
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  async register(
    authorizationHeader: string | undefined,
    dto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    const token = this.extractToken(authorizationHeader);

    const decodedToken = await this.firebaseAdminService
      .auth()
      .verifyIdToken(token)
      .catch(() => {
        throw new UnauthorizedException('Invalid or expired token');
      });

    if (!decodedToken.email) {
      throw new BadRequestException('Firebase token is missing email claim');
    }

    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.firebaseUid, decodedToken.uid),
    });

    if (existingUser) {
      throw new ConflictException('User already registered');
    }

    const signInProvider = decodedToken.firebase?.sign_in_provider;
    const authProvider = PROVIDER_MAP[signInProvider];

    if (!authProvider) {
      throw new BadRequestException('Unsupported authentication provider');
    }

    const newUser = await this.db
      .transaction(async (trx) => {
        const inserted = await trx
          .insert(users)
          .values({
            email: decodedToken.email!,
            username: dto.username,
            displayName: decodedToken.name ?? decodedToken.email!,
            avatarUrl: decodedToken.picture ?? null,
            authProvider,
            firebaseUid: decodedToken.uid,
          })
          .returning();

        const created = inserted[0];

        if (!created) {
          throw new Error('Failed to create user record');
        }

        await trx.insert(userPreferences).values({ userId: created.id });

        return created;
      })
      .catch((err: unknown) => {
        if (isUniqueViolation(err)) {
          throw new ConflictException('Username is already taken');
        }
        throw err;
      });

    return newUser;
  }

  async logout(firebaseUid: string): Promise<void> {
    await this.firebaseAdminService.auth().revokeRefreshTokens(firebaseUid);
  }

  async checkUsernameAvailability(username: string): Promise<UsernameCheckResponseDto> {
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.username, username),
    });
    return { available: !existingUser, username };
  }

  private extractToken(authorizationHeader: string | undefined): string {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token');
    }
    return authorizationHeader.slice(7);
  }
}
