import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="text-emerald-500 dark:text-emerald-400" size={18} strokeWidth={1.5} />,
    error: <AlertCircle className="text-rose-500 dark:text-rose-400" size={18} strokeWidth={1.5} />,
    info: <Info className="text-accent dark:text-dark-accent" size={18} strokeWidth={1.5} />,
    warning: <AlertCircle className="text-amber-500 dark:text-amber-400" size={18} strokeWidth={1.5} />
  };

  const backgrounds = {
    success: 'bg-emerald-50/90 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20',
    error: 'bg-rose-50/90 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20',
    info: 'bg-blue-50/90 border-blue-100 dark:bg-cyan-500/10 dark:border-cyan-500/20',
    warning: 'bg-amber-50/90 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20'
  };

  return (
    <div className={cn(
      "fixed top-4 right-4 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md",
      "toast-spring",
      backgrounds[type]
    )}>
      {icons[type]}
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{message}</p>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
