import type { ResolvedAsset } from '@chamuco/shared-types';

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  avatar: ResolvedAsset | null;
}

export interface UserSearchResponse {
  data: UserSearchResult[];
  total: number;
}
