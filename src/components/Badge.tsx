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
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[8px]',
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-semibold border uppercase tracking-wider',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}
