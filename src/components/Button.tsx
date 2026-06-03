import { type ButtonHTMLAttributes, type Ref } from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export default function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  ref,
  ...props
}: ButtonProps) {
  const variants = {
    primary: cn(
      'bg-accent text-white hover:bg-accent/90',
      'dark:bg-dark-accent dark:text-slate-900 dark:hover:bg-dark-accent/90',
      'shadow-soft-md'
    ),
    secondary: cn(
      'bg-slate-100 text-slate-900 hover:bg-slate-200',
      'dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
    ),
    outline: cn(
      'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700',
      'dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
    ),
    ghost: cn(
      'bg-transparent hover:bg-slate-100 text-slate-600',
      'dark:hover:bg-slate-800 dark:text-slate-400'
    ),
    danger: cn(
      'bg-rose-500 text-white hover:bg-rose-600',
      'dark:bg-rose-500 dark:hover:bg-rose-600'
    ),
    success: cn(
      'bg-emerald-600 text-white hover:bg-emerald-700',
      'dark:bg-emerald-500 dark:hover:bg-emerald-600'
    ),
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:focus-visible:ring-dark-accent/50',
        'disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        'magnetic-btn',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
