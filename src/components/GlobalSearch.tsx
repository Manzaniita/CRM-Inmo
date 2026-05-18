import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  Home,
  CheckSquare,
  Calendar,
  TrendingUp,
  Key,
  FileText,
  X
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn, normalizeSearchText } from '../lib/utils';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'cliente' | 'propiedad' | 'tarea' | 'evento' | 'venta' | 'alquiler' | 'documento';
  path: string;
}

const TYPE_CONFIG = {
  cliente: { label: 'Clientes', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  propiedad: { label: 'Propiedades', icon: Home, color: 'text-green-600', bg: 'bg-green-50' },
  tarea: { label: 'Tareas', icon: CheckSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
  evento: { label: 'Eventos', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
  venta: { label: 'Ventas', icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  alquiler: { label: 'Alquileres', icon: Key, color: 'text-teal-600', bg: 'bg-teal-50' },
  documento: { label: 'Documentos', icon: FileText, color: 'text-red-600', bg: 'bg-red-50' },
};

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { clients, properties, tasks, events, sales, rentals, documents } = useAppContext();
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const results: SearchResult[] = useMemo(() => {
    const q = normalizeSearchText(query.trim());
    if (q.length < 2) return [];

    const found: SearchResult[] = [];

    const matches = (text: string) => normalizeSearchText(text).includes(q);

    // Clientes
    clients.forEach(c => {
      if (matches(c.name) || matches(c.phone) || matches(c.email)) {
        found.push({ id: c.id, title: c.name, subtitle: c.phone + ' · ' + c.type, type: 'cliente', path: '/clientes/' + c.id });
      }
    });

    // Propiedades
    properties.forEach(p => {
      if (matches(p.title) || matches(p.address) || matches(p.zone)) {
        found.push({ id: p.id, title: p.title, subtitle: p.address + ', ' + p.zone, type: 'propiedad', path: '/propiedades/' + p.id });
      }
    });

    // Tareas
    tasks.forEach(t => {
      if (matches(t.title) || (t.description && matches(t.description))) {
        found.push({ id: t.id, title: t.title, subtitle: t.status + ' · ' + t.priority, type: 'tarea', path: '/tareas' });
      }
    });

    // Eventos
    events.forEach(e => {
      if (matches(e.title) || (e.description && matches(e.description))) {
        found.push({ id: e.id, title: e.title, subtitle: e.date + ' ' + e.time + ' · ' + e.type, type: 'evento', path: '/agenda' });
      }
    });

    // Ventas
    sales.forEach(s => {
      const buyer = clients.find(c => c.id === s.clientCompradorId);
      const prop = properties.find(p => p.id === s.propiedadId);
      const buyerName = buyer?.name || 'Comprador';
      const propTitle = prop?.title || s.propiedadId;
      if (matches(s.id) || matches(buyerName) || matches(propTitle)) {
        found.push({ id: s.id, title: 'Venta #' + s.id.toUpperCase(), subtitle: buyerName + ' · ' + propTitle, type: 'venta', path: '/ventas' });
      }
    });

    // Alquileres
    rentals.forEach(r => {
      const tenant = clients.find(c => c.id === r.inquilinoId);
      const prop = properties.find(p => p.id === r.propiedadId);
      const tenantName = tenant?.name || 'Inquilino';
      const propTitle = prop?.title || r.propiedadId;
      if (matches(r.id) || matches(tenantName) || matches(propTitle)) {
        found.push({ id: r.id, title: 'Alquiler #' + r.id.toUpperCase(), subtitle: tenantName + ' · ' + propTitle, type: 'alquiler', path: '/alquileres' });
      }
    });

    // Documentos
    documents.forEach(d => {
      if (matches(d.name) || (d.notes && matches(d.notes))) {
        found.push({ id: d.id, title: d.name, subtitle: d.type + ' · ' + d.status, type: 'documento', path: '/documentos' });
      }
    });

    return found.slice(0, 20);
  }, [query, clients, properties, tasks, events, sales, rentals, documents]);

  const grouped = useMemo(() => {
    const groups: { type: SearchResult['type']; items: SearchResult[] }[] = [];
    const order: SearchResult['type'][] = ['cliente', 'propiedad', 'tarea', 'evento', 'venta', 'alquiler', 'documento'];
    order.forEach(type => {
      const items = results.filter(r => r.type === type);
      if (items.length > 0) groups.push({ type, items });
    });
    return groups;
  }, [results]);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    navigate(result.path);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.parentElement?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const shouldShow = isOpen && query.trim().length >= 2;

  return (
    <div className="relative max-w-sm w-full">
      <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
        <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar clientes, propiedades..."
          className="bg-transparent border-none outline-none w-full text-gray-900 placeholder:text-gray-400"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          onFocus={() => { if (query.trim().length >= 2) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button onClick={handleClear} className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0">
            <X size={14} className="text-gray-400" />
          </button>
        )}
      </div>

      {shouldShow && (
        <>
          {/* Overlay transparente para capturar clicks */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-[70vh] overflow-y-auto"
          >
            {grouped.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-400 font-medium">No se encontraron resultados</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {grouped.map(group => {
                  const config = TYPE_CONFIG[group.type];
                  const Icon = config.icon;
                  return (
                    <div key={group.type}>
                      <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <Icon size={12} />
                        {config.label}
                      </div>
                      {group.items.map(item => (
                        <button
                          key={item.id + item.type}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors group"
                          onClick={() => handleSelect(item)}
                        >
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                            <Icon size={14} className={config.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}