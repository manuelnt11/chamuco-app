'use client';

import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { DeleteConfirmButton } from '@/components/ui/delete-confirm-button';
import { cn } from '@/lib/utils';

interface EditDeleteActionsProps {
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function EditDeleteActions({
  onEdit,
  onDelete,
  disabled,
  className,
}: EditDeleteActionsProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex shrink-0 flex-col gap-1.5 sm:flex-row', className)}>
      {onEdit && (
        <Button type="button" size="sm" variant="outline" onClick={onEdit} disabled={disabled}>
          {t('actions.edit')}
        </Button>
      )}
      {onDelete && <DeleteConfirmButton onDelete={onDelete} disabled={disabled} />}
    </div>
  );
}
