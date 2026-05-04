'use client';

import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';
import { getCountryDataList } from 'countries-list';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SaveButton } from '@/components/ui/save-button';
import { CountryCombobox, getCallingCode } from '@/components/ui/country-combobox';
import { CityCombobox } from '@/components/ui/city-combobox';
import { toast } from '@/components/ui/toast';
import { FieldMessage } from '@/components/ui/field-message';
import { apiClient } from '@/services/api-client';
import { NAME_REGEX, normalizeName } from '@/lib/name-utils';

export interface PersonalDetailsProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: { day: number; month: number; year: number; yearVisible: boolean };
  phoneCountryCode: string;
  phoneLocalNumber: string;
  birthCountry: string | null;
  birthCity: string | null;
  homeCountry: string;
  homeCity: string | null;
  email: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

interface PersonalDetailsSectionProps {
  profile: PersonalDetailsProfile;
  onRefresh: () => void;
}

function callingCodeToIso2(callingCode: string): string {
  const digits = Number(callingCode.replace('+', ''));
  return getCountryDataList().find((c) => c.phone[0] === digits)?.iso2 ?? 'CO';
}

function isValidCalendarDay(day: number, month: number, year: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

const CURRENT_YEAR = new Date().getFullYear();

export function PersonalDetailsSection({ profile, onRefresh }: PersonalDetailsSectionProps) {
  const { t } = useTranslation('profile');

  const [firstName, setFirstName] = useState(profile.firstName.toUpperCase());
  const [lastName, setLastName] = useState(profile.lastName.toUpperCase());
  const [dobDay, setDobDay] = useState(String(profile.dateOfBirth.day));
  const [dobMonth, setDobMonth] = useState(String(profile.dateOfBirth.month));
  const [dobYear, setDobYear] = useState(String(profile.dateOfBirth.year));
  const [yearVisible, setYearVisible] = useState(profile.dateOfBirth.yearVisible);
  const [phoneCountryIso, setPhoneCountryIso] = useState(
    callingCodeToIso2(profile.phoneCountryCode),
  );
  const [phoneLocalNumber, setPhoneLocalNumber] = useState(profile.phoneLocalNumber);
  const [birthCountry, setBirthCountry] = useState(profile.birthCountry ?? '');
  const [birthCity, setBirthCity] = useState(profile.birthCity ?? '');
  const [homeCountry, setHomeCountry] = useState(profile.homeCountry);
  const [homeCity, setHomeCity] = useState(profile.homeCity ?? '');
  const [email, setEmail] = useState(profile.email);

  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [homeCountryError, setHomeCountryError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    firstName !== profile.firstName.toUpperCase() ||
    lastName !== profile.lastName.toUpperCase() ||
    Number(dobDay) !== profile.dateOfBirth.day ||
    Number(dobMonth) !== profile.dateOfBirth.month ||
    Number(dobYear) !== profile.dateOfBirth.year ||
    yearVisible !== profile.dateOfBirth.yearVisible ||
    getCallingCode(phoneCountryIso) !== profile.phoneCountryCode ||
    phoneLocalNumber !== profile.phoneLocalNumber ||
    (birthCountry || null) !== profile.birthCountry ||
    (birthCity.trim() || null) !== profile.birthCity ||
    homeCountry !== profile.homeCountry ||
    (homeCity.trim() || null) !== profile.homeCity ||
    email.trim() !== profile.email;

  async function handleSave(e: FormEvent) {
    e.preventDefault();

    const normalizedFirst = normalizeName(firstName);
    const normalizedLast = normalizeName(lastName);
    setFirstName(normalizedFirst);
    setLastName(normalizedLast);

    let hasError = false;

    if (
      !normalizedFirst ||
      normalizedFirst.length < 2 ||
      normalizedFirst.length > 100 ||
      !NAME_REGEX.test(normalizedFirst)
    ) {
      setFirstNameError(t('personalDetails.errors.firstNameRequired'));
      hasError = true;
    } else {
      setFirstNameError(null);
    }

    if (
      !normalizedLast ||
      normalizedLast.length < 2 ||
      normalizedLast.length > 100 ||
      !NAME_REGEX.test(normalizedLast)
    ) {
      setLastNameError(t('personalDetails.errors.lastNameRequired'));
      hasError = true;
    } else {
      setLastNameError(null);
    }

    const day = Number(dobDay);
    const month = Number(dobMonth);
    const year = Number(dobYear);
    const dobValid =
      Number.isInteger(day) &&
      Number.isInteger(month) &&
      Number.isInteger(year) &&
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12 &&
      year >= 1900 &&
      year <= CURRENT_YEAR - 15 &&
      isValidCalendarDay(day, month, year);

    if (!dobValid) {
      setDobError(t('personalDetails.errors.invalidDob'));
      hasError = true;
    } else {
      setDobError(null);
    }

    if (!isValidPhoneNumber(phoneLocalNumber, phoneCountryIso as CountryCode)) {
      setPhoneError(t('personalDetails.errors.invalidPhone'));
      hasError = true;
    } else {
      setPhoneError(null);
    }

    if (!homeCountry) {
      setHomeCountryError(t('personalDetails.errors.homeCountryRequired'));
      hasError = true;
    } else {
      setHomeCountryError(null);
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError(t('personalDetails.errors.emailRequired'));
      hasError = true;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmedEmail)) {
      setEmailError(t('personalDetails.errors.invalidEmail'));
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (hasError) return;

    setIsSaving(true);
    try {
      await apiClient.patch('/v1/users/me/profile', {
        firstName: normalizedFirst,
        lastName: normalizedLast,
        dateOfBirth: { day, month, year, yearVisible },
        phoneCountryCode: getCallingCode(phoneCountryIso),
        phoneLocalNumber,
        birthCountry: birthCountry || null,
        birthCity: birthCity.trim() || null,
        homeCountry,
        homeCity: homeCity.trim() || null,
        email: email.trim(),
      });
      toast.success(t('personalDetails.saveSuccess'));
      onRefresh();
    } catch {
      toast.error(t('personalDetails.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-6">
      <h2 className="text-xl font-semibold">{t('personalDetails.heading')}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{t('personalDetails.firstName')}</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="given-name"
            placeholder={t('personalDetails.firstNamePlaceholder')}
            aria-invalid={firstNameError !== null}
            disabled={isSaving}
            className="uppercase placeholder:normal-case"
          />
          <FieldMessage error={firstNameError} hint={t('personalDetails.firstNameHint')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName">{t('personalDetails.lastName')}</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="family-name"
            placeholder={t('personalDetails.lastNamePlaceholder')}
            aria-invalid={lastNameError !== null}
            disabled={isSaving}
            className="uppercase placeholder:normal-case"
          />
          <FieldMessage error={lastNameError} hint={t('personalDetails.lastNameHint')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label id="dob-label">{t('personalDetails.dateOfBirth')}</Label>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label htmlFor="dobDay" className="text-xs text-muted-foreground">
              {t('personalDetails.day')}
            </Label>
            <Input
              id="dobDay"
              type="number"
              min={1}
              max={31}
              value={dobDay}
              onChange={(e) => setDobDay(e.target.value)}
              aria-invalid={dobError !== null}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dobMonth" className="text-xs text-muted-foreground">
              {t('personalDetails.month')}
            </Label>
            <Input
              id="dobMonth"
              type="number"
              min={1}
              max={12}
              value={dobMonth}
              onChange={(e) => setDobMonth(e.target.value)}
              aria-invalid={dobError !== null}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dobYear" className="text-xs text-muted-foreground">
              {t('personalDetails.year')}
            </Label>
            <Input
              id="dobYear"
              type="number"
              min={1900}
              max={CURRENT_YEAR - 15}
              value={dobYear}
              onChange={(e) => setDobYear(e.target.value)}
              aria-invalid={dobError !== null}
              disabled={isSaving}
            />
          </div>
        </div>
        <FieldMessage error={dobError} />
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={yearVisible}
            onChange={(e) => setYearVisible(e.target.checked)}
            disabled={isSaving}
            className="rounded border-border"
          />
          {t('personalDetails.yearVisible')}
        </label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t('personalDetails.email')}</Label>
        <Input
          id="email"
          type="text"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('personalDetails.emailPlaceholder')}
          aria-invalid={emailError !== null}
          disabled={isSaving}
        />
        <FieldMessage error={emailError} hint={t('personalDetails.emailHint')} />
      </div>

      <div className="space-y-1.5">
        <Label id="phone-label">{t('personalDetails.phone')}</Label>
        <div className="flex gap-2">
          <div className="w-40 shrink-0">
            <Label htmlFor="phoneCountry" className="sr-only">
              {t('personalDetails.phoneCountry')}
            </Label>
            <CountryCombobox
              value={phoneCountryIso}
              onChange={setPhoneCountryIso}
              displayMode="phone"
              placeholder={t('personalDetails.phoneCountryPlaceholder')}
              searchPlaceholder={t('personalDetails.phoneCountrySearch')}
              noResultsText={t('personalDetails.phoneCountryNoResults')}
              aria-labelledby="phone-label"
              aria-invalid={phoneError !== null}
              data-testid="phone-country"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="phoneLocalNumber" className="sr-only">
              {t('personalDetails.phoneNumber')}
            </Label>
            <Input
              id="phoneLocalNumber"
              type="tel"
              value={phoneLocalNumber}
              onChange={(e) => setPhoneLocalNumber(e.target.value)}
              placeholder={t('personalDetails.phoneNumberPlaceholder')}
              aria-invalid={phoneError !== null}
              disabled={isSaving}
            />
          </div>
        </div>
        <FieldMessage error={phoneError} />
      </div>

      <div className="space-y-1.5">
        <Label id="birth-location-label">{t('personalDetails.birthLocationOptional')}</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="birthCountry" className="sr-only">
              {t('personalDetails.birthCountry')}
            </Label>
            <CountryCombobox
              value={birthCountry}
              onChange={(iso2) => {
                setBirthCountry(iso2);
                setBirthCity('');
              }}
              displayMode="name"
              placeholder={t('personalDetails.birthCountryPlaceholder')}
              searchPlaceholder={t('personalDetails.birthCountrySearch')}
              noResultsText={t('personalDetails.birthCountryNoResults')}
              aria-labelledby="birth-location-label"
              data-testid="birth-country"
            />
          </div>
          <div>
            <Label htmlFor="birthCity" className="sr-only">
              {t('personalDetails.birthCity')}
            </Label>
            <CityCombobox
              value={birthCity}
              onChange={setBirthCity}
              country={birthCountry}
              placeholder={t('personalDetails.birthCityPlaceholder')}
              data-testid="birth-city"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label id="home-location-label">{t('personalDetails.homeLocation')}</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="homeCountry" className="sr-only">
              {t('personalDetails.homeCountry')}
            </Label>
            <CountryCombobox
              value={homeCountry}
              onChange={(iso2) => {
                setHomeCountry(iso2);
                setHomeCity('');
              }}
              displayMode="name"
              placeholder={t('personalDetails.homeCountryPlaceholder')}
              searchPlaceholder={t('personalDetails.homeCountrySearch')}
              noResultsText={t('personalDetails.homeCountryNoResults')}
              aria-labelledby="home-location-label"
              aria-invalid={homeCountryError !== null}
              data-testid="home-country"
            />
          </div>
          <div>
            <Label htmlFor="homeCity" className="sr-only">
              {t('personalDetails.homeCity')}
            </Label>
            <CityCombobox
              value={homeCity}
              onChange={setHomeCity}
              country={homeCountry}
              placeholder={t('personalDetails.homeCityPlaceholder')}
              data-testid="home-city"
            />
          </div>
        </div>
        <FieldMessage error={homeCountryError} />
      </div>

      <SaveButton isSaving={isSaving} isDirty={isDirty} label={t('personalDetails.save')} />
    </form>
  );
}
