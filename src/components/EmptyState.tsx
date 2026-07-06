import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 flex items-center justify-center mb-4">
        <Icon
          size={32}
          className="text-slate-300 dark:text-slate-600"
          strokeWidth={1.5}
        />
      </div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
        {title}
      </h4>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
