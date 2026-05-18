'use client';

import { useId, type ClipboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';
import { getCountryDataList } from 'countries-list';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountryCombobox } from '@/components/ui/country-combobox';
import { FieldMessage } from '@/components/ui/field-message';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

// Strips only whitespace — not dashes or parentheses. Use /\D/g for full digit extraction.
export function cleanPhoneNumber(value: string): string {
  return value.replace(/\s+/g, '');
}

// Sorted longest-first so +1868 (TT) matches before +1 (US/CA).
const PHONE_PREFIXES = getCountryDataList()
  .map((c) => ({ iso2: c.iso2, prefix: `+${c.phone[0]}` }))
  .sort((a, b) => b.prefix.length - a.prefix.length);

export function isPhoneValid(localNumber: string, countryIso: string): boolean {
  return isValidPhoneNumber(cleanPhoneNumber(localNumber), countryIso as CountryCode);
}

export function parsePastedPhoneNumber(
  pasted: string,
): { iso2: string; nationalNumber: string } | null {
  const text = pasted.trim();
  if (!text.startsWith('+')) return null;

  for (const { iso2, prefix } of PHONE_PREFIXES) {
    if (text.startsWith(prefix)) {
      const nationalNumber = text.slice(prefix.length).replace(/\D/g, '');
      if (nationalNumber.length > 0) return { iso2, nationalNumber };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PhoneInputProps {
  countryIso: string;
  localNumber: string;
  onCountryChange: (iso2: string) => void;
  onNumberChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  labelId?: string;
  numberLabel?: string;
  countryTestId?: string;
  inputTestId?: string;
  placeholder?: string;
}

export function PhoneInput({
  countryIso,
  localNumber,
  onCountryChange,
  onNumberChange,
  error,
  disabled,
  labelId,
  numberLabel,
  countryTestId,
  inputTestId,
  placeholder,
}: PhoneInputProps) {
  const { t } = useTranslation();
  const inputId = useId();

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const result = parsePastedPhoneNumber(e.clipboardData.getData('text'));
    if (result) {
      e.preventDefault();
      onCountryChange(result.iso2);
      onNumberChange(result.nationalNumber);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <CountryCombobox
          value={countryIso}
          onChange={onCountryChange}
          displayMode="phone"
          searchPlaceholder={t('phoneInput.searchCountry')}
          noResultsText={t('phoneInput.noCountries')}
          aria-labelledby={labelId}
          aria-invalid={error != null}
          data-testid={countryTestId}
        />
        <div>
          {numberLabel && (
            <Label htmlFor={inputId} className="sr-only">
              {numberLabel}
            </Label>
          )}
          <Input
            id={inputId}
            type="tel"
            value={localNumber}
            onChange={(e) => onNumberChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            autoComplete="tel-national"
            aria-invalid={error != null}
            aria-labelledby={!numberLabel ? labelId : undefined}
            disabled={disabled}
            data-testid={inputTestId}
          />
        </div>
      </div>
      <FieldMessage error={error} />
    </div>
  );
}
