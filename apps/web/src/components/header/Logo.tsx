import Link from 'next/link';
import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'lg';

interface LogoProps {
  size?: LogoSize;
}

const ICON_SIZE: Record<LogoSize, string> = {
  sm: 'h-10 w-10',
  lg: 'h-16 w-16',
};

const CHAMUCO_TEXT_SIZE: Record<LogoSize, string> = {
  sm: 'text-sm',
  lg: 'text-xl',
};

const TRAVEL_TEXT_SIZE: Record<LogoSize, string> = {
  sm: 'text-xs',
  lg: 'text-base',
};

export function Logo({ size = 'sm' }: LogoProps) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      aria-label="Chamuco Travel home"
    >
      <img src="/logo-icon.svg" alt="" className={cn(ICON_SIZE[size])} />
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            'font-extrabold text-horizonte-oceano dark:text-horizonte-cielo tracking-wider',
            CHAMUCO_TEXT_SIZE[size],
          )}
        >
          CHAMUCO
        </span>
        <span
          className={cn(
            'font-semibold text-horizonte-cielo tracking-widest',
            TRAVEL_TEXT_SIZE[size],
          )}
        >
          TRAVEL
        </span>
      </div>
    </Link>
  );
}
