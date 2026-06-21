'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { ExportField, ExportFormat } from '@chamuco/shared-types';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { exportTripParticipants } from '@/services/trips.service';

const ALL_FIELDS = Object.values(ExportField);
const REQUIRED_FIELDS = new Set<ExportField>([ExportField.FIRST_NAME, ExportField.LAST_NAME]);

interface ExportParticipantsPopoverProps {
  tripId: string;
}

export function ExportParticipantsPopover({ tripId }: ExportParticipantsPopoverProps) {
  const { t } = useTranslation('trips');

  const [format, setFormat] = useState<ExportFormat>(ExportFormat.CSV);
  const [selected, setSelected] = useState<Set<ExportField>>(new Set(ALL_FIELDS));
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (field: ExportField) => {
    if (REQUIRED_FIELDS.has(field)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(ALL_FIELDS));
  const selectRequired = () => setSelected(new Set(REQUIRED_FIELDS));

  const handleExport = async () => {
    setError(null);
    setIsExporting(true);
    try {
      await exportTripParticipants(
        tripId,
        format,
        ALL_FIELDS.filter((f) => selected.has(f)),
      );
    } catch {
      setError(t('participants.export.error'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            title={t('participants.export.button')}
            aria-label={t('participants.export.button')}
          >
            <DownloadSimpleIcon aria-hidden="true" />
          </Button>
        }
      />
      <PopoverContent className="w-80" side="bottom" align="end">
        <PopoverHeader>
          <PopoverTitle>{t('participants.export.title')}</PopoverTitle>
        </PopoverHeader>

        {/* Format */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('participants.export.format')}
          </label>
          <Select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
            <option value={ExportFormat.CSV}>{t('participants.export.formats.csv')}</option>
            <option value={ExportFormat.XLSX}>{t('participants.export.formats.xlsx')}</option>
            <option value={ExportFormat.ODS}>{t('participants.export.formats.ods')}</option>
          </Select>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('participants.export.fields')}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-primary hover:underline"
              >
                {t('participants.export.allFields')}
              </button>
              <span className="text-xs text-muted-foreground">/</span>
              <button
                type="button"
                onClick={selectRequired}
                className="text-xs text-primary hover:underline"
              >
                {t('participants.export.requiredOnly')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-52 overflow-y-auto pr-1">
            {ALL_FIELDS.map((field) => {
              const isRequired = REQUIRED_FIELDS.has(field);
              const isChecked = selected.has(field);
              return (
                <label key={field} className="group/field flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={isChecked}
                    disabled={isRequired}
                    onCheckedChange={() => toggle(field)}
                  />
                  <span className="text-sm leading-none select-none">
                    {t(`participants.export.fieldLabels.${field}`)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button
          className="w-full"
          onClick={() => void handleExport()}
          disabled={isExporting || selected.size === 0}
        >
          {isExporting ? t('participants.export.downloading') : t('participants.export.download')}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
