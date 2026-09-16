'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { LOYALTY_PROGRAM_SUGGESTIONS, type LoyaltyProgramCategory } from '@chamuco/shared-types';

import { FreeTextCombobox } from '@/components/ui/free-text-combobox';

const MAX_SUGGESTIONS = 8;

interface LoyaltyProgramComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
  'aria-invalid'?: boolean;
}

function LoyaltyProgramCombobox({
  id,
  value,
  onChange,
  disabled,
  className,
  'data-testid': testId,
  'aria-invalid': ariaInvalid,
}: LoyaltyProgramComboboxProps) {
  const { t } = useTranslation('profile');
  const options = useMemo(
    () =>
      LOYALTY_PROGRAM_SUGGESTIONS.map((program) => ({
        value: program.name,
        label: program.name,
        subtitle: t(
          `loyaltyPrograms.categories.${program.category}` as `loyaltyPrograms.categories.${LoyaltyProgramCategory}`,
        ),
      })),
    [t],
  );

  return (
    <FreeTextCombobox
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      maxSuggestions={MAX_SUGGESTIONS}
      maxLength={100}
      placeholder={t('loyaltyPrograms.programName')}
      noResultsText={t('loyaltyPrograms.noResults')}
      disabled={disabled}
      className={className}
      data-testid={testId}
      aria-invalid={ariaInvalid}
    />
  );
}

export { LoyaltyProgramCombobox };
