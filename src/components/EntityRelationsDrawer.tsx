import React, { useEffect, useMemo } from 'react';
import { X, ChevronRight, Link2, Activity, User, Home, Briefcase, ShoppingCart, Key, CheckSquare, Calendar, FileText, Store, ClipboardList } from 'lucide-react';
import { useRelationsDrawer } from '../context/RelationsDrawerContext';
import { useAppContext } from '../context/AppContext';
import { getClientRelations, getPropertyRelations, getColleagueRelations, type RelationEntityType, type RelationGroup, type RelationItem } from '../lib/relations';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';

const typeIcons: Record<RelationEntityType, React.ElementType> = {
  client: User,
  property: Home,
  colleague: Briefcase,
  buyer: ShoppingCart,
  sale: Key,
  rental: Key,
  task: CheckSquare,
  event: Calendar,
  document: FileText,
  marketplace: Store,
  waitingRoom: ClipboardList
};

function RelationItemCard({ item }: { item: RelationItem }) {
  const Icon = typeIcons[item.type] || Activity;
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-all group">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
          <Icon size={14} className="text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
          {item.subtitle && <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>}
          {item.status && (
            <span className={cn(
              "inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium",
              item.status === 'disponible' || item.status === 'completada' || item.status === 'realizado' ? "bg-green-100 text-green-700" :
              item.status === 'reservada' || item.status === 'en proceso' ? "bg-blue-100 text-blue-700" :
              item.status === 'vendida' || item.status === 'vencida' || item.status === 'caída' ? "bg-red-100 text-red-700" :
              item.status === 'alquilada' ? "bg-orange-100 text-orange-700" :
              item.status === 'pausada' ? "bg-gray-100 text-gray-600" :
              item.status === 'en_seguimiento' ? "bg-purple-100 text-purple-700" :
              "bg-gray-100 text-gray-600"
            )}>
              {item.status}
            </span>
          )}
          {item.date && (
            <p className="text-[10px] text-gray-400 mt-1">{formatDate(item.date)}</p>
          )}
        </div>
      </div>
      {item.route && (
        <Link
          to={item.route}
          className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all shrink-0"
          onClick={() => { /* drawer stays open, user can navigate */ }}
        >
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

function EmptyGroupState({ title }: { title: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
      <p className="text-xs text-gray-400 italic">Sin {title.toLowerCase()}</p>
    </div>
  );
}

export default function EntityRelationsDrawer() {
  const { isOpen, entityType, entityId, closeRelations } = useRelationsDrawer();
  const data = useAppContext();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRelations();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeRelations]);

  const groups = useMemo<RelationGroup[]>(() => {
    if (!entityType || !entityId) return [];
    const appData = {
      clients: data.clients,
      properties: data.properties,
      sales: data.sales,
      rentals: data.rentals,
      tasks: data.tasks,
      events: data.events,
      documents: data.documents,
      referredColleagues: data.referredColleagues,
      waitingRoom: data.waitingRoom,
      buyers: data.buyers,
      activityLogs: data.activityLogs
    };
    switch (entityType) {
      case 'client':
        return getClientRelations(entityId, appData);
      case 'property':
        return getPropertyRelations(entityId, appData);
      case 'colleague':
        return getColleagueRelations(entityId, appData);
      default:
        return [];
    }
  }, [entityType, entityId, data]);

  const entityName = useMemo(() => {
    if (!entityType || !entityId) return '';
    if (entityType === 'client') {
      return data.clients.find(c => c.id === entityId)?.name || 'Cliente';
    }
    if (entityType === 'property') {
      return data.properties.find(p => p.id === entityId)?.title || 'Propiedad';
    }
    if (entityType === 'colleague') {
      return data.referredColleagues.find(c => c.id === entityId)?.nombreApellido || 'Colega';
    }
    return '';
  }, [entityType, entityId, data]);

  if (!isOpen) return null;

  const hasLinks = groups.some(g => g.count > 0);

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={closeRelations}
      />
      {/* Drawer */}
      <div className="relative w-full sm:w-[420px] md:w-[480px] bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Link2 size={18} className="text-blue-600" />
              Vista 360°
            </h2>
            <p className="text-xs text-gray-500 font-medium truncate max-w-[280px]">{entityName}</p>
          </div>
          <button
            onClick={closeRelations}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!entityType || !entityId ? (
            <div className="text-center py-10">
              <Activity size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No se encontró información relacionada.</p>
            </div>
          ) : !hasLinks ? (
            <div className="text-center py-10">
              <Activity size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No se encontraron vínculos para este objeto.</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{group.title}</h3>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{group.count}</span>
                </div>
                {group.count > 0 ? (
                  <div className="space-y-2">
                    {group.items.map(item => (
                      <React.Fragment key={`${item.type}-${item.id}`}>
                        <RelationItemCard item={item} />
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <EmptyGroupState title={group.title} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
