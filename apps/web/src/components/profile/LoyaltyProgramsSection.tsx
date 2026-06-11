'use client';

import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { EditDeleteActions } from '@/components/ui/edit-delete-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoyaltyProgramCombobox } from '@/components/ui/loyalty-program-combobox';
import { SaveButton } from '@/components/ui/save-button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import type { LoyaltyProgramDto } from '@/services/users.types';
import {
  createLoyaltyProgram,
  updateLoyaltyProgram,
  deleteLoyaltyProgram,
} from '@/services/users.service';

interface FormState {
  programName: string;
  memberId: string;
  notes: string;
}

const EMPTY_FORM: FormState = { programName: '', memberId: '', notes: '' };

interface LoyaltyProgramsSectionProps {
  programs: LoyaltyProgramDto[];
  onRefresh: () => void;
}

interface ProgramFormProps {
  idPrefix: string;
  form: FormState;
  isSaving: boolean;
  isDirty: boolean;
  onChangeProgramName: (v: string) => void;
  onChangeMemberId: (v: string) => void;
  onChangeNotes: (v: string) => void;
  onSubmit: (e: SubmitEvent) => void;
  onCancel: () => void;
  saveLabel: string;
}

function ProgramForm({
  idPrefix,
  form,
  isSaving,
  isDirty,
  onChangeProgramName,
  onChangeMemberId,
  onChangeNotes,
  onSubmit,
  onCancel,
  saveLabel,
}: ProgramFormProps) {
  const { t } = useTranslation('profile');
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-programName`}>{t('loyaltyPrograms.programName')}</Label>
        <LoyaltyProgramCombobox
          id={`${idPrefix}-programName`}
          value={form.programName}
          onChange={onChangeProgramName}
          required
          maxLength={100}
          disabled={isSaving}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-memberId`}>{t('loyaltyPrograms.memberId')}</Label>
        <Input
          id={`${idPrefix}-memberId`}
          value={form.memberId}
          onChange={(e) => onChangeMemberId(e.target.value)}
          required
          maxLength={100}
          disabled={isSaving}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-notes`}>{t('loyaltyPrograms.notes')}</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          value={form.notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder={t('loyaltyPrograms.notesPlaceholder')}
          rows={2}
          disabled={isSaving}
        />
      </div>
      <div className="flex gap-2">
        <SaveButton size="sm" isSaving={isSaving} isDirty={isDirty} label={saveLabel} />
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          {t('loyaltyPrograms.cancel')}
        </Button>
      </div>
    </form>
  );
}

export function LoyaltyProgramsSection({ programs, onRefresh }: LoyaltyProgramsSectionProps) {
  const { t } = useTranslation(['profile', 'common']);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [initialEditForm, setInitialEditForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const isEditDirty =
    editingId !== null &&
    (editForm.programName !== initialEditForm.programName ||
      editForm.memberId !== initialEditForm.memberId ||
      editForm.notes !== initialEditForm.notes);
  const isAddDirty = addForm.programName.trim() !== '' || addForm.memberId.trim() !== '';

  function startEdit(program: LoyaltyProgramDto) {
    setEditingId(program.id);
    const form: FormState = {
      programName: program.programName,
      memberId: program.memberId,
      notes: program.notes ?? '',
    };
    setEditForm(form);
    setInitialEditForm(form);
    setIsAdding(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }

  function startAdd() {
    setIsAdding(true);
    setAddForm(EMPTY_FORM);
    setEditingId(null);
  }

  function cancelAdd() {
    setIsAdding(false);
    setAddForm(EMPTY_FORM);
  }

  async function handleAdd(e: SubmitEvent) {
    e.preventDefault();
    const nameNorm = addForm.programName.trim().toLowerCase();
    const memberNorm = addForm.memberId.trim().toLowerCase();
    const isDuplicate = programs.some(
      (p) => p.programName.toLowerCase() === nameNorm && p.memberId.toLowerCase() === memberNorm,
    );
    if (isDuplicate) {
      toast.error(t('loyaltyPrograms.duplicateError'));
      return;
    }
    setIsSaving(true);
    try {
      await createLoyaltyProgram({
        programName: addForm.programName.trim(),
        memberId: addForm.memberId.trim(),
        notes: addForm.notes.trim() || null,
      });
      toast.success(t('loyaltyPrograms.addSuccess'));
      setIsAdding(false);
      setAddForm(EMPTY_FORM);
      onRefresh();
    } catch {
      toast.error(t('loyaltyPrograms.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(e: SubmitEvent) {
    e.preventDefault();
    if (!editingId) return;
    setIsSaving(true);
    try {
      await updateLoyaltyProgram(editingId, {
        programName: editForm.programName.trim(),
        memberId: editForm.memberId.trim(),
        notes: editForm.notes.trim() || null,
      });
      toast.success(t('loyaltyPrograms.updateSuccess'));
      setEditingId(null);
      setEditForm(EMPTY_FORM);
      onRefresh();
    } catch {
      toast.error(t('loyaltyPrograms.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setIsSaving(true);
    try {
      await deleteLoyaltyProgram(id);
      toast.success(t('loyaltyPrograms.deleteSuccess'));
      onRefresh();
    } catch {
      toast.error(t('loyaltyPrograms.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('loyaltyPrograms.heading')}</h2>
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

      {programs.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">{t('loyaltyPrograms.empty')}</p>
      )}

      <ul className="space-y-3">
        {programs.map((program) =>
          editingId === program.id ? (
            <li key={program.id}>
              <ProgramForm
                idPrefix={`edit-${program.id}`}
                form={editForm}
                isSaving={isSaving}
                isDirty={isEditDirty}
                onChangeProgramName={(v) => setEditForm((f) => ({ ...f, programName: v }))}
                onChangeMemberId={(v) => setEditForm((f) => ({ ...f, memberId: v }))}
                onChangeNotes={(v) => setEditForm((f) => ({ ...f, notes: v }))}
                onSubmit={handleUpdate}
                onCancel={cancelEdit}
                saveLabel={t('loyaltyPrograms.save')}
              />
            </li>
          ) : (
            <li
              key={program.id}
              className="flex items-start justify-between rounded-lg border border-border p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{program.programName}</p>
                <p className="text-sm text-muted-foreground">{program.memberId}</p>
                {program.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">{program.notes}</p>
                )}
              </div>
              <EditDeleteActions
                onEdit={() => startEdit(program)}
                onDelete={() => handleDelete(program.id)}
                disabled={isSaving}
                className="ml-4"
              />
            </li>
          ),
        )}
      </ul>

      {isAdding && (
        <ProgramForm
          idPrefix="add"
          form={addForm}
          isSaving={isSaving}
          isDirty={isAddDirty}
          onChangeProgramName={(v) => setAddForm((f) => ({ ...f, programName: v }))}
          onChangeMemberId={(v) => setAddForm((f) => ({ ...f, memberId: v }))}
          onChangeNotes={(v) => setAddForm((f) => ({ ...f, notes: v }))}
          onSubmit={handleAdd}
          onCancel={cancelAdd}
          saveLabel={t('loyaltyPrograms.save')}
        />
      )}
    </div>
  );
}
