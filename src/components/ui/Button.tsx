import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:brightness-110 focus-visible:ring-[var(--color-primary)]',
      secondary: 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:brightness-110 focus-visible:ring-[var(--color-accent)]',
      accent: 'bg-gradient-to-r from-[var(--color-primary)] via-[#d32f2f] to-[var(--color-accent)] text-white hover:brightness-110 focus-visible:ring-[var(--color-primary)]',
      outline: 'border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)] focus-visible:ring-[var(--color-primary)]',
      ghost: 'text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus-visible:ring-[var(--color-border)]',
      danger: 'bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:brightness-110 focus-visible:ring-[var(--color-danger)]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
