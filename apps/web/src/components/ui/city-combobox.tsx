'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useCitySearch } from '@/hooks/useCitySearch';

interface CityComboboxProps {
  value: string;
  onChange: (city: string) => void;
  country: string;
  placeholder?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'data-testid'?: string;
}

function CityCombobox({
  value,
  onChange,
  country,
  placeholder,
  className,
  'aria-invalid': ariaInvalid,
  'data-testid': testId,
}: CityComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const { results, isLoading } = useCitySearch(country, query);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  function handleChange(raw: string) {
    const upper = raw.toUpperCase();
    setQuery(upper);
    onChange(upper);
    setOpen(upper.length >= 2);
  }

  function handleSelect(name: string) {
    const upper = name.toUpperCase();
    setQuery(upper);
    onChange(upper);
    setOpen(false);
  }

  const showDropdown = open && query.length >= 2 && (isLoading || results.length > 0);

  return (
    <div className="relative">
      <Input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (query.length >= 2 && results.length > 0) setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        data-testid={testId}
        autoComplete="off"
        className={cn('uppercase placeholder:normal-case', className)}
      />

      {showDropdown && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          {isLoading ? (
            <div className="flex items-center justify-center p-3">
              <Spinner size="sm" />
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {results.map((city) => (
                <li key={`${city.name}-${city.region}`}>
                  <button
                    type="button"
                    className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(city.name);
                    }}
                  >
                    <span className="font-medium uppercase">{city.name}</span>
                    {city.region && (
                      <span className="truncate text-xs text-muted-foreground">{city.region}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export { CityCombobox };
