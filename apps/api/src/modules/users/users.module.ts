import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersProfileController } from './profile/users-profile.controller';
import { UsersProfileService } from './profile/users-profile.service';
import { UsersHealthController } from './health/users-health.controller';
import { UsersHealthService } from './health/users-health.service';
import { UsersEmergencyContactsController } from './emergency-contacts/users-emergency-contacts.controller';
import { UsersEmergencyContactsService } from './emergency-contacts/users-emergency-contacts.service';
import { UsersTravelDocsController } from './travel-docs/users-travel-docs.controller';
import { UsersTravelDocsService } from './travel-docs/users-travel-docs.service';
import { UsersLoyaltyProgramsController } from './loyalty-programs/users-loyalty-programs.controller';
import { UsersLoyaltyProgramsService } from './loyalty-programs/users-loyalty-programs.service';
import { UsersPreferencesController } from './preferences/users-preferences.controller';
import { UsersPreferencesService } from './preferences/users-preferences.service';

@Module({
  controllers: [
    // Specific "me/..." routes first — registered before any parameterized route.
    // UsersController has GET :username/profile which would shadow literal routes if registered first.
    UsersProfileController,
    UsersHealthController,
    UsersEmergencyContactsController,
    UsersTravelDocsController,
    UsersLoyaltyProgramsController,
    UsersPreferencesController,
    // UsersController LAST — contains GET :username/profile (parameterized).
    UsersController,
  ],
  providers: [
    UsersService,
    UsersProfileService,
    UsersHealthService,
    UsersEmergencyContactsService,
    UsersTravelDocsService,
    UsersLoyaltyProgramsService,
    UsersPreferencesService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
