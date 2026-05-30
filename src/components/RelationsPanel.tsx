import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Link2, Activity } from 'lucide-react';
import type { RelationGroup } from '../lib/relations';

interface RelationsPanelProps {
  groups: RelationGroup[];
  title?: string;
}

export default function RelationsPanel({ groups, title = 'Vínculos' }: RelationsPanelProps) {
  const nonEmptyGroups = groups.filter(g => g.count > 0);
  if (nonEmptyGroups.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
        <Link2 size={18} className="text-blue-500" />
        {title}
      </h3>
      {nonEmptyGroups.map(group => (
        <div key={group.id} className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{group.title} ({group.count})</p>
          <div className="space-y-2">
            {group.items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-sm transition-all group">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                  {item.subtitle && <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.subtitle}</p>}
                  {item.status && (
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      {item.status}
                    </span>
                  )}
                </div>
                {item.route && (
                  <Link to={item.route} className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all shrink-0">
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
