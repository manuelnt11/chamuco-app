import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { ResolvedAsset } from '@chamuco/shared-types';
import { AuthProvider } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';
import { assets } from '@/modules/assets/schema/assets.schema';
import { userNationalities } from '@/modules/users/schema/user-nationalities.schema';
import { userPreferences } from '@/modules/users/schema/user-preferences.schema';
import { userProfiles } from '@/modules/users/schema/user-profiles.schema';
import { users } from '@/modules/users/schema/users.schema';
import { computePassportStatus } from '@/common/utils/passport-status.util';
import { isUniqueViolation } from '@/database/db-errors';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

const PROVIDER_MAP: Record<string, AuthProvider> = {
  'google.com': AuthProvider.GOOGLE,
  'facebook.com': AuthProvider.FACEBOOK,
};

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

    if (dto.nationalities?.length) {
      const primaryNationalityCount = dto.nationalities.filter((n) => n.isPrimary).length;
      if (primaryNationalityCount !== 1) {
        throw new BadRequestException('Exactly one nationality must have isPrimary: true');
      }
    }

    if (dto.emergencyContacts?.length) {
      const primaryContactCount = dto.emergencyContacts.filter((c) => c.isPrimary).length;
      if (primaryContactCount !== 1) {
        throw new BadRequestException('Exactly one emergency contact must have isPrimary: true');
      }
    }

    const signInProvider = decodedToken.firebase?.sign_in_provider;
    const authProvider = PROVIDER_MAP[signInProvider];

    if (!authProvider) {
      throw new BadRequestException('Unsupported authentication provider');
    }

    const { day, month, year, yearVisible } = dto.dateOfBirth;
    const profileEmail = dto.email ?? decodedToken.email!;

    const { createdUser, insertedAsset } = await this.db
      .transaction(async (trx) => {
        let insertedAsset: typeof assets.$inferSelect | null = null;
        if (decodedToken.picture) {
          const [asset] = await trx
            .insert(assets)
            .values({ type: 'image', source: 'url', target: decodedToken.picture, isPublic: true })
            .returning();
          insertedAsset = asset ?? null;
        }

        const [created] = await trx
          .insert(users)
          .values({
            username: dto.username,
            displayName: dto.displayName,
            avatar: insertedAsset?.id ?? null,
            authProvider,
            firebaseUid: decodedToken.uid,
            timezone: dto.timezone,
          })
          .returning();

        if (!created) {
          throw new Error('Failed to create user record');
        }

        await trx.insert(userPreferences).values({ userId: created.id });

        await trx.insert(userProfiles).values({
          userId: created.id,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          dateOfBirth: { day, month, year, year_visible: yearVisible },
          homeCountry: dto.homeCountry,
          homeCity: dto.homeCity?.trim() ?? null,
          phoneCountryCode: dto.phoneCountryCode,
          phoneLocalNumber: dto.phoneLocalNumber,
          email: profileEmail,
          emailVerified: profileEmail === decodedToken.email,
          // Design decision: emergency contacts are stored as JSONB inside user_profiles rather
          // than as a separate user_emergency_contacts table. Independent queries on individual
          // contacts (e.g. "find all users whose emergency contact is X") are never needed, so a
          // separate entity would add join overhead without any query benefit.
          ...(dto.emergencyContacts ? { emergencyContacts: dto.emergencyContacts } : {}),
        });

        if (dto.nationalities?.length) {
          await trx.insert(userNationalities).values(
            dto.nationalities.map((n) => ({
              userId: created.id,
              countryCode: n.countryCode,
              isPrimary: n.isPrimary,
              nationalIdNumber: n.nationalIdNumber ?? null,
              passportNumber: n.passportNumber ?? null,
              passportIssueDate: n.passportIssueDate ?? null,
              passportExpiryDate: n.passportExpiryDate ?? null,
              passportStatus: computePassportStatus(n.passportExpiryDate),
            })),
          );
        }

        return { createdUser: created, insertedAsset };
      })
      .catch((err: unknown) => {
        if (isUniqueViolation(err)) {
          throw new ConflictException('Username is already taken');
        }
        throw err;
      });

    // Construct ResolvedAsset manually instead of injecting AssetResolverService: the
    // registration asset is always source='url' (OAuth picture), so url === target.
    // If this ever handles non-URL sources, inject AssetResolverService and call resolve().
    const avatar: ResolvedAsset | null = insertedAsset
      ? {
          id: insertedAsset.id,
          type: insertedAsset.type,
          source: insertedAsset.source,
          target: insertedAsset.target,
          fileSize: insertedAsset.fileSize ?? undefined,
          isPublic: insertedAsset.isPublic,
          createdAt: insertedAsset.createdAt.toISOString(),
          url: insertedAsset.target,
        }
      : null;

    return {
      id: createdUser.id,
      username: createdUser.username,
      displayName: createdUser.displayName,
      avatar,
      authProvider: createdUser.authProvider,
      timezone: createdUser.timezone,
      platformRole: createdUser.platformRole,
      agencyId: createdUser.agencyId,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
      lastActiveAt: createdUser.lastActiveAt,
    };
  }

  async logout(firebaseUid: string): Promise<void> {
    await this.firebaseAdminService.auth().revokeRefreshTokens(firebaseUid);
  }

  private extractToken(authorizationHeader: string | undefined): string {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token');
    }
    return authorizationHeader.slice(7);
  }
}
