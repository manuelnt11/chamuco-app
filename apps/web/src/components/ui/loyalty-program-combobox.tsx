'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LOYALTY_PROGRAM_SUGGESTIONS, type LoyaltyProgramCategory } from '@chamuco/shared-types';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const MAX_SUGGESTIONS = 8;

interface LoyaltyProgramComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

function LoyaltyProgramCombobox({
  id,
  value,
  onChange,
  required,
  maxLength,
  disabled,
}: LoyaltyProgramComboboxProps) {
  const { t } = useTranslation('profile');
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const suggestions =
    query.trim().length > 0
      ? LOYALTY_PROGRAM_SUGGESTIONS.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase()),
        ).slice(0, MAX_SUGGESTIONS)
      : [];

  const showDropdown = open && suggestions.length > 0;

  function handleSelect(name: string) {
    setQuery(name);
    onChange(name);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        required={required}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete="off"
      />

      {showDropdown && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <ul className="max-h-60 overflow-auto py-1">
            {suggestions.map((program) => (
              <li key={program.name}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-muted',
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(program.name);
                  }}
                >
                  <span className="font-medium">{program.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t(
                      `loyaltyPrograms.categories.${program.category}` as `loyaltyPrograms.categories.${LoyaltyProgramCategory}`,
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export { LoyaltyProgramCombobox };
