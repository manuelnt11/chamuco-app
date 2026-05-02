'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getEmojiFlag, type TCountryCode } from 'countries-list';
import { DocumentStatus, EtaType, VisaEntries } from '@chamuco/shared-types';
import { DOCUMENT_ID_FORMAT_REGEX } from '@chamuco/shared-utils';

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

export interface EtaDto {
  id: string;
  userNationalityId: string;
  passportNumber: string;
  destinationCountry: string;
  authorizationNumber: string;
  etaType: EtaType;
  entries: VisaEntries;
  expiryDate: string;
  etaStatus: DocumentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FormState {
  destinationCountry: string;
  authorizationNumber: string;
  etaType: EtaType | '';
  entries: VisaEntries | '';
  expiryDate: string;
  notes: string;
}

interface FormErrors {
  destinationCountry: string | null;
  authorizationNumber: string | null;
  etaType: string | null;
  entries: string | null;
  expiryDate: string | null;
}

const EMPTY_ERRORS: FormErrors = {
  destinationCountry: null,
  authorizationNumber: null,
  etaType: null,
  entries: null,
  expiryDate: null,
};

function makeEmptyForm(): FormState {
  return {
    destinationCountry: '',
    authorizationNumber: '',
    etaType: '',
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

interface EtaFormProps {
  idPrefix: string;
  passportNumber: string;
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

function EtaForm({
  idPrefix,
  passportNumber,
  form,
  errors,
  isSaving,
  isDirty,
  isEdit = false,
  onChange,
  onSubmit,
  onCancel,
  saveLabel,
}: EtaFormProps) {
  const { t } = useTranslation('profile');

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border p-4">
      {/* Passport number — always read-only, pre-populated from nationality's active passport */}
      <div className="space-y-1.5">
        <Label>{t('nationalities.etas.passportNumber')}</Label>
        <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm font-mono">
          {passportNumber}
        </p>
      </div>

      {/* Destination country */}
      <div className="space-y-1.5">
        <Label id={`${idPrefix}-destination-label`}>
          {t('nationalities.etas.destinationCountry')}
        </Label>
        {isEdit ? (
          <p className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
            {form.destinationCountry && (
              <span aria-hidden="true">
                {getEmojiFlag(form.destinationCountry as TCountryCode)}
              </span>
            )}
            {form.destinationCountry}
          </p>
        ) : (
          <CountryCombobox
            value={form.destinationCountry}
            onChange={(iso2) => onChange({ destinationCountry: iso2 })}
            displayMode="name"
            placeholder={t('nationalities.etas.destinationPlaceholder')}
            searchPlaceholder={t('nationalities.etas.destinationSearch')}
            noResultsText={t('nationalities.etas.destinationNoResults')}
            aria-labelledby={`${idPrefix}-destination-label`}
          />
        )}
        <FieldMessage error={errors.destinationCountry} />
      </div>

      {/* Authorization number */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-authorizationNumber`}>
          {t('nationalities.etas.authorizationNumber')}
        </Label>
        <Input
          id={`${idPrefix}-authorizationNumber`}
          value={form.authorizationNumber}
          onChange={(e) => onChange({ authorizationNumber: e.target.value.toUpperCase() })}
          autoCapitalize="characters"
          placeholder={t('nationalities.etas.authorizationPlaceholder')}
          autoComplete="off"
          disabled={isSaving}
          aria-invalid={errors.authorizationNumber !== null}
        />
        <FieldMessage error={errors.authorizationNumber} />
      </div>

      {/* ETA type */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-etaType`}>{t('nationalities.etas.etaType')}</Label>
        <Select
          id={`${idPrefix}-etaType`}
          value={form.etaType}
          onChange={(e) => onChange({ etaType: e.target.value as EtaType | '' })}
          disabled={isSaving}
          aria-invalid={errors.etaType !== null}
        >
          <option value="">{t('nationalities.etas.etaType')}</option>
          {Object.values(EtaType).map((type) => (
            <option key={type} value={type}>
              {t(`nationalities.etas.etaTypes.${type}`)}
            </option>
          ))}
        </Select>
        <FieldMessage error={errors.etaType} />
      </div>

      {/* Entries */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-entries`}>{t('nationalities.etas.entries')}</Label>
        <Select
          id={`${idPrefix}-entries`}
          value={form.entries}
          onChange={(e) => onChange({ entries: e.target.value as VisaEntries | '' })}
          disabled={isSaving}
          aria-invalid={errors.entries !== null}
        >
          <option value="">{t('nationalities.etas.entries')}</option>
          {Object.values(VisaEntries).map((entry) => (
            <option key={entry} value={entry}>
              {t(`nationalities.etas.entriesOptions.${entry}`)}
            </option>
          ))}
        </Select>
        <FieldMessage error={errors.entries} />
      </div>

      {/* Expiry date */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-expiryDate`}>{t('nationalities.etas.expiryDate')}</Label>
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
        <Label htmlFor={`${idPrefix}-notes`}>{t('nationalities.etas.notes')}</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder={t('nationalities.etas.notesPlaceholder')}
          rows={2}
          disabled={isSaving}
        />
      </div>

      <div className="flex gap-2">
        <SaveButton size="sm" isSaving={isSaving} isDirty={isDirty} label={saveLabel} />
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          {t('nationalities.etas.cancel')}
        </Button>
      </div>
    </form>
  );
}

interface EtasSubsectionProps {
  nationalityId: string;
  passportNumber: string | null;
}

export function EtasSubsection({ nationalityId, passportNumber }: EtasSubsectionProps) {
  const { t } = useTranslation('profile');

  const [etas, setEtas] = useState<EtaDto[]>([]);
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
    void fetchEtas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nationalityId]);

  useEffect(() => {
    if (!confirmDeleteId) return;
    const reset = () => setConfirmDeleteId(null);
    document.addEventListener('mousedown', reset);
    return () => document.removeEventListener('mousedown', reset);
  }, [confirmDeleteId]);

  async function fetchEtas() {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/v1/users/me/nationalities/${nationalityId}/etas`);
      setEtas(res.data as EtaDto[]);
    } catch {
      // Silently fail — user can try again via page refresh
    } finally {
      setIsLoading(false);
    }
  }

  const isEditDirty =
    editingId !== null &&
    (editForm.authorizationNumber !== initialEditForm.authorizationNumber ||
      editForm.etaType !== initialEditForm.etaType ||
      editForm.entries !== initialEditForm.entries ||
      editForm.expiryDate !== initialEditForm.expiryDate ||
      editForm.notes !== initialEditForm.notes);
  const isAddDirty =
    addForm.destinationCountry !== '' ||
    addForm.authorizationNumber !== '' ||
    addForm.etaType !== '' ||
    addForm.entries !== '' ||
    addForm.expiryDate !== '';

  function validateAuthNumber(trimmed: string): string | null {
    if (!trimmed) return t('nationalities.etas.errors.authNumberRequired');
    if (!DOCUMENT_ID_FORMAT_REGEX.test(trimmed))
      return t('nationalities.etas.errors.authNumberFormat');
    return null;
  }

  function validate(form: FormState, setErrors: (e: FormErrors) => void): boolean {
    const errors: FormErrors = { ...EMPTY_ERRORS };
    let hasError = false;

    if (!form.destinationCountry) {
      errors.destinationCountry = t('nationalities.etas.errors.countryRequired');
      hasError = true;
    }
    const authError = validateAuthNumber(form.authorizationNumber.trim());
    if (authError) {
      errors.authorizationNumber = authError;
      hasError = true;
    }
    if (!form.etaType) {
      errors.etaType = t('nationalities.etas.errors.typeRequired');
      hasError = true;
    }
    if (!form.entries) {
      errors.entries = t('nationalities.etas.errors.entriesRequired');
      hasError = true;
    }
    if (!form.expiryDate) {
      errors.expiryDate = t('nationalities.etas.errors.expiryRequired');
      hasError = true;
    }

    setErrors(errors);
    return !hasError;
  }

  function validateEdit(form: FormState, setErrors: (e: FormErrors) => void): boolean {
    const errors: FormErrors = { ...EMPTY_ERRORS };
    let hasError = false;

    const authError = validateAuthNumber(form.authorizationNumber.trim());
    if (authError) {
      errors.authorizationNumber = authError;
      hasError = true;
    }
    if (!form.etaType) {
      errors.etaType = t('nationalities.etas.errors.typeRequired');
      hasError = true;
    }
    if (!form.entries) {
      errors.entries = t('nationalities.etas.errors.entriesRequired');
      hasError = true;
    }
    if (!form.expiryDate) {
      errors.expiryDate = t('nationalities.etas.errors.expiryRequired');
      hasError = true;
    }

    setErrors(errors);
    return !hasError;
  }

  function dtoToForm(eta: EtaDto): FormState {
    return {
      destinationCountry: eta.destinationCountry,
      authorizationNumber: eta.authorizationNumber,
      etaType: eta.etaType,
      entries: eta.entries,
      expiryDate: eta.expiryDate,
      notes: eta.notes ?? '',
    };
  }

  function startEdit(eta: EtaDto) {
    setEditingId(eta.id);
    const form = dtoToForm(eta);
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
      await apiClient.post(`/v1/users/me/nationalities/${nationalityId}/etas`, {
        destinationCountry: addForm.destinationCountry,
        authorizationNumber: addForm.authorizationNumber.trim(),
        etaType: addForm.etaType,
        entries: addForm.entries,
        expiryDate: addForm.expiryDate,
        notes: addForm.notes.trim() || null,
      });
      toast.success(t('nationalities.etas.addSuccess'));
      setIsAdding(false);
      setAddForm(makeEmptyForm());
      setAddErrors(EMPTY_ERRORS);
      void fetchEtas();
    } catch {
      toast.error(t('nationalities.etas.saveError'));
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
      await apiClient.patch(`/v1/users/me/nationalities/${nationalityId}/etas/${editingId}`, {
        authorizationNumber: editForm.authorizationNumber.trim(),
        etaType: editForm.etaType || undefined,
        entries: editForm.entries || undefined,
        expiryDate: editForm.expiryDate || undefined,
        notes: editForm.notes.trim() || null,
      });
      toast.success(t('nationalities.etas.updateSuccess'));
      setEditingId(null);
      setEditForm(makeEmptyForm());
      setEditErrors(EMPTY_ERRORS);
      void fetchEtas();
    } catch {
      toast.error(t('nationalities.etas.saveError'));
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
      await apiClient.delete(`/v1/users/me/nationalities/${nationalityId}/etas/${id}`);
      toast.success(t('nationalities.etas.deleteSuccess'));
      setConfirmDeleteId(null);
      void fetchEtas();
    } catch {
      toast.error(t('nationalities.etas.deleteError'));
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
      <h4 className="text-sm font-semibold">{t('nationalities.etas.heading')}</h4>

      {etas.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">{t('nationalities.etas.empty')}</p>
      )}

      <ul className="space-y-2">
        {etas.map((eta) =>
          editingId === eta.id ? (
            <li key={eta.id}>
              <EtaForm
                idPrefix={`edit-eta-${eta.id}`}
                passportNumber={eta.passportNumber}
                form={editForm}
                errors={editErrors}
                isSaving={isSaving}
                isDirty={isEditDirty}
                isEdit
                onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                onSubmit={handleUpdate}
                onCancel={cancelEdit}
                saveLabel={t('nationalities.etas.save')}
              />
            </li>
          ) : (
            <li
              key={eta.id}
              className="flex items-start justify-between rounded-md border border-border px-3 py-2"
            >
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span aria-hidden="true">
                    {getEmojiFlag(eta.destinationCountry as TCountryCode)}
                  </span>
                  <span className="font-mono text-xs">{eta.passportNumber}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{t(`nationalities.etas.etaTypes.${eta.etaType}`)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{t(`nationalities.etas.entriesOptions.${eta.entries}`)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{eta.expiryDate}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      documentStatusBadgeClass(eta.etaStatus),
                    )}
                  >
                    {t(`nationalities.documentStatus.${eta.etaStatus}`)}
                  </span>
                </div>
                {eta.notes && <p className="mt-0.5 text-xs text-muted-foreground">{eta.notes}</p>}
              </div>
              <div className="ml-3 flex shrink-0 gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(eta)}
                  disabled={isSaving}
                >
                  {t('nationalities.etas.edit')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={confirmDeleteId === eta.id ? 'destructive' : 'outline'}
                  onMouseDown={(e) => {
                    if (confirmDeleteId === eta.id) e.stopPropagation();
                  }}
                  onClick={() => handleDelete(eta.id)}
                  disabled={isSaving}
                >
                  {confirmDeleteId === eta.id
                    ? t('nationalities.etas.deleteConfirm')
                    : t('nationalities.etas.delete')}
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>

      {isAdding && (
        <EtaForm
          idPrefix="add-eta"
          passportNumber={passportNumber ?? ''}
          form={addForm}
          errors={addErrors}
          isSaving={isSaving}
          isDirty={isAddDirty}
          onChange={(patch) => setAddForm((f) => ({ ...f, ...patch }))}
          onSubmit={handleAdd}
          onCancel={cancelAdd}
          saveLabel={t('nationalities.etas.save')}
        />
      )}

      {!isAdding && (
        <div className="space-y-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={startAdd}
            disabled={isSaving || !passportNumber}
          >
            {t('nationalities.etas.add')}
          </Button>
          {!passportNumber && (
            <p className="text-xs text-muted-foreground">
              {t('nationalities.etas.noPassportHint')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
