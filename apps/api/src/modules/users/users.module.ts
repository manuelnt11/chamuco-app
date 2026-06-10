import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersProfileController } from './users-profile.controller';
import { UsersProfileService } from './users-profile.service';
import { UsersHealthController } from './users-health.controller';
import { UsersHealthService } from './users-health.service';
import { UsersEmergencyContactsController } from './users-emergency-contacts.controller';
import { UsersEmergencyContactsService } from './users-emergency-contacts.service';
import { UsersTravelDocsController } from './users-travel-docs.controller';
import { UsersTravelDocsService } from './users-travel-docs.service';
import { UsersLoyaltyProgramsController } from './users-loyalty-programs.controller';
import { UsersLoyaltyProgramsService } from './users-loyalty-programs.service';
import { UsersPreferencesController } from './users-preferences.controller';
import { UsersPreferencesService } from './users-preferences.service';

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
