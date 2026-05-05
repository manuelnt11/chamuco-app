'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LOYALTY_PROGRAM_SUGGESTIONS, type LoyaltyProgramCategory } from '@chamuco/shared-types';

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
  const blurTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

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
          setOpen(e.target.value.trim().length > 0);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          blurTimerRef.current = setTimeout(() => setOpen(false), 150);
        }}
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
                  className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
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
