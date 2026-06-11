export interface RegisterPayload {
  username: string;
  displayName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: { day: number; month: number; year: number; yearVisible: boolean };
  homeCountry: string;
  homeCity?: string;
  phoneCountryCode: string;
  phoneLocalNumber: string;
  email: string | null;
  timezone: string;
}
