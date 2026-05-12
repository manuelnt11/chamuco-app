import type { Asset } from '@chamuco/shared-types';
import type { assets } from './schema/assets.schema';

export function assetRowToAsset(row: typeof assets.$inferSelect): Asset {
  return {
    id: row.id,
    type: row.type,
    source: row.source,
    target: row.target,
    fileSize: row.fileSize ?? undefined,
    isPublic: row.isPublic,
    createdAt: row.createdAt.toISOString(),
  };
}
