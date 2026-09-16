'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Select } from '@/components/ui/select';
import { TIMEZONES, formatTimezoneLabel } from '@/lib/timezones';

interface TimezoneComboboxProps {
  value: string;
  onChange: (tz: string) => void;
  placeholder?: string;
  clearable?: boolean;
  className?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  'aria-labelledby'?: string;
}

function TimezoneCombobox({
  value,
  onChange,
  placeholder = '—',
  clearable = true,
  className,
  disabled,
  'aria-invalid': ariaInvalid,
  'aria-labelledby': ariaLabelledBy,
}: TimezoneComboboxProps) {
  const { t } = useTranslation();
  const options = useMemo(
    () => TIMEZONES.map((tz) => ({ value: tz, label: formatTimezoneLabel(tz) })),
    [],
  );

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      clearable={clearable}
      searchable
      autoFocus={false}
      searchPlaceholder={t('timezoneCombobox.searchPlaceholder')}
      noResultsText={t('timezoneCombobox.noResults')}
      disabled={disabled}
      className={className}
      aria-invalid={ariaInvalid}
      aria-labelledby={ariaLabelledBy}
    />
  );
}

export { TimezoneCombobox };
