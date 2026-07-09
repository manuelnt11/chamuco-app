import type { MembershipStatus } from './membership-status';
import type { Group } from './group';

export interface GroupSearchResult extends Group {
  memberCount: number;
  membershipStatus: MembershipStatus;
}

export interface GroupSearchResponse {
  data: GroupSearchResult[];
  total: number;
}
