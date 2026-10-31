import { clsx } from 'clsx';

interface SegmentedProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Segmented<T extends string>({ options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div className={clsx('flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-raised p-1', className)}>
      {options.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={clsx(
            'h-8 cursor-pointer rounded-md px-3 text-sm transition-colors',
            value === key ? 'bg-card font-medium text-ink shadow-[0_0_0_1px_var(--color-line)]' : 'text-ink-2 hover:text-ink'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
