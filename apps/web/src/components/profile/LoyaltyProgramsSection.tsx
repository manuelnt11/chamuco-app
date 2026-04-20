'use client';

import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { apiClient } from '@/services/api-client';

export interface LoyaltyProgramDto {
  id: string;
  programName: string;
  memberId: string;
  notes: string | null;
}

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
  onChangeProgramName: (v: string) => void;
  onChangeMemberId: (v: string) => void;
  onChangeNotes: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  saveLabel: string;
}

function ProgramForm({
  idPrefix,
  form,
  isSaving,
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
        <Input
          id={`${idPrefix}-programName`}
          value={form.programName}
          onChange={(e) => onChangeProgramName(e.target.value)}
          required
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
        <Button type="submit" size="sm" disabled={isSaving}>
          {saveLabel}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          {t('loyaltyPrograms.cancel')}
        </Button>
      </div>
    </form>
  );
}

export function LoyaltyProgramsSection({ programs, onRefresh }: LoyaltyProgramsSectionProps) {
  const { t } = useTranslation('profile');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function startEdit(program: LoyaltyProgramDto) {
    setEditingId(program.id);
    setEditForm({
      programName: program.programName,
      memberId: program.memberId,
      notes: program.notes ?? '',
    });
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

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.post('/v1/users/me/loyalty-programs', {
        id: globalThis.crypto.randomUUID(),
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

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setIsSaving(true);
    try {
      await apiClient.patch(`/v1/users/me/loyalty-programs/${editingId}`, {
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
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.delete(`/v1/users/me/loyalty-programs/${id}`);
      toast.success(t('loyaltyPrograms.deleteSuccess'));
      setConfirmDeleteId(null);
      onRefresh();
    } catch {
      toast.error(t('loyaltyPrograms.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-semibold">{t('loyaltyPrograms.heading')}</h2>

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
              <div className="ml-4 flex shrink-0 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(program)}
                  disabled={isSaving}
                >
                  {t('loyaltyPrograms.edit')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={confirmDeleteId === program.id ? 'destructive' : 'outline'}
                  onClick={() => handleDelete(program.id)}
                  disabled={isSaving}
                >
                  {confirmDeleteId === program.id
                    ? t('loyaltyPrograms.deleteConfirm')
                    : t('loyaltyPrograms.delete')}
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>

      {isAdding && (
        <ProgramForm
          idPrefix="add"
          form={addForm}
          isSaving={isSaving}
          onChangeProgramName={(v) => setAddForm((f) => ({ ...f, programName: v }))}
          onChangeMemberId={(v) => setAddForm((f) => ({ ...f, memberId: v }))}
          onChangeNotes={(v) => setAddForm((f) => ({ ...f, notes: v }))}
          onSubmit={handleAdd}
          onCancel={cancelAdd}
          saveLabel={t('loyaltyPrograms.save')}
        />
      )}

      {!isAdding && (
        <Button type="button" variant="outline" onClick={startAdd} disabled={isSaving}>
          {t('loyaltyPrograms.add')}
        </Button>
      )}
    </div>
  );
}
