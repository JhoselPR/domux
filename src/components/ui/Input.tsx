import { clsx } from 'clsx';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ink-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={clsx(
            'h-10 w-full rounded-lg border border-line-strong bg-card px-3 text-sm',
            'text-ink placeholder:text-ink-3',
            'transition-[border-color,box-shadow]',
            'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent',
            icon && 'pl-9',
            error && 'border-danger focus:ring-danger/25 focus:border-danger',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs font-medium text-danger animate-slide-down">{error}</p>
      )}
    </div>
  );
}
