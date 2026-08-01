'use client';

import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { EditDeleteActions } from '@/components/ui/edit-delete-actions';
import { cn } from '@/lib/utils';
import type { TripTask } from '@/services/trips.types';

interface TripTaskItemProps {
  task: TripTask;
  onToggle: (completed: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function TripTaskItem({ task, onToggle, onDelete }: TripTaskItemProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      {onDelete && (
        <EditDeleteActions onDelete={handleDelete} disabled={isToggling || isDeleting} />
      )}
    </li>
  );
}
