import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { InvitationTokenContext, type InvitationTokenRedeemer } from '@chamuco/shared-types';
import { users } from '@/modules/users/schema/users.schema';

export const invitationTokenContextEnum = pgEnum('invitation_token_context', [
  InvitationTokenContext.REFERRAL,
  InvitationTokenContext.TRIP,
  InvitationTokenContext.GROUP,
]);

export const invitationTokens = pgTable(
  'invitation_tokens',
  {
    token: text('token').primaryKey(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    contextType: invitationTokenContextEnum('context_type').notNull(),
    contextId: uuid('context_id'),
    recipientEmail: text('recipient_email'),
    isActive: boolean('is_active').notNull().default(true),
    redeemers: jsonb('redeemers')
      .$type<InvitationTokenRedeemer[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (t) => [
    // One open link per context — PostgreSQL NULL ≠ NULL so referral links (contextId = NULL)
    // are not constrained by this index, allowing each user to have their own open referral link.
    uniqueIndex('idx_invitation_tokens_one_open_per_context')
      .on(t.contextType, t.contextId)
      .where(sql`${t.recipientEmail} IS NULL`),
    // One targeted link per (context, email) — all three columns are non-null for targeted links
    // so the unique constraint is fully enforced.
    uniqueIndex('idx_invitation_tokens_one_targeted_per_context')
      .on(t.contextType, t.contextId, t.recipientEmail)
      .where(sql`${t.recipientEmail} IS NOT NULL`),
    index('idx_invitation_tokens_created_by').on(t.createdBy),
  ],
);

export const invitationTokensRelations = relations(invitationTokens, ({ one }) => ({
  creator: one(users, { fields: [invitationTokens.createdBy], references: [users.id] }),
}));
