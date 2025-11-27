import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  return (
    <div 
      className={cn('bg-[var(--color-surface)] rounded-lg shadow-sm border border-[var(--color-border)] transition-shadow hover:shadow-md', className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={cn('px-6 py-4 border-b border-[var(--color-border)]', className)}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardProps> = ({ children, className }) => {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
};

export const CardFooter: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={cn('px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-alt)]', className)}>
      {children}
    </div>
  );
};
