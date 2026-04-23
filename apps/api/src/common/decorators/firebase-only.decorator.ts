import { SetMetadata } from '@nestjs/common';

export const IS_FIREBASE_ONLY_KEY = 'isFirebaseOnly';
export const FirebaseOnly = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(IS_FIREBASE_ONLY_KEY, true);
