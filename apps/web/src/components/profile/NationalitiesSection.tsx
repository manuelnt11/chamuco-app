'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getCountryDataList, getEmojiFlag, type TCountryCode } from 'countries-list';
import { CaretDownIcon, GlobeIcon, IdentificationCardIcon } from '@phosphor-icons/react';
import { PassportStatus } from '@chamuco/shared-types';
import { DOCUMENT_ID_FORMAT_REGEX } from '@chamuco/shared-utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountryCombobox } from '@/components/ui/country-combobox';
import { SaveButton } from '@/components/ui/save-button';
import { toast } from '@/components/ui/toast';
import { FieldMessage } from '@/components/ui/field-message';
import { apiClient } from '@/services/api-client';
import { cn } from '@/lib/utils';
import { VisasSubsection } from './VisasSubsection';
import { EtasSubsection } from './EtasSubsection';

export interface NationalityDto {
  id: string;
  countryCode: string;
  isPrimary: boolean;
  nationalIdNumber: string | null;
  passportNumber: string | null;
  passportIssueDate: string | null;
  passportExpiryDate: string | null;
  passportStatus: PassportStatus;
}

interface FormState {
  countryCode: string;
  nationalIdNumber: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  isPrimary: boolean;
}

interface FormErrors {
  nationalId: string | null;
  passport: string | null;
  passportNumber: string | null;
  passportDates: string | null;
}

const EMPTY_ERRORS: FormErrors = {
  nationalId: null,
  passport: null,
  passportNumber: null,
  passportDates: null,
};

function makeEmptyForm(isPrimary = false): FormState {
  return {
    countryCode: '',
    nationalIdNumber: '',
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    isPrimary,
  };
}

const countryList = getCountryDataList();

function getCountryName(iso2: string): string {
  return countryList.find((c) => c.iso2 === iso2)?.name ?? iso2;
}

function passportStatusBadgeClass(status: PassportStatus): string {
  switch (status) {
    case PassportStatus.ACTIVE:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case PassportStatus.EXPIRING_SOON:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case PassportStatus.EXPIRED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case PassportStatus.OMITTED:
    default:
      return 'bg-muted text-muted-foreground';
  }
}

interface NationalityFormProps {
  idPrefix: string;
  form: FormState;
  errors: FormErrors;
  isSaving: boolean;
  isDirty: boolean;
  readOnlyCountry?: boolean;
  onChange: (patch: Partial<FormState>) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  saveLabel: string;
}

function NationalityForm({
  idPrefix,
  form,
  errors,
  isSaving,
  isDirty,
  readOnlyCountry = false,
  onChange,
  onSubmit,
  onCancel,
  saveLabel,
}: NationalityFormProps) {
  const { t } = useTranslation('profile');

  const passportFilled = Boolean(
    form.passportNumber || form.passportIssueDate || form.passportExpiryDate,
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border p-4">
      <div className="space-y-1.5">
        <Label id={`${idPrefix}-country-label`}>{t('nationalities.countryCode')}</Label>
        {readOnlyCountry ? (
          <p className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
            <span aria-hidden="true">{getEmojiFlag(form.countryCode as TCountryCode)}</span>
            {getCountryName(form.countryCode)}
          </p>
        ) : (
          <>
            <CountryCombobox
              value={form.countryCode}
              onChange={(iso2) => onChange({ countryCode: iso2 })}
              displayMode="name"
              placeholder={t('nationalities.countryPlaceholder')}
              searchPlaceholder={t('nationalities.countrySearch')}
              noResultsText={t('nationalities.countryNoResults')}
              aria-labelledby={`${idPrefix}-country-label`}
              data-testid={`${idPrefix}-country`}
            />
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-nationalIdNumber`}>
          {t('nationalities.nationalIdNumber')}
        </Label>
        <Input
          id={`${idPrefix}-nationalIdNumber`}
          value={form.nationalIdNumber}
          onChange={(e) => onChange({ nationalIdNumber: e.target.value.toUpperCase() })}
          autoCapitalize="characters"
          placeholder={t('nationalities.nationalIdPlaceholder')}
          autoComplete="off"
          disabled={isSaving}
          aria-invalid={errors.nationalId !== null}
        />
        <FieldMessage error={errors.nationalId} />
      </div>

      <fieldset className="space-y-3 rounded-md border border-border p-3">
        <legend className="px-1 text-sm font-medium text-muted-foreground">
          {t('nationalities.passportSection')}
        </legend>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-passportNumber`}>{t('nationalities.passportNumber')}</Label>
          <Input
            id={`${idPrefix}-passportNumber`}
            value={form.passportNumber}
            onChange={(e) => onChange({ passportNumber: e.target.value.toUpperCase() })}
            autoCapitalize="characters"
            placeholder={t('nationalities.passportPlaceholder')}
            autoComplete="off"
            disabled={isSaving}
            aria-invalid={
              (errors.passport !== null || errors.passportNumber !== null) && passportFilled
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-passportIssueDate`}>
              {t('nationalities.passportIssueDate')}
            </Label>
            <Input
              id={`${idPrefix}-passportIssueDate`}
              type="date"
              value={form.passportIssueDate}
              onChange={(e) => {
                const issueDate = e.target.value;
                const patch: Partial<FormState> = { passportIssueDate: issueDate };
                if (issueDate.length === 10 && !form.passportExpiryDate) {
                  const [year, month, day] = issueDate.split('-');
                  patch.passportExpiryDate = `${parseInt(year!) + 10}-${month}-${day}`;
                }
                onChange(patch);
              }}
              disabled={isSaving}
              aria-invalid={
                (errors.passport !== null || errors.passportDates !== null) && passportFilled
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-passportExpiryDate`}>
              {t('nationalities.passportExpiryDate')}
            </Label>
            <Input
              id={`${idPrefix}-passportExpiryDate`}
              type="date"
              value={form.passportExpiryDate}
              onChange={(e) => onChange({ passportExpiryDate: e.target.value })}
              disabled={isSaving}
              aria-invalid={
                (errors.passport !== null || errors.passportDates !== null) && passportFilled
              }
            />
          </div>
        </div>

        <FieldMessage error={errors.passport ?? errors.passportNumber ?? errors.passportDates} />
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isPrimary}
          onChange={(e) => onChange({ isPrimary: e.target.checked })}
          disabled={isSaving}
          className="rounded border-border"
        />
        {t('nationalities.primaryBadge')}
      </label>

      <div className="flex gap-2">
        <SaveButton size="sm" isSaving={isSaving} isDirty={isDirty} label={saveLabel} />
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          {t('nationalities.cancel')}
        </Button>
      </div>
    </form>
  );
}

interface NationalitiesSectionProps {
  data: NationalityDto[];
  onRefresh: () => void;
}

export function NationalitiesSection({ data, onRefresh }: NationalitiesSectionProps) {
  const { t } = useTranslation('profile');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedNatId, setExpandedNatId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(makeEmptyForm(data.length === 0));
  const [editForm, setEditForm] = useState<FormState>(makeEmptyForm());
  const [initialEditForm, setInitialEditForm] = useState<FormState>(makeEmptyForm());
  const [addErrors, setAddErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [editErrors, setEditErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isEditDirty =
    editingId !== null &&
    (editForm.nationalIdNumber !== initialEditForm.nationalIdNumber ||
      editForm.passportNumber !== initialEditForm.passportNumber ||
      editForm.passportIssueDate !== initialEditForm.passportIssueDate ||
      editForm.passportExpiryDate !== initialEditForm.passportExpiryDate ||
      editForm.isPrimary !== initialEditForm.isPrimary);
  const isAddDirty = addForm.countryCode !== '';

  useEffect(() => {
    if (!confirmDeleteId) return;
    const reset = () => setConfirmDeleteId(null);
    document.addEventListener('mousedown', reset);
    return () => document.removeEventListener('mousedown', reset);
  }, [confirmDeleteId]);

  function validate(form: FormState, setErrors: (e: FormErrors) => void): boolean {
    const errors: FormErrors = {
      nationalId: null,
      passport: null,
      passportNumber: null,
      passportDates: null,
    };
    let hasError = false;

    const trimmedNationalId = form.nationalIdNumber.trim();
    if (trimmedNationalId !== '' && !DOCUMENT_ID_FORMAT_REGEX.test(trimmedNationalId)) {
      errors.nationalId = t('nationalities.errors.nationalIdFormat');
      hasError = true;
    }

    const hasPassportNumber = form.passportNumber.trim() !== '';
    const hasIssueDate = form.passportIssueDate !== '';
    const hasExpiryDate = form.passportExpiryDate !== '';
    const passportFieldCount = [hasPassportNumber, hasIssueDate, hasExpiryDate].filter(
      Boolean,
    ).length;

    if (passportFieldCount > 0 && passportFieldCount < 3) {
      errors.passport = t('nationalities.errors.passportIncomplete');
      hasError = true;
    } else if (passportFieldCount === 3) {
      if (!DOCUMENT_ID_FORMAT_REGEX.test(form.passportNumber.trim())) {
        errors.passportNumber = t('nationalities.errors.passportFormat');
        hasError = true;
      } else if (form.passportExpiryDate <= form.passportIssueDate) {
        errors.passportDates = t('nationalities.errors.expiryBeforeIssue');
        hasError = true;
      }
    }

    setErrors(errors);
    return !hasError;
  }

  function dtoToForm(nat: NationalityDto): FormState {
    return {
      countryCode: nat.countryCode,
      nationalIdNumber: nat.nationalIdNumber ?? '',
      passportNumber: nat.passportNumber ?? '',
      passportIssueDate: nat.passportIssueDate ?? '',
      passportExpiryDate: nat.passportExpiryDate ?? '',
      isPrimary: nat.isPrimary,
    };
  }

  function formToPayload(form: FormState) {
    const hasPassport = Boolean(
      form.passportNumber.trim() && form.passportIssueDate && form.passportExpiryDate,
    );
    return {
      nationalIdNumber: form.nationalIdNumber.trim() || null,
      passportNumber: hasPassport ? form.passportNumber.trim() : null,
      passportIssueDate: hasPassport ? form.passportIssueDate : null,
      passportExpiryDate: hasPassport ? form.passportExpiryDate : null,
      isPrimary: form.isPrimary,
    };
  }

  function startEdit(nat: NationalityDto) {
    setEditingId(nat.id);
    const form = dtoToForm(nat);
    setEditForm(form);
    setInitialEditForm(form);
    setEditErrors(EMPTY_ERRORS);
    setIsAdding(false);
    setConfirmDeleteId(null);
    setExpandedNatId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(makeEmptyForm());
    setEditErrors(EMPTY_ERRORS);
  }

  function startAdd() {
    setIsAdding(true);
    setAddForm(makeEmptyForm(data.length === 0));
    setAddErrors(EMPTY_ERRORS);
    setEditingId(null);
    setConfirmDeleteId(null);
  }

  function cancelAdd() {
    setIsAdding(false);
    setAddForm(makeEmptyForm());
    setAddErrors(EMPTY_ERRORS);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!validate(addForm, setAddErrors)) return;
    setIsSaving(true);
    try {
      await apiClient.post('/v1/users/me/nationalities', {
        countryCode: addForm.countryCode,
        ...formToPayload(addForm),
      });
      toast.success(t('nationalities.addSuccess'));
      setIsAdding(false);
      setAddForm(makeEmptyForm());
      setAddErrors(EMPTY_ERRORS);
      onRefresh();
    } catch {
      toast.error(t('nationalities.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    if (!validate(editForm, setEditErrors)) return;
    setIsSaving(true);
    try {
      await apiClient.patch(`/v1/users/me/nationalities/${editingId}`, formToPayload(editForm));
      toast.success(t('nationalities.updateSuccess'));
      setEditingId(null);
      setEditForm(makeEmptyForm());
      setEditErrors(EMPTY_ERRORS);
      onRefresh();
    } catch {
      toast.error(t('nationalities.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.delete(`/v1/users/me/nationalities/${id}`);
      toast.success(t('nationalities.deleteSuccess'));
      setConfirmDeleteId(null);
      onRefresh();
    } catch (err: unknown) {
      const status =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'status' in err.response
          ? (err.response as { status: number }).status
          : null;
      if (status === 400) {
        toast.error(t('nationalities.deletePrimaryError'));
      } else {
        toast.error(t('nationalities.deleteError'));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-xl font-semibold">{t('nationalities.heading')}</h2>

      {data.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">{t('nationalities.empty')}</p>
      )}

      <ul className="space-y-3">
        {data.map((nat) =>
          editingId === nat.id ? (
            <li key={nat.id}>
              <NationalityForm
                idPrefix={`edit-${nat.id}`}
                form={editForm}
                errors={editErrors}
                isSaving={isSaving}
                isDirty={isEditDirty}
                readOnlyCountry
                onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                onSubmit={handleUpdate}
                onCancel={cancelEdit}
                saveLabel={t('nationalities.save')}
              />
            </li>
          ) : (
            <li key={nat.id} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg leading-none" aria-hidden="true">
                      {getEmojiFlag(nat.countryCode as TCountryCode)}
                    </span>
                    <p className="font-medium">{getCountryName(nat.countryCode)}</p>
                    {nat.isPrimary && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {t('nationalities.primaryBadge')}
                      </span>
                    )}
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        passportStatusBadgeClass(nat.passportStatus),
                      )}
                    >
                      {t(`nationalities.passportStatus.${nat.passportStatus}`)}
                    </span>
                  </div>
                  {nat.nationalIdNumber && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <IdentificationCardIcon size={20} aria-hidden="true" />
                      {nat.nationalIdNumber}
                    </p>
                  )}
                  {nat.passportNumber && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <GlobeIcon size={20} aria-hidden="true" />
                      {nat.passportNumber}
                      {nat.passportExpiryDate && (
                        <span className="text-muted-foreground/60">· {nat.passportExpiryDate}</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(nat)}
                    disabled={isSaving}
                  >
                    {t('nationalities.edit')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={confirmDeleteId === nat.id ? 'destructive' : 'outline'}
                    onMouseDown={(e) => {
                      if (confirmDeleteId === nat.id) e.stopPropagation();
                    }}
                    onClick={() => handleDelete(nat.id)}
                    disabled={isSaving}
                  >
                    {confirmDeleteId === nat.id
                      ? t('nationalities.deleteConfirm')
                      : t('nationalities.delete')}
                  </Button>
                </div>
              </div>

              {nat.passportStatus !== PassportStatus.OMITTED && (
                <>
                  <button
                    type="button"
                    onClick={() => setExpandedNatId(expandedNatId === nat.id ? null : nat.id)}
                    className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <CaretDownIcon
                      size={14}
                      className={cn(
                        'transition-transform',
                        expandedNatId === nat.id && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                    {t('nationalities.documentsToggle')}
                  </button>

                  {expandedNatId === nat.id && (
                    <div className="space-y-6 border-t border-border pt-3">
                      <VisasSubsection nationalityId={nat.id} />
                      <EtasSubsection nationalityId={nat.id} passportNumber={nat.passportNumber} />
                    </div>
                  )}
                </>
              )}
            </li>
          ),
        )}
      </ul>

      {isAdding && (
        <NationalityForm
          idPrefix="add"
          form={addForm}
          errors={addErrors}
          isSaving={isSaving}
          isDirty={isAddDirty}
          onChange={(patch) => setAddForm((f) => ({ ...f, ...patch }))}
          onSubmit={handleAdd}
          onCancel={cancelAdd}
          saveLabel={t('nationalities.save')}
        />
      )}

      {!isAdding && (
        <Button type="button" variant="outline" onClick={startAdd} disabled={isSaving}>
          {t('nationalities.add')}
        </Button>
      )}
    </div>
  );
}
