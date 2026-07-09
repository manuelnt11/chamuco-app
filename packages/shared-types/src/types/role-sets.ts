import { GroupRole } from '../enums/group-role.enum';
import { TripRole } from '../enums/trip-role.enum';

export const ORGANIZER_ROLES: readonly TripRole[] = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER];
export const GROUP_ADMIN_ROLES: readonly GroupRole[] = [GroupRole.OWNER, GroupRole.ADMIN];
