import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'accent' | 'secondary';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  const variants = {
    default: 'bg-[var(--color-surface-alt)] text-[var(--color-text)]',
    primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
    accent: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
    secondary: 'bg-[var(--color-border)] text-[var(--color-text-muted)]',
    success: 'bg-successBase/10 text-successBase',
    warning: 'bg-warningBase/10 text-warningBase',
    danger: 'bg-dangerBase/10 text-dangerBase',
    info: 'bg-[var(--color-primary)]/10 text-[var(--color-text)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
