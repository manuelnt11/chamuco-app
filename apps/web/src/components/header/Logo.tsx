import Link from 'next/link';

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      aria-label="Chamuco Travel home"
    >
      <img src="/logo-icon.svg" alt="" className="h-10 w-10" />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-extrabold text-horizonte-oceano dark:text-horizonte-cielo tracking-wider">
          CHAMUCO
        </span>
        <span className="text-xs font-semibold text-horizonte-cielo tracking-widest">TRAVEL</span>
      </div>
    </Link>
  );
}
