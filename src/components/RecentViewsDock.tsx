import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Home, X, History } from 'lucide-react';
import { useRecentViews } from '../hooks/useRecentViews';
import { cn } from '../lib/utils';

const typeConfig = {
  client: { icon: Users, path: '/clientes', label: 'Cliente', color: 'bg-blue-500' },
  property: { icon: Home, path: '/propiedades', label: 'Propiedad', color: 'bg-emerald-500' },
};

export default function RecentViewsDock() {
  const { recentViews, clearViews } = useRecentViews();

  if (recentViews.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="flex items-center gap-2 pl-3 pr-2 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mr-1">
          <History size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Recientes</span>
        </div>

        <AnimatePresence mode="popLayout">
          {recentViews.map((view) => {
            const config = typeConfig[view.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={`${view.type}-${view.id}`}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Link
                  to={`${config.path}/${view.id}`}
                  title={`${config.label}: ${view.name}`}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors group",
                    "bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-white", config.color)}>
                    <Icon size={12} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                    {view.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <button
          onClick={clearViews}
          title="Limpiar historial"
          className="ml-1 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}
