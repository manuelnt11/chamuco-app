import type { GroupVisibility } from '../enums/group-visibility.enum';
import type { MembershipStatus } from './membership-status';

export interface GroupSearchResult {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string;
  visibility: GroupVisibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  membershipStatus: MembershipStatus;
}

export interface GroupSearchResponse {
  data: GroupSearchResult[];
  total: number;
}
