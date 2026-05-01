import { cn } from '@/lib/utils';

interface FieldMessageProps {
  error?: string | null;
  hint?: string;
  className?: string;
}

export function FieldMessage({ error, hint, className }: FieldMessageProps) {
  if (error) {
    return <p className={cn('text-sm text-destructive', className)}>{error}</p>;
  }
  if (hint) {
    return <p className={cn('text-sm text-muted-foreground', className)}>{hint}</p>;
  }
  return null;
}
