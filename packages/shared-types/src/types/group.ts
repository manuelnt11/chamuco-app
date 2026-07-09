import type { GroupVisibility } from '../enums/group-visibility.enum';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string;
  visibility: GroupVisibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
