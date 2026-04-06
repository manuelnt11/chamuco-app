import type { DecodedIdToken } from 'firebase-admin/auth';
import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '@/modules/users/schema/users.schema';

export type AuthenticatedUser = InferSelectModel<typeof users>;

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: DecodedIdToken;
      user?: AuthenticatedUser;
    }
  }
}
