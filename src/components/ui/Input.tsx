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
          className="text-sm font-medium text-surface-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={clsx(
            'w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-2.5 text-sm',
            'text-surface-900 placeholder:text-surface-500',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
            'hover:border-surface-400',
            icon && 'pl-10',
            error && 'border-danger-400 focus:ring-danger-500/30 focus:border-danger-500',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-danger-500 animate-slide-down">{error}</p>
      )}
    </div>
  );
}
