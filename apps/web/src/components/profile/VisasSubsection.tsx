'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getEmojiFlag, type TCountryCode } from 'countries-list';
import {
  DocumentStatus,
  VisaCoverageType,
  VisaEntries,
  VisaType,
  VisaZone,
} from '@chamuco/shared-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CountryCombobox } from '@/components/ui/country-combobox';
import { SaveButton } from '@/components/ui/save-button';
import { Spinner } from '@/components/ui/spinner';
import { FieldMessage } from '@/components/ui/field-message';
import { toast } from '@/components/ui/toast';
import { apiClient } from '@/services/api-client';
import { cn } from '@/lib/utils';

export interface VisaDto {
  id: string;
  nationalityId: string;
  coverageType: VisaCoverageType;
  countryCode: string | null;
  visaZone: VisaZone | null;
  visaType: VisaType;
  entries: VisaEntries;
  expiryDate: string;
  visaStatus: DocumentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FormState {
  coverageType: VisaCoverageType | '';
  countryCode: string;
  visaZone: VisaZone | '';
  visaType: VisaType | '';
  entries: VisaEntries | '';
  expiryDate: string;
  notes: string;
}

interface FormErrors {
  coverage: string | null;
  country: string | null;
  zone: string | null;
  visaType: string | null;
  entries: string | null;
  expiryDate: string | null;
}

const EMPTY_ERRORS: FormErrors = {
  coverage: null,
  country: null,
  zone: null,
  visaType: null,
  entries: null,
  expiryDate: null,
};

function makeEmptyForm(): FormState {
  return {
    coverageType: '',
    countryCode: '',
    visaZone: '',
    visaType: '',
    entries: '',
    expiryDate: '',
    notes: '',
  };
}

function documentStatusBadgeClass(status: DocumentStatus): string {
  switch (status) {
    case DocumentStatus.ACTIVE:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case DocumentStatus.EXPIRING_SOON:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case DocumentStatus.EXPIRED:
    default:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
}

interface VisaFormProps {
  idPrefix: string;
  form: FormState;
  errors: FormErrors;
  isSaving: boolean;
  isDirty: boolean;
  isEdit?: boolean;
  onChange: (patch: Partial<FormState>) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  saveLabel: string;
}

function VisaForm({
  idPrefix,
  form,
  errors,
  isSaving,
  isDirty,
  isEdit = false,
  onChange,
  onSubmit,
  onCancel,
  saveLabel,
}: VisaFormProps) {
  const { t } = useTranslation('profile');

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border p-4">
      {/* Coverage type */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-coverageType`}>{t('nationalities.visas.coverageType')}</Label>
        {isEdit ? (
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
            {t(`nationalities.visas.coverageTypes.${form.coverageType as VisaCoverageType}`)}
          </p>
        ) : (
          <Select
            id={`${idPrefix}-coverageType`}
            value={form.coverageType}
            onChange={(e) =>
              onChange({
                coverageType: e.target.value as VisaCoverageType | '',
                countryCode: '',
                visaZone: '',
              })
            }
            disabled={isSaving}
            aria-invalid={errors.coverage !== null}
          >
            <option value="">{t('nationalities.visas.coverageType')}</option>
            <option value={VisaCoverageType.COUNTRY}>
              {t('nationalities.visas.coverageTypes.COUNTRY')}
            </option>
            <option value={VisaCoverageType.ZONE}>
              {t('nationalities.visas.coverageTypes.ZONE')}
            </option>
          </Select>
        )}
        <FieldMessage error={errors.coverage} />
      </div>

      {/* Country (COUNTRY coverage) */}
      {(form.coverageType === VisaCoverageType.COUNTRY || isEdit) &&
        form.coverageType === VisaCoverageType.COUNTRY && (
          <div className="space-y-1.5">
            <Label id={`${idPrefix}-country-label`}>{t('nationalities.visas.country')}</Label>
            {isEdit ? (
              <p className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                {form.countryCode && (
                  <span aria-hidden="true">{getEmojiFlag(form.countryCode as TCountryCode)}</span>
                )}
                {form.countryCode}
              </p>
            ) : (
              <CountryCombobox
                value={form.countryCode}
                onChange={(iso2) => onChange({ countryCode: iso2 })}
                displayMode="name"
                placeholder={t('nationalities.visas.countryPlaceholder')}
                searchPlaceholder={t('nationalities.visas.countrySearch')}
                noResultsText={t('nationalities.visas.countryNoResults')}
                aria-labelledby={`${idPrefix}-country-label`}
              />
            )}
            <FieldMessage error={errors.country} />
          </div>
        )}

      {/* Zone (ZONE coverage) */}
      {form.coverageType === VisaCoverageType.ZONE && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-visaZone`}>{t('nationalities.visas.zone')}</Label>
          {isEdit ? (
            <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
              {t(`nationalities.visas.zones.${form.visaZone as VisaZone}`)}
            </p>
          ) : (
            <Select
              id={`${idPrefix}-visaZone`}
              value={form.visaZone}
              onChange={(e) => onChange({ visaZone: e.target.value as VisaZone | '' })}
              disabled={isSaving}
              aria-invalid={errors.zone !== null}
            >
              <option value="">{t('nationalities.visas.zone')}</option>
              {Object.values(VisaZone).map((zone) => (
                <option key={zone} value={zone}>
                  {t(`nationalities.visas.zones.${zone}`)}
                </option>
              ))}
            </Select>
          )}
          <FieldMessage error={errors.zone} />
        </div>
      )}

      {/* Visa type */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-visaType`}>{t('nationalities.visas.visaType')}</Label>
        <Select
          id={`${idPrefix}-visaType`}
          value={form.visaType}
          onChange={(e) => onChange({ visaType: e.target.value as VisaType | '' })}
          disabled={isSaving}
          aria-invalid={errors.visaType !== null}
        >
          <option value="">{t('nationalities.visas.visaType')}</option>
          {Object.values(VisaType).map((type) => (
            <option key={type} value={type}>
              {t(`nationalities.visas.visaTypes.${type}`)}
            </option>
          ))}
        </Select>
        <FieldMessage error={errors.visaType} />
      </div>

      {/* Entries */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-entries`}>{t('nationalities.visas.entries')}</Label>
        <Select
          id={`${idPrefix}-entries`}
          value={form.entries}
          onChange={(e) => onChange({ entries: e.target.value as VisaEntries | '' })}
          disabled={isSaving}
          aria-invalid={errors.entries !== null}
        >
          <option value="">{t('nationalities.visas.entries')}</option>
          {Object.values(VisaEntries).map((entry) => (
            <option key={entry} value={entry}>
              {t(`nationalities.visas.entriesOptions.${entry}`)}
            </option>
          ))}
        </Select>
        <FieldMessage error={errors.entries} />
      </div>

      {/* Expiry date */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-expiryDate`}>{t('nationalities.visas.expiryDate')}</Label>
        <Input
          id={`${idPrefix}-expiryDate`}
          type="date"
          value={form.expiryDate}
          onChange={(e) => onChange({ expiryDate: e.target.value })}
          disabled={isSaving}
          aria-invalid={errors.expiryDate !== null}
        />
        <FieldMessage error={errors.expiryDate} />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-notes`}>{t('nationalities.visas.notes')}</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder={t('nationalities.visas.notesPlaceholder')}
          rows={2}
          disabled={isSaving}
        />
      </div>

      <div className="flex gap-2">
        <SaveButton size="sm" isSaving={isSaving} isDirty={isDirty} label={saveLabel} />
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          {t('nationalities.visas.cancel')}
        </Button>
      </div>
    </form>
  );
}

interface VisasSubsectionProps {
  nationalityId: string;
}

export function VisasSubsection({ nationalityId }: VisasSubsectionProps) {
  const { t } = useTranslation('profile');

  const [visas, setVisas] = useState<VisaDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<FormState>(makeEmptyForm());
  const [editForm, setEditForm] = useState<FormState>(makeEmptyForm());
  const [initialEditForm, setInitialEditForm] = useState<FormState>(makeEmptyForm());
  const [addErrors, setAddErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [editErrors, setEditErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void fetchVisas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nationalityId]);

  useEffect(() => {
    if (!confirmDeleteId) return;
    const reset = () => setConfirmDeleteId(null);
    document.addEventListener('mousedown', reset);
    return () => document.removeEventListener('mousedown', reset);
  }, [confirmDeleteId]);

  async function fetchVisas() {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/v1/users/me/nationalities/${nationalityId}/visas`);
      setVisas(res.data as VisaDto[]);
    } catch {
      // Silently fail — user can try again via page refresh
    } finally {
      setIsLoading(false);
    }
  }

  const isEditDirty =
    editingId !== null &&
    (editForm.visaType !== initialEditForm.visaType ||
      editForm.entries !== initialEditForm.entries ||
      editForm.expiryDate !== initialEditForm.expiryDate ||
      editForm.notes !== initialEditForm.notes);
  const isAddDirty =
    addForm.coverageType !== '' ||
    addForm.countryCode !== '' ||
    addForm.visaZone !== '' ||
    addForm.visaType !== '' ||
    addForm.entries !== '' ||
    addForm.expiryDate !== '';

  function validate(form: FormState, setErrors: (e: FormErrors) => void): boolean {
    const errors: FormErrors = { ...EMPTY_ERRORS };
    let hasError = false;

    if (!form.coverageType) {
      errors.coverage = t('nationalities.visas.errors.coverageRequired');
      hasError = true;
    } else if (form.coverageType === VisaCoverageType.COUNTRY && !form.countryCode) {
      errors.country = t('nationalities.visas.errors.countryRequired');
      hasError = true;
    } else if (form.coverageType === VisaCoverageType.ZONE && !form.visaZone) {
      errors.zone = t('nationalities.visas.errors.zoneRequired');
      hasError = true;
    }

    if (!form.visaType) {
      errors.visaType = t('nationalities.visas.errors.typeRequired');
      hasError = true;
    }
    if (!form.entries) {
      errors.entries = t('nationalities.visas.errors.entriesRequired');
      hasError = true;
    }
    if (!form.expiryDate) {
      errors.expiryDate = t('nationalities.visas.errors.expiryRequired');
      hasError = true;
    }

    setErrors(errors);
    return !hasError;
  }

  function validateEdit(form: FormState, setErrors: (e: FormErrors) => void): boolean {
    const errors: FormErrors = { ...EMPTY_ERRORS };
    let hasError = false;

    if (!form.visaType) {
      errors.visaType = t('nationalities.visas.errors.typeRequired');
      hasError = true;
    }
    if (!form.entries) {
      errors.entries = t('nationalities.visas.errors.entriesRequired');
      hasError = true;
    }
    if (!form.expiryDate) {
      errors.expiryDate = t('nationalities.visas.errors.expiryRequired');
      hasError = true;
    }

    setErrors(errors);
    return !hasError;
  }

  function dtoToForm(visa: VisaDto): FormState {
    return {
      coverageType: visa.coverageType,
      countryCode: visa.countryCode ?? '',
      visaZone: visa.visaZone ?? '',
      visaType: visa.visaType,
      entries: visa.entries,
      expiryDate: visa.expiryDate,
      notes: visa.notes ?? '',
    };
  }

  function formToPayload(form: FormState, isEditMode: boolean) {
    if (isEditMode) {
      return {
        visaType: form.visaType || undefined,
        entries: form.entries || undefined,
        expiryDate: form.expiryDate || undefined,
        notes: form.notes.trim() || null,
      };
    }
    return {
      coverageType: form.coverageType,
      countryCode: form.coverageType === VisaCoverageType.COUNTRY ? form.countryCode : undefined,
      visaZone: form.coverageType === VisaCoverageType.ZONE ? form.visaZone : undefined,
      visaType: form.visaType,
      entries: form.entries,
      expiryDate: form.expiryDate,
      notes: form.notes.trim() || null,
    };
  }

  function startEdit(visa: VisaDto) {
    setEditingId(visa.id);
    const form = dtoToForm(visa);
    setEditForm(form);
    setInitialEditForm(form);
    setEditErrors(EMPTY_ERRORS);
    setIsAdding(false);
    setConfirmDeleteId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(makeEmptyForm());
    setEditErrors(EMPTY_ERRORS);
  }

  function startAdd() {
    setIsAdding(true);
    setAddForm(makeEmptyForm());
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
      await apiClient.post(
        `/v1/users/me/nationalities/${nationalityId}/visas`,
        formToPayload(addForm, false),
      );
      toast.success(t('nationalities.visas.addSuccess'));
      setIsAdding(false);
      setAddForm(makeEmptyForm());
      setAddErrors(EMPTY_ERRORS);
      void fetchVisas();
    } catch {
      toast.error(t('nationalities.visas.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    if (!validateEdit(editForm, setEditErrors)) return;
    setIsSaving(true);
    try {
      await apiClient.patch(
        `/v1/users/me/nationalities/${nationalityId}/visas/${editingId}`,
        formToPayload(editForm, true),
      );
      toast.success(t('nationalities.visas.updateSuccess'));
      setEditingId(null);
      setEditForm(makeEmptyForm());
      setEditErrors(EMPTY_ERRORS);
      void fetchVisas();
    } catch {
      toast.error(t('nationalities.visas.saveError'));
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
      await apiClient.delete(`/v1/users/me/nationalities/${nationalityId}/visas/${id}`);
      toast.success(t('nationalities.visas.deleteSuccess'));
      setConfirmDeleteId(null);
      void fetchVisas();
    } catch {
      toast.error(t('nationalities.visas.deleteError'));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">{t('nationalities.visas.heading')}</h4>

      {visas.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">{t('nationalities.visas.empty')}</p>
      )}

      <ul className="space-y-2">
        {visas.map((visa) =>
          editingId === visa.id ? (
            <li key={visa.id}>
              <VisaForm
                idPrefix={`edit-visa-${visa.id}`}
                form={editForm}
                errors={editErrors}
                isSaving={isSaving}
                isDirty={isEditDirty}
                isEdit
                onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                onSubmit={handleUpdate}
                onCancel={cancelEdit}
                saveLabel={t('nationalities.visas.save')}
              />
            </li>
          ) : (
            <li
              key={visa.id}
              className="flex items-start justify-between rounded-md border border-border px-3 py-2"
            >
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  {visa.coverageType === VisaCoverageType.COUNTRY && visa.countryCode && (
                    <span aria-hidden="true">{getEmojiFlag(visa.countryCode as TCountryCode)}</span>
                  )}
                  <span className="font-medium">
                    {visa.coverageType === VisaCoverageType.ZONE && visa.visaZone
                      ? t(`nationalities.visas.zones.${visa.visaZone}`)
                      : visa.countryCode}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span>{t(`nationalities.visas.visaTypes.${visa.visaType}`)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{t(`nationalities.visas.entriesOptions.${visa.entries}`)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{visa.expiryDate}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      documentStatusBadgeClass(visa.visaStatus),
                    )}
                  >
                    {t(`nationalities.documentStatus.${visa.visaStatus}`)}
                  </span>
                </div>
                {visa.notes && <p className="mt-0.5 text-xs text-muted-foreground">{visa.notes}</p>}
              </div>
              <div className="ml-3 flex shrink-0 gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(visa)}
                  disabled={isSaving}
                >
                  {t('nationalities.visas.edit')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={confirmDeleteId === visa.id ? 'destructive' : 'outline'}
                  onMouseDown={(e) => {
                    if (confirmDeleteId === visa.id) e.stopPropagation();
                  }}
                  onClick={() => handleDelete(visa.id)}
                  disabled={isSaving}
                >
                  {confirmDeleteId === visa.id
                    ? t('nationalities.visas.deleteConfirm')
                    : t('nationalities.visas.delete')}
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>

      {isAdding && (
        <VisaForm
          idPrefix="add-visa"
          form={addForm}
          errors={addErrors}
          isSaving={isSaving}
          isDirty={isAddDirty}
          onChange={(patch) => setAddForm((f) => ({ ...f, ...patch }))}
          onSubmit={handleAdd}
          onCancel={cancelAdd}
          saveLabel={t('nationalities.visas.save')}
        />
      )}

      {!isAdding && (
        <Button type="button" size="sm" variant="outline" onClick={startAdd} disabled={isSaving}>
          {t('nationalities.visas.add')}
        </Button>
      )}
    </div>
  );
}
