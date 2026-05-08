import type { GroupVisibility, ResolvedAsset } from '@chamuco/shared-types';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  cover: ResolvedAsset;
  visibility: GroupVisibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
