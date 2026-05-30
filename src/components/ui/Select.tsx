import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar',
  disabled = false,
  className,
  id,
  ariaLabel,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const chooseOption = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  const closePopover = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const chooseAdjacentOption = (direction: 1 | -1) => {
    const enabledOptions = options.filter((option) => !option.disabled);
    if (enabledOptions.length === 0) return;

    const currentIndex = enabledOptions.findIndex((option) => option.value === value);
    const nextIndex = currentIndex === -1
      ? direction === 1 ? 0 : enabledOptions.length - 1
      : (currentIndex + direction + enabledOptions.length) % enabledOptions.length;

    onChange(enabledOptions[nextIndex].value);
  };

  return (
    <div ref={rootRef} className={clsx('relative flex flex-col gap-1.5', className)}>
      {label && (
        <label id={`${selectId}-label`} className="text-sm font-medium text-surface-700">
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={label ? `${selectId}-label ${selectId}` : undefined}
        aria-label={!label ? ariaLabel : undefined}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            if (open) {
              event.preventDefault();
              event.stopPropagation();
              closePopover();
            }
            return;
          }

          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            chooseAdjacentOption(event.key === 'ArrowDown' ? 1 : -1);
          }
        }}
        className={clsx(
          'flex w-full items-center justify-between gap-3 rounded-xl border border-border-subtle bg-elevated px-4 py-2.5 text-left text-sm',
          'text-surface-900 shadow-sm transition-all duration-200 hover:border-border',
          'focus:outline-none focus:ring-2 focus:ring-home-500/30 focus:border-home-500',
          'disabled:cursor-not-allowed disabled:opacity-60'
        )}
      >
        <span className={clsx('truncate', !selectedOption && 'text-surface-500')}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown size={16} className={clsx('shrink-0 text-surface-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? `${selectId}-label` : undefined}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              closePopover();
            }
          }}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-56 overflow-auto rounded-2xl border border-border-subtle bg-card p-1.5 shadow-xl animate-slide-down"
        >
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onClick={() => chooseOption(option)}
                className={clsx(
                  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors',
                  selected ? 'bg-home-100 text-home-600 font-semibold' : 'text-surface-700 hover:bg-card-muted',
                  option.disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className="truncate">{option.label}</span>
                {selected && <Check size={15} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
