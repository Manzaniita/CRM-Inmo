import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Link2 } from 'lucide-react';
import type { RelationGroup } from '../lib/relations';

interface RelationsPanelProps {
  groups: RelationGroup[];
  title?: string;
}

export default function RelationsPanel({ groups, title = 'Vínculos' }: RelationsPanelProps) {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
        <Link2 size={18} className="text-blue-500" />
        {title}
      </h3>
      {groups.map(group => (
        <div key={group.label} className="space-y-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{group.label}</p>
          <div className="space-y-2">
            {group.items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-all group">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                  {item.subtitle && <p className="text-[10px] text-gray-500">{item.subtitle}</p>}
                </div>
                {item.route && (
                  <Link to={item.route} className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all shrink-0">
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
