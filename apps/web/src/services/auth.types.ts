import type { DateOfBirth } from '@chamuco/shared-types';

export interface RegisterPayload {
  username: string;
  displayName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: DateOfBirth;
  homeCountry: string;
  homeCity?: string;
  phoneCountryCode: string;
  phoneLocalNumber: string;
  email: string | null;
  timezone: string;
}
