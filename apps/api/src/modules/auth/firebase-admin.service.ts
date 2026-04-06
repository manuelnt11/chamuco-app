import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    if (admin.apps.length > 0) {
      this.logger.log('Firebase Admin app already initialized — skipping');
      return;
    }

    const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON')!;

    const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    this.logger.log('Firebase Admin SDK initialized');
  }

  auth(): admin.auth.Auth {
    return admin.auth();
  }
}
