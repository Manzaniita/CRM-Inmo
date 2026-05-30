import React from 'react';
import { cn } from '../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple' | 'yellow';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export default function Badge({ children, variant = 'gray', size = 'sm', className }: BadgeProps) {
  const variants = {
    blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 border border-blue-500/10 dark:border-blue-400/10',
    green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 border border-emerald-500/10 dark:border-emerald-400/10',
    orange: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 border border-amber-500/10 dark:border-amber-400/10',
    red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400 border border-rose-500/10 dark:border-rose-400/10',
    gray: 'bg-slate-500/10 text-slate-600 dark:bg-slate-400/10 dark:text-slate-400 border border-slate-500/10 dark:border-slate-400/10',
    purple: 'bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400 border border-violet-500/10 dark:border-violet-400/10',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400 border border-yellow-500/10 dark:border-yellow-400/10',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium tracking-wide',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}
