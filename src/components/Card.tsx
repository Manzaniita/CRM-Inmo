import React from 'react';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

export function Card({ children, className, title, subtitle, footer, ...props }: CardProps) {
  return (
    <div {...props} className={cn('bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden', className)}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-100">
          {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">{footer}</div>}
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
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className={cn('p-2 rounded-lg', colors[color])}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full', 
            trend.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
      </div>
    </Card>
  );
}
