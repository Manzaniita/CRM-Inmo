import React from 'react';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  glow?: boolean;
}

export function Card({ children, className, title, subtitle, footer, glow = true, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-2xl overflow-hidden transition-all duration-300',
        'bg-white/70 dark:bg-slate-800/70',
        'backdrop-blur-xl border border-white/40 dark:border-white/10',
        'shadow-soft-md dark:shadow-none',
        glow && 'glow-hover',
        className
      )}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-slate-100/50 dark:border-white/5">
          {title && <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100/50 dark:border-white/5">
          {footer}
        </div>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'blue'
}: {
  label: string;
  value: string | number;
  icon: any;
  trend?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'cyan';
}) {
  const colorMap = {
    blue:   'bg-blue-50/80 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    green:  'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    orange: 'bg-amber-50/80 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    red:    'bg-rose-50/80 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    purple: 'bg-violet-50/80 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
    cyan:   'bg-cyan-50/80 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400',
  };

  const glowMap = {
    blue:   'hover:shadow-[0_0_20px_rgba(59,130,246,0.20)] dark:hover:shadow-[0_0_20px_rgba(6,182,212,0.20)]',
    green:  'hover:shadow-[0_0_20px_rgba(16,185,129,0.20)] dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.20)]',
    orange: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.20)] dark:hover:shadow-[0_0_20px_rgba(245,158,11,0.20)]',
    red:    'hover:shadow-[0_0_20px_rgba(244,63,94,0.20)] dark:hover:shadow-[0_0_20px_rgba(244,63,94,0.20)]',
    purple: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.20)] dark:hover:shadow-[0_0_20px_rgba(139,92,246,0.20)]',
    cyan:   'hover:shadow-[0_0_20px_rgba(6,182,212,0.20)] dark:hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]',
  };

  return (
    <Card className={cn('flex flex-col', glowMap[color])} glow>
      <div className="flex items-center justify-between mb-4">
        <div className={cn('p-2.5 rounded-xl', colorMap[color])}>
          <Icon size={20} strokeWidth={1.5} />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-semibold px-2.5 py-1 rounded-full',
            trend.startsWith('+')
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
          )}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <h4 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1 tracking-tight">{value}</h4>
      </div>
    </Card>
  );
}
