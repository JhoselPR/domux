import { clsx } from 'clsx';

interface AvatarProps {
  name?: string | null;
  size?: 'sm' | 'md';
}

export function Avatar({ name, size = 'sm' }: AvatarProps) {
  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full border border-line bg-raised font-medium text-ink-2',
        size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
      )}
    >
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}
