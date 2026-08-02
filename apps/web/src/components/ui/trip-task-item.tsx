'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { EditDeleteActions } from '@/components/ui/edit-delete-actions';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { TripTask } from '@/services/trips.types';

interface TripTaskItemProps {
  task: TripTask;
  onToggle: (completed: boolean) => Promise<void>;
  onRename?: (title: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function TripTaskItem({ task, onToggle, onRename, onDelete }: TripTaskItemProps) {
  const { t } = useTranslation();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      await onToggle(checked);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = onDelete
    ? async () => {
        setIsDeleting(true);
        try {
          await onDelete();
        } finally {
          setIsDeleting(false);
        }
      }
    : undefined;

  const handleCancel = () => {
    setDraftTitle(task.title);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!onRename) return;
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === task.title) {
      handleCancel();
      return;
    }
    setIsSaving(true);
    try {
      await onRename(trimmed);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <li className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
        <Input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          maxLength={200}
          disabled={isSaving}
          autoFocus
        />
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {t('actions.cancel')}
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || !draftTitle.trim()}
          className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {t('actions.save')}
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => void handleToggle(!task.completed)}
        disabled={isToggling || isDeleting}
      />
      <span
        className={cn(
          'flex-1 text-sm wrap-break-word',
          task.completed && 'text-muted-foreground line-through',
        )}
      >
        {task.title}
      </span>
      {(onRename ?? onDelete) && (
        <EditDeleteActions
          onEdit={onRename ? () => setIsEditing(true) : undefined}
          onDelete={handleDelete}
          disabled={isToggling || isDeleting}
        />
      )}
    </li>
  );
}
