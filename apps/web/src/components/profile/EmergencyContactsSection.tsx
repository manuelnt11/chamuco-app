'use client';

import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getCountryDataList } from 'countries-list';
import { PlusIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { EditDeleteActions } from '@/components/ui/edit-delete-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCallingCode } from '@/components/ui/country-combobox';
import { PhoneInput, cleanPhoneNumber, isPhoneValid } from '@/components/ui/phone-input';
import { SaveButton } from '@/components/ui/save-button';
import { toast } from '@/components/ui/toast';
import { FieldMessage } from '@/components/ui/field-message';
import { apiClient } from '@/services/api-client';
import { NAME_REGEX, normalizeName } from '@/lib/name-utils';

const RELATIONSHIP_KEYS = [
  'mother',
  'father',
  'sister',
  'brother',
  'spouse',
  'partner',
  'daughter',
  'son',
  'grandmother',
  'grandfather',
  'aunt',
  'uncle',
  'cousin',
  'friend',
  'colleague',
  'other',
] as const;

export interface EmergencyContactDto {
  id: string;
  fullName: string;
  phoneCountryCode: string;
  phoneLocalNumber: string;
  relationship: string;
  isPrimary: boolean;
}

interface FormState {
  fullName: string;
  phoneCountryIso: string;
  phoneCountryCode: string;
  phoneLocalNumber: string;
  relationship: string;
  isPrimary: boolean;
}

interface FormErrors {
  fullName: string | null;
  phone: string | null;
  relationship: string | null;
}

const EMPTY_ERRORS: FormErrors = { fullName: null, phone: null, relationship: null };

function makeEmptyForm(isPrimary = false): FormState {
  return {
    fullName: '',
    phoneCountryIso: 'CO',
    phoneCountryCode: '+57',
    phoneLocalNumber: '',
    relationship: '',
    isPrimary,
  };
}

function getIsoFromCallingCode(callingCode: string): string {
  const digits = callingCode.replace('+', '');
  const match = getCountryDataList().find((c) => String(c.phone[0]) === digits);
  return match?.iso2 ?? 'CO';
}

interface ContactFormProps {
  idPrefix: string;
  form: FormState;
  errors: FormErrors;
  isSaving: boolean;
  isDirty: boolean;
  onChange: (patch: Partial<FormState>) => void;
  onSubmit: (e: SubmitEvent) => void;
  onCancel: () => void;
  saveLabel: string;
}

function ContactForm({
  idPrefix,
  form,
  errors,
  isSaving,
  isDirty,
  onChange,
  onSubmit,
  onCancel,
  saveLabel,
}: ContactFormProps) {
  const { t } = useTranslation('profile');

  function handleCountryChange(iso2: string) {
    onChange({ phoneCountryIso: iso2, phoneCountryCode: getCallingCode(iso2) });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-fullName`}>{t('emergencyContacts.fullName')}</Label>
        <Input
          id={`${idPrefix}-fullName`}
          value={form.fullName}
          onChange={(e) => onChange({ fullName: e.target.value.toUpperCase() })}
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={100}
          aria-invalid={errors.fullName !== null}
          disabled={isSaving}
          className="uppercase placeholder:normal-case"
        />
        <FieldMessage error={errors.fullName} />
      </div>

      <div className="space-y-1.5">
        <Label id={`${idPrefix}-phone-label`}>{t('emergencyContacts.phoneNumber')}</Label>
        <PhoneInput
          countryIso={form.phoneCountryIso}
          localNumber={form.phoneLocalNumber}
          onCountryChange={handleCountryChange}
          onNumberChange={(v) => onChange({ phoneLocalNumber: v })}
          error={errors.phone}
          disabled={isSaving}
          labelId={`${idPrefix}-phone-label`}
          numberLabel={t('emergencyContacts.phoneNumber')}
          countryTestId={`${idPrefix}-phone-country`}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-relationship`}>{t('emergencyContacts.relationship')}</Label>
        <Input
          id={`${idPrefix}-relationship`}
          list={`${idPrefix}-relationship-options`}
          value={form.relationship}
          onChange={(e) => onChange({ relationship: e.target.value.toUpperCase() })}
          autoCapitalize="characters"
          minLength={2}
          maxLength={50}
          aria-invalid={errors.relationship !== null}
          disabled={isSaving}
          className="uppercase placeholder:normal-case"
        />
        <datalist id={`${idPrefix}-relationship-options`}>
          {RELATIONSHIP_KEYS.map((key) => (
            <option key={key} value={t(`emergencyContacts.relationshipOptions.${key}`)} />
          ))}
        </datalist>
        <FieldMessage error={errors.relationship} />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isPrimary}
          onChange={(e) => onChange({ isPrimary: e.target.checked })}
          disabled={isSaving}
          className="rounded border-border"
        />
        {t('emergencyContacts.isPrimary')}
      </label>

      <div className="flex gap-2">
        <SaveButton size="sm" isSaving={isSaving} isDirty={isDirty} label={saveLabel} />
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          {t('emergencyContacts.cancel')}
        </Button>
      </div>
    </form>
  );
}

interface EmergencyContactsSectionProps {
  contacts: EmergencyContactDto[];
  onRefresh: () => void;
}

export function EmergencyContactsSection({ contacts, onRefresh }: EmergencyContactsSectionProps) {
  const { t } = useTranslation(['profile', 'common']);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(makeEmptyForm(contacts.length === 0));
  const [editForm, setEditForm] = useState<FormState>(makeEmptyForm());
  const [initialEditForm, setInitialEditForm] = useState<FormState>(makeEmptyForm());
  const [addErrors, setAddErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [editErrors, setEditErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [isSaving, setIsSaving] = useState(false);
  const isEditDirty =
    editingId !== null &&
    (editForm.fullName !== initialEditForm.fullName ||
      editForm.phoneCountryIso !== initialEditForm.phoneCountryIso ||
      editForm.phoneLocalNumber !== initialEditForm.phoneLocalNumber ||
      editForm.relationship !== initialEditForm.relationship ||
      editForm.isPrimary !== initialEditForm.isPrimary);
  const isAddDirty =
    addForm.fullName.trim() !== '' ||
    addForm.phoneLocalNumber.trim() !== '' ||
    addForm.relationship.trim() !== '';

  function validate(form: FormState, setErrors: (e: FormErrors) => void): boolean {
    const errors: FormErrors = { fullName: null, phone: null, relationship: null };
    let hasError = false;

    const fn = normalizeName(form.fullName);
    if (!fn || fn.length < 2) {
      errors.fullName = t('emergencyContacts.errors.fullNameRequired');
      hasError = true;
    } else if (fn.length > 100 || !NAME_REGEX.test(fn)) {
      errors.fullName = t('emergencyContacts.errors.fullNameInvalid');
      hasError = true;
    }

    if (!cleanPhoneNumber(form.phoneLocalNumber)) {
      errors.phone = t('emergencyContacts.errors.phoneRequired');
      hasError = true;
    } else if (!isPhoneValid(form.phoneLocalNumber, form.phoneCountryIso)) {
      errors.phone = t('emergencyContacts.errors.invalidPhone');
      hasError = true;
    }

    const rel = normalizeName(form.relationship);
    if (!rel || rel.length < 2) {
      errors.relationship = t('emergencyContacts.errors.relationshipRequired');
      hasError = true;
    } else if (rel.length > 50 || !NAME_REGEX.test(rel)) {
      errors.relationship = t('emergencyContacts.errors.relationshipInvalid');
      hasError = true;
    }

    setErrors(errors);
    return !hasError;
  }

  function startEdit(contact: EmergencyContactDto) {
    setEditingId(contact.id);
    const iso = getIsoFromCallingCode(contact.phoneCountryCode);
    const form: FormState = {
      fullName: contact.fullName.toUpperCase(),
      phoneCountryIso: iso,
      phoneCountryCode: contact.phoneCountryCode,
      phoneLocalNumber: contact.phoneLocalNumber,
      relationship: contact.relationship.toUpperCase(),
      isPrimary: contact.isPrimary,
    };
    setEditForm(form);
    setInitialEditForm(form);
    setEditErrors(EMPTY_ERRORS);
    setIsAdding(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(makeEmptyForm());
    setEditErrors(EMPTY_ERRORS);
  }

  function startAdd() {
    setIsAdding(true);
    setAddForm(makeEmptyForm(contacts.length === 0));
    setAddErrors(EMPTY_ERRORS);
    setEditingId(null);
  }

  function cancelAdd() {
    setIsAdding(false);
    setAddForm(makeEmptyForm());
    setAddErrors(EMPTY_ERRORS);
  }

  async function handleAdd(e: SubmitEvent) {
    e.preventDefault();
    const normalized = {
      ...addForm,
      fullName: normalizeName(addForm.fullName),
      relationship: normalizeName(addForm.relationship),
    };
    setAddForm(normalized);
    if (!validate(normalized, setAddErrors)) return;
    setIsSaving(true);
    try {
      await apiClient.post('/v1/users/me/emergency-contacts', {
        id: globalThis.crypto.randomUUID(),
        fullName: normalized.fullName,
        phoneCountryCode: normalized.phoneCountryCode,
        phoneLocalNumber: cleanPhoneNumber(normalized.phoneLocalNumber),
        relationship: normalized.relationship,
        isPrimary: normalized.isPrimary,
      });
      toast.success(t('emergencyContacts.addSuccess'));
      setIsAdding(false);
      setAddForm(makeEmptyForm());
      setAddErrors(EMPTY_ERRORS);
      onRefresh();
    } catch {
      toast.error(t('emergencyContacts.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(e: SubmitEvent) {
    e.preventDefault();
    if (!editingId) return;
    const normalized = {
      ...editForm,
      fullName: normalizeName(editForm.fullName),
      relationship: normalizeName(editForm.relationship),
    };
    setEditForm(normalized);
    if (!validate(normalized, setEditErrors)) return;
    setIsSaving(true);
    try {
      await apiClient.patch(`/v1/users/me/emergency-contacts/${editingId}`, {
        fullName: normalized.fullName,
        phoneCountryCode: normalized.phoneCountryCode,
        phoneLocalNumber: cleanPhoneNumber(normalized.phoneLocalNumber),
        relationship: normalized.relationship,
        isPrimary: normalized.isPrimary,
      });
      toast.success(t('emergencyContacts.updateSuccess'));
      setEditingId(null);
      setEditForm(makeEmptyForm());
      setEditErrors(EMPTY_ERRORS);
      onRefresh();
    } catch {
      toast.error(t('emergencyContacts.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setIsSaving(true);
    try {
      await apiClient.delete(`/v1/users/me/emergency-contacts/${id}`);
      toast.success(t('emergencyContacts.deleteSuccess'));
      onRefresh();
    } catch {
      toast.error(t('emergencyContacts.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('emergencyContacts.heading')}</h2>
        {!isAdding && (
          <Button
            type="button"
            size="icon"
            onClick={startAdd}
            disabled={isSaving}
            title={t('common:actions.create')}
            aria-label={t('common:actions.create')}
          >
            <PlusIcon aria-hidden="true" />
          </Button>
        )}
      </div>

      {contacts.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">{t('emergencyContacts.empty')}</p>
      )}

      <ul className="space-y-3">
        {contacts.map((contact) =>
          editingId === contact.id ? (
            <li key={contact.id}>
              <ContactForm
                idPrefix={`edit-${contact.id}`}
                form={editForm}
                errors={editErrors}
                isSaving={isSaving}
                isDirty={isEditDirty}
                onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                onSubmit={handleUpdate}
                onCancel={cancelEdit}
                saveLabel={t('emergencyContacts.save')}
              />
            </li>
          ) : (
            <li
              key={contact.id}
              className="flex items-start justify-between rounded-lg border border-border p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{contact.fullName}</p>
                  {contact.isPrimary && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {t('emergencyContacts.primaryBadge')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                <p className="text-sm text-muted-foreground">
                  {contact.phoneCountryCode} {contact.phoneLocalNumber}
                </p>
              </div>
              <EditDeleteActions
                onEdit={() => startEdit(contact)}
                onDelete={() => handleDelete(contact.id)}
                disabled={isSaving}
                className="ml-4"
              />
            </li>
          ),
        )}
      </ul>

      {isAdding && (
        <ContactForm
          idPrefix="add"
          form={addForm}
          errors={addErrors}
          isSaving={isSaving}
          isDirty={isAddDirty}
          onChange={(patch) => setAddForm((f) => ({ ...f, ...patch }))}
          onSubmit={handleAdd}
          onCancel={cancelAdd}
          saveLabel={t('emergencyContacts.save')}
        />
      )}
    </div>
  );
}
