import { clsx } from 'clsx';
import type { KeyboardEvent, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className, padding = 'md', hover, onClick }: CardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    onClick();
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        'rounded-xl border border-line bg-card',
        hover && 'cursor-pointer transition-colors hover:border-line-strong hover:bg-raised',
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
