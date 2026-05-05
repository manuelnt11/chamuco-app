'use client';

import { type SyntheticEvent, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trans, useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';
import type { TFunction } from 'i18next';
import { useTheme } from 'next-themes';
import { getCountryData, type TCountryCode } from 'countries-list';

import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { COOKIE_CHAMUCO_REGISTERED_SET } from '@/lib/auth-cookies';
import { apiClient } from '@/services/api-client';
import { Logo } from '@/components/header/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CountryCombobox, getCallingCode } from '@/components/ui/country-combobox';
import { CityCombobox } from '@/components/ui/city-combobox';
import { FieldMessage } from '@/components/ui/field-message';
import { NAME_REGEX, normalizeName } from '@/lib/name-utils';
// TODO: re-enable once ProfileCompletionBanner is fully designed
// import { PROFILE_INCOMPLETE_KEY } from '@/components/ProfileCompletionBanner';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;
const TOTAL_STEPS = 3;
const STEP_KEYS = ['step1', 'step2', 'step3'] as const;

function toUsernameSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);
}

// Mirrors the logic in apps/api/src/modules/users/dto/minimum-age.validator.ts.
// Intentionally duplicated — the frontend needs a client-side gate before the API call,
// and importing backend code across packages is not possible here.
function computeAge(day: number, month: number, year: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) age--;
  return age;
}

function deriveCurrency(countryCode: string): 'COP' | 'USD' {
  try {
    const primary = getCountryData(countryCode as TCountryCode).currency[0]?.toUpperCase();
    if (primary === 'COP' || primary === 'USD') return primary;
  } catch {
    // unknown country code — use default
  }
  return 'COP';
}

function resolveTheme(raw: string | undefined): string {
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw.toUpperCase();
  return 'SYSTEM';
}

function resolveLanguage(raw: string): string {
  const code = raw.slice(0, 2).toLowerCase();
  return (['en', 'es'].includes(code) ? code : 'es').toUpperCase();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

// ---------------------------------------------------------------------------
// Step validation helpers
// ---------------------------------------------------------------------------

function validateStep1(
  usernameStatus: UsernameStatus,
  displayName: string,
  t: TFunction,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (usernameStatus !== 'available')
    errors.username = t('onboarding.validation.usernameUnavailable');
  if (!displayName.trim()) errors.displayName = t('onboarding.validation.required');
  return errors;
}

function isValidCalendarDay(day: number, month: number, year: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function validateStep2(
  firstName: string,
  lastName: string,
  dobDay: string,
  dobMonth: string,
  dobYear: string,
  phoneCountry: string,
  phoneNumber: string,
  email: string,
  t: TFunction,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const fn = normalizeName(firstName);
  const ln = normalizeName(lastName);
  if (!fn || fn.length < 2) errors.firstName = t('onboarding.validation.required');
  else if (fn.length > 100 || !NAME_REGEX.test(fn))
    errors.firstName = t('onboarding.validation.invalidName');
  if (!ln || ln.length < 2) errors.lastName = t('onboarding.validation.required');
  else if (ln.length > 100 || !NAME_REGEX.test(ln))
    errors.lastName = t('onboarding.validation.invalidName');
  const d = parseInt(dobDay, 10);
  const m = parseInt(dobMonth, 10);
  const y = parseInt(dobYear, 10);
  if (!dobDay || !dobMonth || !dobYear || isNaN(d) || isNaN(m) || isNaN(y))
    errors.dob = t('onboarding.validation.required');
  else if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || !isValidCalendarDay(d, m, y))
    errors.dob = t('onboarding.validation.invalidDob');
  else if (computeAge(d, m, y) < 16) errors.dob = t('onboarding.validation.minAge');
  if (!isValidPhoneNumber(phoneNumber, phoneCountry as CountryCode))
    errors.phone = t('onboarding.validation.invalidPhone');
  const trimmedEmail = email.trim();
  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
    errors.email = t('onboarding.validation.invalidEmail');
  return errors;
}

function validateStep3(
  homeCountry: string,
  termsAccepted: boolean,
  t: TFunction,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!homeCountry) errors.homeCountry = t('onboarding.validation.required');
  if (!termsAccepted) errors.terms = t('onboarding.terms.required');
  return errors;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const { t, i18n } = useTranslation('auth');
  const { theme } = useTheme();
  const router = useRouter();
  const { currentUser, isLoading, signOut } = useAuth();
  const { refresh: refreshUser } = useUser();
  // Stable ref so the pre-flight effect doesn't re-run when language changes
  const tRef = useRef(t);

  // Global state
  const [step, setStep] = useState(1);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 — Account
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameUserEdited, setUsernameUserEdited] = useState(false);

  // Step 2 — Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [yearVisible, setYearVisible] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState('CO');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Step 3 — Location + terms
  const [homeCountry, setHomeCountry] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Step-level error keys
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  function clearError(field: string) {
    setStepErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // Pre-fill from OAuth provider
  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
      const slug = toUsernameSlug(currentUser.displayName);
      if (USERNAME_RE.test(slug)) {
        setUsername(slug);
        setUsernameStatus('checking');
      }
    }
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/sign-in');
    }
  }, [currentUser, isLoading, router]);

  // Keep tRef current so the pre-flight effect can read the latest translation
  // without listing t as a dependency (which would re-run the effect on language change).
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // Redirect already-registered users
  useEffect(() => {
    if (isLoading || !currentUser) return;
    let cancelled = false;
    apiClient
      .get('/v1/users/me')
      .then(() => {
        if (!cancelled) {
          document.cookie = COOKIE_CHAMUCO_REGISTERED_SET;
          router.replace('/');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (isAxiosError(err) && err.response?.status === 404) {
          setIsCheckingRegistration(false);
        } else {
          // Non-404 errors (network failure, 5xx) are transient — show the form
          // rather than bouncing the user back to sign-in. If they are already
          // registered the submit will return 409, which is recoverable.
          toast.error(tRef.current('error.failed'));
          setIsCheckingRegistration(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser, isLoading, router]);

  // Debounced username availability check
  useEffect(() => {
    if (usernameStatus !== 'checking') return;
    const timer = setTimeout(() => {
      apiClient
        .get<{ available: boolean }>(`/v1/users/username-available?username=${username}`)
        .then(({ data }) => setUsernameStatus(data.available ? 'available' : 'taken'))
        .catch(() => setUsernameStatus('idle'));
    }, 300);
    return () => clearTimeout(timer);
  }, [username, usernameStatus]);

  function applyUsername(value: string) {
    const normalized = value.toLowerCase();
    setUsername(normalized);
    setUsernameStatus(
      !normalized.length ? 'idle' : USERNAME_RE.test(normalized) ? 'checking' : 'invalid',
    );
  }

  function handleUsernameChange(value: string) {
    setUsernameUserEdited(true);
    applyUsername(value);
    clearError('username');
  }

  function handleDisplayNameChange(value: string) {
    setDisplayName(value);
    clearError('displayName');
    if (!usernameUserEdited) {
      applyUsername(toUsernameSlug(value));
    }
  }

  function handleNext() {
    if (step === 2) {
      setFirstName((v) => normalizeName(v));
      setLastName((v) => normalizeName(v));
    }
    let errors: Record<string, string> = {};
    if (step === 1) {
      errors = validateStep1(usernameStatus, displayName, t);
    } else if (step === 2) {
      errors = validateStep2(
        firstName,
        lastName,
        dobDay,
        dobMonth,
        dobYear,
        phoneCountry,
        phoneNumber,
        email,
        t,
      );
    }
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      return;
    }
    setStepErrors({});
    setStep((s) => s + 1);
  }

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    const errors = validateStep3(homeCountry, termsAccepted, t);
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/v1/auth/register', {
        username,
        displayName: displayName.trim(),
        firstName: normalizeName(firstName),
        lastName: normalizeName(lastName),
        dateOfBirth: {
          day: parseInt(dobDay, 10),
          month: parseInt(dobMonth, 10),
          year: parseInt(dobYear, 10),
          yearVisible,
        },
        homeCountry,
        homeCity: homeCity.trim() || undefined,
        phoneCountryCode: getCallingCode(phoneCountry),
        phoneLocalNumber: phoneNumber,
        email: email.trim() || null,
      });
      document.cookie = COOKIE_CHAMUCO_REGISTERED_SET;
      void apiClient
        .patch('/v1/users/me/preferences', {
          theme: resolveTheme(theme),
          language: resolveLanguage(i18n.language),
          currency: deriveCurrency(homeCountry),
        })
        .catch(() => {});
      // localStorage.setItem(PROFILE_INCOMPLETE_KEY, 'true'); // TODO: re-enable with banner
      void refreshUser();
      router.replace('/');
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setStep(1);
        setStepErrors({});
        setUsernameStatus('taken');
        toast.error(t('onboarding.error.usernameTaken'));
      } else {
        toast.error(t('onboarding.error.failed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || isCheckingRegistration) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-12">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <Logo />

      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Progress indicator */}
        <p className="text-center text-sm text-muted-foreground">
          {t('onboarding.step')} {step} {t('onboarding.of')} {TOTAL_STEPS}
        </p>

        {/* Step header */}
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {t(`onboarding.${STEP_KEYS[step - 1]}.title`)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(`onboarding.${STEP_KEYS[step - 1]}.subtitle`)}
          </p>
        </div>

        {/* Step content */}
        {step === 1 && (
          <Step1
            username={username}
            displayName={displayName}
            usernameStatus={usernameStatus}
            stepErrors={stepErrors}
            onUsernameChange={handleUsernameChange}
            onDisplayNameChange={handleDisplayNameChange}
            t={t}
          />
        )}

        {step === 2 && (
          <Step2
            firstName={firstName}
            lastName={lastName}
            dobDay={dobDay}
            dobMonth={dobMonth}
            dobYear={dobYear}
            yearVisible={yearVisible}
            phoneCountry={phoneCountry}
            phoneNumber={phoneNumber}
            email={email}
            stepErrors={stepErrors}
            onFirstNameChange={(v) => {
              setFirstName(v.toUpperCase());
              clearError('firstName');
            }}
            onLastNameChange={(v) => {
              setLastName(v.toUpperCase());
              clearError('lastName');
            }}
            onDobDayChange={(v) => {
              setDobDay(v);
              clearError('dob');
            }}
            onDobMonthChange={(v) => {
              setDobMonth(v);
              clearError('dob');
            }}
            onDobYearChange={(v) => {
              setDobYear(v);
              clearError('dob');
            }}
            onYearVisibleChange={setYearVisible}
            onPhoneCountryChange={(v) => {
              setPhoneCountry(v);
              clearError('phone');
            }}
            onPhoneNumberChange={(v) => {
              setPhoneNumber(v);
              clearError('phone');
            }}
            onEmailChange={(v) => {
              setEmail(v);
              clearError('email');
            }}
            t={t}
          />
        )}

        {step === 3 && (
          <Step3
            homeCountry={homeCountry}
            homeCity={homeCity}
            termsAccepted={termsAccepted}
            stepErrors={stepErrors}
            onHomeCountryChange={(v) => {
              setHomeCountry(v);
              clearError('homeCountry');
            }}
            onHomeCityChange={(v) => setHomeCity(v.toUpperCase())}
            onTermsChange={(v) => {
              setTermsAccepted(v);
              clearError('terms');
            }}
            t={t}
          />
        )}

        {/* Navigation */}
        <div className="flex flex-col gap-2">
          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              size="lg"
              onClick={handleNext}
              className="h-11"
              data-testid="next-btn"
            >
              {t('common:actions.next')}
            </Button>
          ) : (
            <form onSubmit={handleSubmit}>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="h-11 w-full"
                data-testid="submit-btn"
              >
                {isSubmitting ? <Spinner size="sm" /> : t('onboarding.submit')}
              </Button>
            </form>
          )}

          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => {
                setStep((s) => s - 1);
                setStepErrors({});
              }}
              disabled={isSubmitting}
              className="h-11 text-muted-foreground hover:text-foreground"
              data-testid="back-btn"
            >
              {t('common:actions.back')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => void signOut()}
              className="h-11 text-muted-foreground hover:text-foreground"
              data-testid="cancel-btn"
            >
              {t('common:actions.cancel')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Account
// ---------------------------------------------------------------------------

interface Step1Props {
  username: string;
  displayName: string;
  usernameStatus: UsernameStatus;
  stepErrors: Record<string, string>;
  onUsernameChange: (v: string) => void;
  onDisplayNameChange: (v: string) => void;
  t: TFunction;
}

function Step1({
  username,
  displayName,
  usernameStatus,
  stepErrors,
  onUsernameChange,
  onDisplayNameChange,
  t,
}: Step1Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">{t('onboarding.displayName.label')}</Label>
        <Input
          id="displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder={t('onboarding.displayName.placeholder')}
          aria-invalid={!!stepErrors.displayName}
          data-testid="displayname-input"
        />
        <FieldMessage error={stepErrors.displayName} className="text-xs" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">{t('onboarding.username.label')}</Label>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 select-none text-sm text-muted-foreground">
            @
          </span>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder={t('onboarding.username.placeholder')}
            aria-invalid={usernameStatus === 'taken' || usernameStatus === 'invalid'}
            className="pl-7"
            data-testid="username-input"
          />
        </div>
        <UsernameStatusMessage status={usernameStatus} t={t} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Personal info
// ---------------------------------------------------------------------------

interface Step2Props {
  firstName: string;
  lastName: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  yearVisible: boolean;
  phoneCountry: string;
  phoneNumber: string;
  email: string;
  stepErrors: Record<string, string>;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onDobDayChange: (v: string) => void;
  onDobMonthChange: (v: string) => void;
  onDobYearChange: (v: string) => void;
  onYearVisibleChange: (v: boolean) => void;
  onPhoneCountryChange: (v: string) => void;
  onPhoneNumberChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  t: TFunction;
}

function Step2({
  firstName,
  lastName,
  dobDay,
  dobMonth,
  dobYear,
  yearVisible,
  phoneCountry,
  phoneNumber,
  email,
  stepErrors,
  onFirstNameChange,
  onLastNameChange,
  onDobDayChange,
  onDobMonthChange,
  onDobYearChange,
  onYearVisibleChange,
  onPhoneCountryChange,
  onPhoneNumberChange,
  onEmailChange,
  t,
}: Step2Props) {
  const dobId = useId();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="firstName">{t('onboarding.firstName.label')}</Label>
        <Input
          id="firstName"
          type="text"
          autoComplete="given-name"
          autoCapitalize="characters"
          placeholder={t('onboarding.firstName.placeholder')}
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          aria-invalid={!!stepErrors.firstName}
          data-testid="firstname-input"
          className="uppercase placeholder:normal-case"
        />
        <FieldMessage
          error={stepErrors.firstName}
          hint={t('onboarding.firstName.hint')}
          className="text-xs"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lastName">{t('onboarding.lastName.label')}</Label>
        <Input
          id="lastName"
          type="text"
          autoComplete="family-name"
          autoCapitalize="characters"
          placeholder={t('onboarding.lastName.placeholder')}
          value={lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          aria-invalid={!!stepErrors.lastName}
          data-testid="lastname-input"
          className="uppercase placeholder:normal-case"
        />
        <FieldMessage
          error={stepErrors.lastName}
          hint={t('onboarding.lastName.hint')}
          className="text-xs"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${dobId}-day`}>{t('onboarding.dateOfBirth.label')}</Label>
        <div className="grid grid-cols-3 gap-2">
          <Input
            id={`${dobId}-day`}
            type="number"
            min={1}
            max={31}
            placeholder={t('onboarding.dateOfBirth.day')}
            value={dobDay}
            onChange={(e) => onDobDayChange(e.target.value)}
            aria-invalid={!!stepErrors.dob}
            data-testid="dob-day-input"
          />
          <Input
            id={`${dobId}-month`}
            type="number"
            min={1}
            max={12}
            placeholder={t('onboarding.dateOfBirth.month')}
            value={dobMonth}
            onChange={(e) => onDobMonthChange(e.target.value)}
            aria-invalid={!!stepErrors.dob}
            data-testid="dob-month-input"
          />
          <Input
            id={`${dobId}-year`}
            type="number"
            min={1900}
            placeholder={t('onboarding.dateOfBirth.year')}
            value={dobYear}
            onChange={(e) => onDobYearChange(e.target.value)}
            aria-invalid={!!stepErrors.dob}
            data-testid="dob-year-input"
          />
        </div>
        <FieldMessage error={stepErrors.dob} className="text-xs" />
      </div>

      <label htmlFor="year-visible-checkbox" className="flex cursor-pointer items-center gap-2">
        <input
          id="year-visible-checkbox"
          type="checkbox"
          checked={yearVisible}
          onChange={(e) => onYearVisibleChange(e.target.checked)}
          className="h-4 w-4 shrink-0 accent-primary"
          data-testid="year-visible-checkbox"
        />
        <span className="text-sm text-muted-foreground">
          {t('onboarding.dateOfBirth.yearVisibleLabel')}
        </span>
      </label>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t('onboarding.email.label')}</Label>
        <Input
          id="email"
          type="text"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder={t('onboarding.email.placeholder')}
          aria-invalid={!!stepErrors.email}
          data-testid="email-input"
        />
        <FieldMessage
          error={stepErrors.email}
          hint={t('onboarding.email.hint')}
          className="text-xs"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label id="phone-country-label">{t('onboarding.phone.label')}</Label>
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <CountryCombobox
            value={phoneCountry}
            onChange={onPhoneCountryChange}
            displayMode="phone"
            placeholder={t('onboarding.phone.countryPlaceholder')}
            searchPlaceholder={t('onboarding.phone.search')}
            noResultsText={t('onboarding.phone.noResults')}
            aria-invalid={!!stepErrors.phone}
            aria-labelledby="phone-country-label"
            data-testid="phone-code-input"
          />
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder={t('onboarding.phone.number')}
            aria-invalid={!!stepErrors.phone}
            data-testid="phone-number-input"
          />
        </div>
        <FieldMessage error={stepErrors.phone} className="text-xs" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Location + terms
// ---------------------------------------------------------------------------

interface Step3Props {
  homeCountry: string;
  homeCity: string;
  termsAccepted: boolean;
  stepErrors: Record<string, string>;
  onHomeCountryChange: (v: string) => void;
  onHomeCityChange: (v: string) => void;
  onTermsChange: (v: boolean) => void;
  t: TFunction;
}

function Step3({
  homeCountry,
  homeCity,
  termsAccepted,
  stepErrors,
  onHomeCountryChange,
  onHomeCityChange,
  onTermsChange,
  t,
}: Step3Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label id="home-country-label">{t('onboarding.homeCountry.label')}</Label>
        <CountryCombobox
          value={homeCountry}
          onChange={onHomeCountryChange}
          displayMode="name"
          placeholder={t('onboarding.homeCountry.placeholder')}
          searchPlaceholder={t('onboarding.homeCountry.search')}
          noResultsText={t('onboarding.homeCountry.noResults')}
          aria-invalid={!!stepErrors.homeCountry}
          aria-labelledby="home-country-label"
          data-testid="home-country-input"
          className="w-full"
        />
        <FieldMessage error={stepErrors.homeCountry} className="text-xs" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="homeCity">{t('onboarding.homeCity.label')}</Label>
        <CityCombobox
          value={homeCity}
          onChange={onHomeCityChange}
          country={homeCountry}
          placeholder={t('onboarding.homeCity.placeholder')}
          data-testid="home-city-input"
        />
      </div>

      <label htmlFor="terms-checkbox" className="flex cursor-pointer items-start gap-3">
        <input
          id="terms-checkbox"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => onTermsChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          data-testid="terms-checkbox"
        />
        <span className="text-sm leading-snug text-muted-foreground">
          <Trans
            i18nKey="onboarding.terms.accept"
            ns="auth"
            components={{
              privacyLink: (
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:text-primary"
                />
              ),
              termsLink: (
                <Link
                  href="/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:text-primary"
                />
              ),
            }}
          />
        </span>
      </label>
      <FieldMessage error={stepErrors.terms} className="text-xs" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Username status message
// ---------------------------------------------------------------------------

interface UsernameStatusMessageProps {
  status: UsernameStatus;
  t: TFunction;
}

function UsernameStatusMessage({ status, t }: UsernameStatusMessageProps) {
  if (status === 'idle') return null;
  if (status === 'invalid') {
    return (
      <p className="text-xs text-muted-foreground" role="status">
        {t('onboarding.username.hint')}
      </p>
    );
  }
  if (status === 'checking') {
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground" role="status">
        <Spinner size="sm" />
        {t('onboarding.username.checking')}
      </p>
    );
  }
  if (status === 'available') {
    return (
      <p className="text-xs text-green-600 dark:text-green-400" role="status">
        {t('onboarding.username.available')}
      </p>
    );
  }
  return (
    <p className="text-xs text-destructive" role="status" aria-live="polite">
      {t('onboarding.username.taken')}
    </p>
  );
}
