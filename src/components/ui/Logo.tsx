import { clsx } from 'clsx';

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 24, className }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={clsx('shrink-0 text-accent', className)}>
      <path d="M12 3.2 3.5 10.6V21h6.2v-6h4.6v6h6.2V10.6l-2-1.75V5h-2.6v1.6z" />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 24, className }: LogoProps) {
  return (
    <span className={clsx('inline-flex items-center gap-2 font-display text-lg font-medium leading-none text-ink', className)}>
      <LogoMark size={size} />
      Domux
    </span>
  );
}
