import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className, padding = 'md', hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl bg-surface-50 border border-surface-300 shadow-sm',
        'transition-all duration-200',
        hover && 'hover:shadow-md hover:border-surface-400 cursor-pointer',
        paddingStyles[padding],
        className
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
