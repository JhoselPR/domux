import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { clsx } from 'clsx';

interface DateInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTH_FORMATTER = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' });
const DISPLAY_FORMATTER = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
const POPOVER_GUTTER = 16;
const POPOVER_MAX_HEIGHT = 336;
const POPOVER_MIN_HEIGHT = 144;

function parseDateValue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

export function DateInput({
  label,
  value,
  onChange,
  placeholder = 'Elegir fecha',
  disabled = false,
  required = false,
  className,
  id,
}: DateInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const [popoverLayout, setPopoverLayout] = useState<{ placement: 'top' | 'bottom'; maxHeight: number }>({
    placement: 'bottom',
    maxHeight: POPOVER_MAX_HEIGHT,
  });
  const popoverLayoutFrameRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedDate = parseDateValue(value);
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? new Date());

  useEffect(() => {
    if (!open) return;

    const updatePopoverLayout = () => {
      popoverLayoutFrameRef.current = null;
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const spaceBelow = window.innerHeight - triggerRect.bottom - POPOVER_GUTTER;
      const spaceAbove = triggerRect.top - POPOVER_GUTTER;
      const placement = spaceBelow < 260 && spaceAbove > spaceBelow ? 'top' : 'bottom';
      const availableSpace = placement === 'top' ? spaceAbove : spaceBelow;

      const maxHeight = Math.min(POPOVER_MAX_HEIGHT, Math.max(POPOVER_MIN_HEIGHT, availableSpace));

      setPopoverLayout((current) => {
        if (current.placement === placement && current.maxHeight === maxHeight) {
          return current;
        }

        return { placement, maxHeight };
      });
    };

    const schedulePopoverLayoutUpdate = () => {
      if (popoverLayoutFrameRef.current !== null) return;

      popoverLayoutFrameRef.current = window.requestAnimationFrame(updatePopoverLayout);
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    schedulePopoverLayoutUpdate();
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', schedulePopoverLayoutUpdate);
    window.addEventListener('scroll', schedulePopoverLayoutUpdate, true);

    return () => {
      if (popoverLayoutFrameRef.current !== null) {
        window.cancelAnimationFrame(popoverLayoutFrameRef.current);
        popoverLayoutFrameRef.current = null;
      }

      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', schedulePopoverLayoutUpdate);
      window.removeEventListener('scroll', schedulePopoverLayoutUpdate, true);
    };
  }, [open]);

  const calendarDays = getCalendarDays(visibleMonth);
  const selectedValue = selectedDate ? formatDateValue(selectedDate) : '';
  const todayValue = formatDateValue(new Date());

  const moveMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const closePopover = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const chooseDate = (date: Date) => {
    onChange(formatDateValue(date));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={clsx('relative flex flex-col gap-1.5', className)}>
      {label && (
        <label id={`${inputId}-label`} className="text-sm font-medium text-surface-700">
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={label ? `${inputId}-label ${inputId}` : undefined}
        disabled={disabled}
        onClick={() => {
          if (!open && selectedDate) {
            setVisibleMonth(selectedDate);
          }
          setOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            event.preventDefault();
            event.stopPropagation();
            closePopover();
          }
        }}
        className={clsx(
          'flex w-full items-center justify-between gap-3 rounded-xl border border-border-subtle bg-elevated px-4 py-2.5 text-left text-sm',
          'text-surface-900 shadow-sm transition-all duration-200 hover:border-border',
          'focus:outline-none focus:ring-2 focus:ring-home-500/30 focus:border-home-500',
          'disabled:cursor-not-allowed disabled:opacity-60'
        )}
      >
        <span className={clsx('truncate', !selectedDate && 'text-surface-500')}>
          {selectedDate ? DISPLAY_FORMATTER.format(selectedDate) : placeholder}
        </span>
        <CalendarDays size={16} className="shrink-0 text-surface-500" />
      </button>
      {required && <input tabIndex={-1} className="sr-only" required value={value} onChange={() => {}} aria-hidden="true" />}

      {open && (
        <div
          role="dialog"
          aria-label={label ? `Calendario de ${label}` : 'Calendario'}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              closePopover();
            }
          }}
          style={{ maxHeight: popoverLayout.maxHeight }}
          className={clsx(
            'absolute left-0 z-50 w-full max-w-80 overflow-y-auto overscroll-contain rounded-2xl border border-border-subtle bg-card p-2.5 shadow-xl animate-slide-down',
            popoverLayout.placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button type="button" onClick={() => moveMonth(-1)} className="rounded-lg p-1.5 text-surface-600 transition-colors hover:bg-card-muted" aria-label="Mes anterior">
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-semibold capitalize text-surface-900">
              {MONTH_FORMATTER.format(visibleMonth)}
            </p>
            <button type="button" onClick={() => moveMonth(1)} className="rounded-lg p-1.5 text-surface-600 transition-colors hover:bg-card-muted" aria-label="Mes siguiente">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-surface-500">
            {WEEKDAYS.map((day) => <span key={day} className="py-0.5">{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {calendarDays.map((date) => {
              const dateValue = formatDateValue(date);
              const selected = dateValue === selectedValue;
              const today = dateValue === todayValue;
              const muted = date.getMonth() !== visibleMonth.getMonth();

              return (
                <button
                  key={dateValue}
                  type="button"
                  onClick={() => chooseDate(date)}
                  className={clsx(
                    'aspect-square min-h-7 rounded-lg text-xs font-medium transition-all',
                    selected && 'bg-home-fill text-white shadow-md shadow-home-500/20',
                    !selected && today && 'bg-home-100 text-home-600 ring-1 ring-home-500/30',
                    !selected && !today && !muted && 'text-surface-800 hover:bg-card-muted',
                    !selected && muted && 'text-surface-400 hover:bg-card-muted'
                  )}
                  aria-pressed={selected}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
