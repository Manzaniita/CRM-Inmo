import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Gauge, Search, Plus, ChevronRight, Clock, DollarSign, Grid, List as ListIcon, X, ArrowUpDown, Edit3, Trash2, MoreVertical, Link2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useRelationsDrawer } from '../context/RelationsDrawerContext';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Card, StatCard } from '../components/Card';
import { cn, formatCurrency, formatDate, normalizeSearchText } from '../lib/utils';
import { generateId } from '../lib/id';
import { validateSale } from '../lib/validators';
import type { Sale, SaleStatus, ActivityLog } from '../types';
import SearchableSelect from '../components/SearchableSelect';

const STAGES: SaleStatus[] = ['activa', 'vendida', 'caída'];

function getBestDate(sale: Sale): string {
  return sale.fecha || sale.fechaReserva || sale.fechaEscritura || sale.fechaActualizacion || sale.fechaCreacion || '';
}

export default function Reservometro() {
  const { sales, clients, properties, addSale, updateSale, deleteSale, showToast, addActivityLog } = useAppContext();
  const { openRelations } = useRelationsDrawer();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<'pipeline' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPropertyType, setFilterPropertyType] = useState<string>('all');
  const [filterBuyer, setFilterBuyer] = useState<string>('');
  const [filterSeller, setFilterSeller] = useState<string>('');
  const [filterAgent, setFilterAgent] = useState<string>('');
  const [sortKey, setSortKey] = useState<string>('fecha-desc');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [highlightedSaleId, setHighlightedSaleId] = useState<string | null>(null);

  // Handle query param saleId
  useEffect(() => {
    const saleId = searchParams.get('saleId');
    if (saleId) {
      setHighlightedSaleId(saleId);
      const el = document.getElementById(`sale-row-${saleId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const sale = sales.find(s => s.id === saleId);
      if (sale) {
        setEditingSale(sale);
        setIsFormOpen(true);
      }
    }
  }, [searchParams, sales]);

  const lowerSearch = normalizeSearchText(searchTerm);

  const filteredSales = useMemo(() => {
    let result = sales.filter(sale => {
      const property = properties.find(p => p.id === sale.propiedadId);
      const client = clients.find(c => c.id === sale.clientCompradorId);
      const seller = clients.find(c => c.id === sale.propietarioId);
      const matchesSearch = !lowerSearch ||
        normalizeSearchText(property?.address || sale.externalPropertyAddress).includes(lowerSearch) ||
        normalizeSearchText(client?.name || sale.comprador).includes(lowerSearch) ||
        normalizeSearchText(seller?.name || sale.vendedor).includes(lowerSearch) ||
        normalizeSearchText(sale.inmoAgente).includes(lowerSearch) ||
        normalizeSearchText(sale.nombre).includes(lowerSearch) ||
        normalizeSearchText(sale.id).includes(lowerSearch) ||
        normalizeSearchText(sale.externalPropertyCode).includes(lowerSearch);
      const matchesStatus = filterStatus === 'all' || sale.estado === filterStatus;
      const matchesPropertyType = filterPropertyType === 'all' ||
        (filterPropertyType === 'vinculada' ? !!sale.propiedadId : !sale.propiedadId);
      const matchesBuyer = !filterBuyer || sale.clientCompradorId === filterBuyer;
      const matchesSeller = !filterSeller || sale.propietarioId === filterSeller;
      const matchesAgent = !filterAgent || normalizeSearchText(sale.inmoAgente || '').includes(normalizeSearchText(filterAgent));
      return matchesSearch && matchesStatus && matchesPropertyType && matchesBuyer && matchesSeller && matchesAgent;
    });

    result.sort((a, b) => {
      let compare = 0;
      switch (sortKey) {
        case 'fecha': {
          const dateA = getBestDate(a);
          const dateB = getBestDate(b);
          if (dateA && dateB) compare = dateA.localeCompare(dateB);
          else if (dateA) compare = -1;
          else if (dateB) compare = 1;
          else compare = 0;
          break;
        }
        case 'estado':
          compare = a.estado.localeCompare(b.estado);
          break;
        case 'comision':
          compare = a.comisionEstimada - b.comisionEstimada;
          break;
        case 'precio':
          compare = (a.valorCierre || a.precioAcordado || a.precioPublicado) - (b.valorCierre || b.precioAcordado || b.precioPublicado);
          break;
        default:
          compare = 0;
      }
      return sortDirection === 'desc' ? -compare : compare;
    });

    return result;
  }, [sales, lowerSearch, filterStatus, filterPropertyType, filterBuyer, filterSeller, filterAgent, sortKey, sortDirection, clients, properties]);

  const currentYear = new Date().getFullYear();

  const stats = {
    active: sales.filter(s => s.estado === 'activa').length,
    sold: sales.filter(s => s.estado === 'vendida').length,
    fallen: sales.filter(s => s.estado === 'caída').length,
    totalCommissions: sales
      .filter(s => s.estado === 'vendida')
      .reduce((acc, s) => acc + (s.moneda === 'ARS' ? s.comisionEstimada : 0), 0),
    grossCommissionsUsd: sales
      .filter(s => {
        if (s.estado !== 'vendida' || !s.isCollected) return false;
        const dateStr = s.fecha || s.fechaCreacion;
        if (!dateStr) return false;
        return new Date(dateStr).getFullYear() === currentYear;
      })
      .reduce((acc, s) => {
        if (typeof s.valorCierre === 'number' && typeof s.porcentajeNeto === 'number') {
          return acc + (s.valorCierre * (s.porcentajeNeto / 100));
        }
        return acc;
      }, 0),
  };

  const getStatusVariant = (status: string): string => {
    switch (status) {
      case 'activa': return 'blue';
      case 'vendida': return 'green';
      case 'caída': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reservómetro</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestión completa de reservas y operaciones de venta.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button onClick={() => setView('pipeline')} className={cn("p-1.5 rounded-md transition-all", view === 'pipeline' ? "bg-blue-100 text-blue-700" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50")}><Grid size={18} /></button>
            <button onClick={() => setView('list')} className={cn("p-1.5 rounded-md transition-all", view === 'list' ? "bg-blue-100 text-blue-700" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50")}><ListIcon size={18} /></button>
          </div>
          <Button variant="primary" onClick={() => { setEditingSale(null); setIsFormOpen(true); }}>
            <Plus size={18} className="mr-2" /> Nueva Operación
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Activas" value={stats.active.toString()} icon={Gauge} color="blue" />
        <StatCard label="Vendidas" value={stats.sold.toString()} icon={CheckCircle2} color="green" />
        <StatCard label="Caídas" value={stats.fallen.toString()} icon={AlertCircle} color="red" />
        <StatCard label="Comisiones (ARS)" value={formatCurrency(stats.totalCommissions, 'ARS')} icon={DollarSign} color="green" />
        <StatCard label="Com. brutas cobradas (USD)" value={formatCurrency(stats.grossCommissionsUsd, 'USD')} icon={DollarSign} color="green" />
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 max-w-md w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input type="text" placeholder="Buscar por comprador, propiedad o ID..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-wrap">
            <select className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none" value={filterPropertyType} onChange={e => setFilterPropertyType(e.target.value)}>
              <option value="all">Tipo propiedad</option>
              <option value="vinculada">Vinculada</option>
              <option value="manual">Manual</option>
            </select>
            <select className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none" value={sortKey} onChange={e => setSortKey(e.target.value)}>
              <option value="fecha">Fecha (más próxima)</option>
              <option value="fecha-desc">Fecha (más lejana)</option>
              <option value="estado">Estado</option>
              <option value="comision">Comisión</option>
              <option value="precio">Precio</option>
            </select>
            <button onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" title={sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}>
              <ArrowUpDown size={16} className={cn("transition-transform", sortDirection === 'asc' ? 'rotate-180' : '')} />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-wrap">
            <SearchableSelect placeholder="Filtrar comprador" value={filterBuyer} onChange={setFilterBuyer} options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone }))} allowEmpty emptyLabel="Todos los compradores" />
            <SearchableSelect placeholder="Filtrar vendedor" value={filterSeller} onChange={setFilterSeller} options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone }))} allowEmpty emptyLabel="Todos los vendedores" />
            <input type="text" placeholder="Agente / Inmo" className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none" value={filterAgent} onChange={e => setFilterAgent(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest self-center mr-1">Estado:</span>
            {(['all', ...STAGES] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold border transition-all',
                  filterStatus === s
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-600'
                )}
              >
                {s === 'all' ? 'Todas' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'pipeline' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-thin">
          {STAGES.map(stage => {
            const stageSales = filteredSales.filter(s => s.estado === stage);
            return (
              <div key={stage} className="flex-shrink-0 w-72 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stage}</h3>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{stageSales.length}</span>
                </div>
                <div className="space-y-3">
                  {stageSales.map(sale => {
                    const property = properties.find(p => p.id === sale.propiedadId);
                    const client = clients.find(c => c.id === sale.clientCompradorId);
                    return (
                      <div key={sale.id}>
                        <Card className="p-4 cursor-pointer hover:border-blue-300 transition-all active:scale-[0.98] group relative">
                          <div className="flex items-center justify-between mb-3">
                            <Badge size="xs" variant={getStatusVariant(sale.estado) as any}>{sale.estado}</Badge>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">#{sale.id}</p>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-1">{sale.nombre || property?.title || sale.externalPropertyAddress || 'Propiedad no vinculada'}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase">{client?.name?.charAt(0) || '?'}</div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{client?.name || 'Sin comprador'}</p>
                          </div>
                          <div className="mt-2 pt-3 border-t border-gray-50 flex items-center justify-between">
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(sale.valorCierre || sale.precioAcordado || sale.precioPublicado, sale.moneda)}</p>
                            <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all"><ChevronRight size={14} /></div>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">{formatDate(getBestDate(sale))}</p>
                        </Card>
                      </div>
                    );
                  })}
                  {stageSales.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase italic tracking-widest">Sin operaciones</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden shadow-sm border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Operación</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Precios</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Comisión</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Monto escritura</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fecha</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Estado</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSales.map(sale => {
                  const property = properties.find(p => p.id === sale.propiedadId);
                  const client = clients.find(c => c.id === sale.clientCompradorId);
                  const isHighlighted = highlightedSaleId === sale.id;
                  return (
                    <tr key={sale.id} id={`sale-row-${sale.id}`} className={cn("hover:bg-blue-500/5 dark:hover:bg-blue-500/5 transition-colors group cursor-pointer", isHighlighted && "bg-yellow-50 dark:bg-yellow-500/10")} onClick={() => { setEditingSale(sale); setIsFormOpen(true); }}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{sale.nombre || property?.address || sale.externalPropertyAddress || 'Propiedad no vinculada'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">{client?.name || sale.comprador || 'Sin comprador'} • {property?.title || sale.externalPropertyCode || sale.propiedadId || 'Sin vincular'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Pub: {formatCurrency(sale.precioPublicado, sale.moneda)}</span>
                          {sale.valorOfertado !== undefined && (
                            <span className="text-blue-600 font-medium">
                              Ofertado: {typeof sale.valorOfertado === 'number' ? formatCurrency(sale.valorOfertado, sale.moneda) : sale.valorOfertado}
                            </span>
                          )}
                          {sale.valorCierre !== undefined && <span className="text-green-600 font-medium">Cierre: {formatCurrency(sale.valorCierre, sale.moneda)}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-blue-600">{formatCurrency(sale.comisionEstimada, sale.moneda)}</span>
                        {sale.grossCommissionUsd !== undefined && <span className="block text-[10px] text-green-600">Bruta USD {sale.grossCommissionUsd}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600 dark:text-slate-400">{sale.montoEscritura ?? '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(getBestDate(sale))}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(sale.estado) as any}>{sale.estado}</Badge>
                        {sale.isCollected && <span className="block text-[10px] text-green-600 font-bold mt-0.5">Cobrada</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Ver vínculos" onClick={e => { e.stopPropagation(); openRelations('sale', sale.id); }}><Link2 size={16} /></button>
                          <SaleOperationMenu sale={sale} onUpdate={updateSale} onLog={addActivityLog} showToast={showToast} />
                          <button className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={e => { e.stopPropagation(); setEditingSale(sale); setIsFormOpen(true); }}><Edit3 size={16} /></button>
                          <button className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" onClick={e => { e.stopPropagation(); if (confirm('¿Eliminar esta operación?')) deleteSale(sale.id); }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <div className="py-20 text-center">
                <Gauge size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">No se encontraron operaciones.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {isFormOpen && (
        <SaleFormModal sale={editingSale} onClose={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}

function SaleOperationMenu({ sale, onUpdate, onLog, showToast }: { sale: Sale; onUpdate: (s: Sale) => void; onLog: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => void; showToast: (message: string, type: any) => void }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const changeStatus = (status: SaleStatus) => {
    setOpen(false);
    onUpdate({ ...sale, estado: status });
    onLog({ type: 'sale', action: 'status_changed', title: `Operación ${sale.nombre || sale.id} marcada como ${status}`, entityId: sale.id });
    showToast(`Estado actualizado a ${status}`, 'success');
  };

  const toggleCollected = () => {
    setOpen(false);
    const next = !sale.isCollected;
    onUpdate({ ...sale, isCollected: next });
    onLog({ type: 'sale', action: 'updated', title: `Operación ${sale.nombre || sale.id} ${next ? 'marcada como cobrada' : 'desmarcada como cobrada'}`, entityId: sale.id });
    showToast(next ? 'Operación marcada como cobrada' : 'Operación desmarcada como cobrada', 'success');
  };

  const menuPos = useMemo(() => {
    if (!buttonRef.current || !open) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 192;
    const menuHeight = 220;
    let left = rect.right - menuWidth + 4;
    let top = rect.bottom + 6;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
    if (top + menuHeight > window.innerHeight - 8) top = rect.top - menuHeight - 6;
    return { top, left };
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
      >
        <MoreVertical size={16} />
      </button>
      {open && menuPos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[200] w-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-2 text-xs font-medium overflow-hidden"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <button
            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700/50 text-blue-700 dark:text-blue-400 transition-colors"
            onClick={e => { e.stopPropagation(); changeStatus('activa'); }}
          >
            Marcar como Activa
          </button>
          <button
            className="w-full text-left px-4 py-2.5 hover:bg-green-50 dark:hover:bg-slate-700/50 text-green-700 dark:text-green-400 transition-colors"
            onClick={e => { e.stopPropagation(); changeStatus('vendida'); }}
          >
            Marcar como Vendida
          </button>
          <button
            className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-slate-700/50 text-red-700 dark:text-red-400 transition-colors"
            onClick={e => { e.stopPropagation(); changeStatus('caída'); }}
          >
            Marcar como Caída
          </button>
          <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
          <button
            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700/50 text-blue-700 dark:text-blue-400 transition-colors"
            onClick={e => { e.stopPropagation(); toggleCollected(); }}
          >
            {sale.isCollected ? 'Desmarcar cobrada' : 'Marcar como cobrada'}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

function SaleFormModal({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  const { clients, properties, addSale, updateSale, showToast, addActivityLog, addClient } = useAppContext();

  const hasManualProperty = !!(sale?.externalPropertyAddress || sale?.externalPropertyLink || sale?.externalPropertyCode);
  const [propertyMode, setPropertyMode] = useState<'existing' | 'manual'>(sale ? (sale.propiedadId ? 'existing' : hasManualProperty ? 'manual' : 'existing') : 'existing');

  // Inline new-client mini-forms
  const [showNewBuyerForm, setShowNewBuyerForm] = useState(false);
  const [newBuyerName, setNewBuyerName] = useState('');
  const [newBuyerPhone, setNewBuyerPhone] = useState('');
  const [showNewSellerForm, setShowNewSellerForm] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerPhone, setNewSellerPhone] = useState('');

  // Field-level errors
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<Partial<Sale>>(() => {
    if (sale) {
      return {
        ...sale,
        isCollected: sale.isCollected ?? false,
        montoEscritura: typeof sale.montoEscritura === 'number' ? String(sale.montoEscritura) : sale.montoEscritura
      };
    }
    return {
      estado: 'activa',
      moneda: 'USD',
      precioPublicado: 0,
      comisionEstimada: 0,
      notas: '',
      clientCompradorId: '',
      propiedadId: '',
      propietarioId: '',
      vendedorId: '',
      nombre: '',
      fecha: '',
      vendedor: '',
      comprador: '',
      compradorManual: '',
      vendedorManual: '',
      compradorInmobiliaria: '',
      vendedorInmobiliaria: '',
      inmoAgente: '',
      puntas: undefined,
      porcentajeBruto: undefined,
      porcentajeNeto: undefined,
      porcentajeReferido: undefined,
      valorOfertado: undefined,
      contraoferta1: undefined,
      contraoferta2: undefined,
      valorCierre: undefined,
      escribania: '',
      montoEscritura: undefined,
      infoExtra: '',
      presupuesto: undefined,
      isCollected: false,
      grossCommissionUsd: undefined,
      fechaCreacion: new Date().toISOString().split('T')[0],
      externalPropertyAddress: '',
      externalPropertyLink: '',
      externalPropertyCode: '',
    };
  });

  const handleCreateBuyer = () => {
    if (!newBuyerName.trim()) { showToast('El nombre del comprador es obligatorio', 'error'); return; }
    const newClient = {
      id: generateId('c'),
      name: newBuyerName.trim(),
      phone: newBuyerPhone.trim(),
      email: '',
      type: 'comprador' as const,
      types: ['comprador' as const],
      status: 'nuevo' as const,
      origin: 'Oficina' as const,
      lastContact: new Date().toISOString().split('T')[0],
      notes: '',
      createdAt: new Date().toISOString().split('T')[0],
    };
    addClient(newClient);
    setFormData(prev => ({ ...prev, clientCompradorId: newClient.id }));
    setShowNewBuyerForm(false);
    setNewBuyerName('');
    setNewBuyerPhone('');
    showToast(`Comprador "${newClient.name}" creado y seleccionado`, 'success');
  };

  const handleCreateSeller = () => {
    if (!newSellerName.trim()) { showToast('El nombre del vendedor es obligatorio', 'error'); return; }
    const newClient = {
      id: generateId('c'),
      name: newSellerName.trim(),
      phone: newSellerPhone.trim(),
      email: '',
      type: 'vendedor' as const,
      types: ['vendedor' as const],
      status: 'nuevo' as const,
      origin: 'Oficina' as const,
      lastContact: new Date().toISOString().split('T')[0],
      notes: '',
      createdAt: new Date().toISOString().split('T')[0],
    };
    addClient(newClient);
    setFormData(prev => ({ ...prev, propietarioId: newClient.id }));
    setShowNewSellerForm(false);
    setNewSellerName('');
    setNewSellerPhone('');
    showToast(`Vendedor "${newClient.name}" creado y seleccionado`, 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};

    const hasComprador = !!(formData.clientCompradorId || (formData.compradorManual && formData.compradorManual.trim()));
    if (!hasComprador) newErrors.comprador = true;
    if (!formData.estado) newErrors.estado = true;
    if (propertyMode === 'existing' && !formData.propiedadId) newErrors.propiedad = true;
    if (propertyMode === 'manual' && !(formData.externalPropertyAddress || formData.externalPropertyLink || formData.externalPropertyCode)) newErrors.propiedadManual = true;
    if (!formData.precioPublicado && formData.precioPublicado !== 0) newErrors.precio = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Completa los campos obligatorios marcados en rojo', 'error');
      return;
    }
    setErrors({});

    const data: Partial<Sale> = { ...formData };
    if (data.compradorManual?.trim()) {
      data.clientCompradorId = '';
    }
    if (propertyMode === 'manual') {
      data.propiedadId = '';
    } else {
      data.externalPropertyAddress = '';
      data.externalPropertyLink = '';
      data.externalPropertyCode = '';
    }
    const validation = validateSale(data);
    if (!validation.valid) {
      return showToast(validation.message || 'Error de validación', 'error');
    }
    const now = new Date().toISOString().split('T')[0];
    if (sale) {
      updateSale({ ...sale, ...(data as Sale), fechaActualizacion: now });
    } else {
      const newSale: Sale = { ...(data as Sale), id: generateId('s'), fechaCreacion: now, fechaActualizacion: now };
      addSale(newSale);
      if (propertyMode === 'manual') {
        addActivityLog({
          type: 'sale',
          action: 'created',
          title: `Operación creada con propiedad manual: ${newSale.nombre || newSale.externalPropertyAddress || newSale.id}`,
          entityId: newSale.id
        });
      }
    }
    onClose();
  };

  const inputCls = (field: string) =>
    cn('w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all',
      errors[field] ? 'border-red-500 bg-red-50/30' : 'border-slate-200 dark:border-slate-700');

  const selectedProperty = properties.find(p => p.id === formData.propiedadId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <h2 className="font-black text-xl text-slate-900 dark:text-slate-100">{sale ? 'Editar' : 'Nueva'} Operación</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="space-y-8">

            {/* Comprador */}
            <div className="space-y-3">
              <label className={cn('block text-xs font-black uppercase tracking-widest', errors.comprador ? 'text-red-500' : 'text-slate-400 dark:text-slate-500')}>Comprador *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Seleccionar cliente</span>
                    <button type="button" onClick={() => setShowNewBuyerForm(v => !v)}
                      className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center font-bold text-xs transition-all" title="Crear nuevo comprador">+</button>
                  </div>
                  <SearchableSelect value={formData.clientCompradorId || ''} onChange={val => { setFormData({...formData, clientCompradorId: val, compradorManual: ''}); setErrors(prev => ({...prev, comprador: false})); }}
                    options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone }))} placeholder="Seleccionar Cliente" allowEmpty />
                  {showNewBuyerForm && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Nuevo Comprador rápido</p>
                      <input className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 rounded-lg text-sm outline-none" placeholder="Nombre *" value={newBuyerName} onChange={e => setNewBuyerName(e.target.value)} />
                      <input className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 rounded-lg text-sm outline-none" placeholder="Teléfono" value={newBuyerPhone} onChange={e => setNewBuyerPhone(e.target.value)} />
                      <div className="flex gap-2">
                        <button type="button" onClick={handleCreateBuyer} className="flex-1 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700">Crear y Seleccionar</button>
                        <button type="button" onClick={() => setShowNewBuyerForm(false)} className="px-3 py-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">O ingresar nombre manual</p>
                  <input className={cn(inputCls('comprador'), 'mb-2')} placeholder="Nombre del comprador (texto libre)" value={formData.compradorManual || ''}
                    onChange={e => { setFormData({...formData, compradorManual: e.target.value, clientCompradorId: e.target.value ? '' : formData.clientCompradorId}); setErrors(prev => ({...prev, comprador: false})); }} />
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Inmobiliaria Comprador</p>
                  <input className={inputCls('')} placeholder="Nombre de la inmobiliaria" value={formData.compradorInmobiliaria || ''}
                    onChange={e => setFormData({...formData, compradorInmobiliaria: e.target.value})} />
                </div>
              </div>
              {errors.comprador && <p className="text-xs text-red-500 font-medium">Seleccione un cliente o ingrese el nombre del comprador</p>}
            </div>

            {/* Propiedad */}
            <div>
              <label className={cn('block text-xs font-black uppercase tracking-widest mb-2', errors.propiedad || errors.propiedadManual ? 'text-red-500' : 'text-slate-400 dark:text-slate-500')}>Propiedad</label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => { setPropertyMode('existing'); setErrors(prev => ({...prev, propiedadManual: false})); }}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all', propertyMode === 'existing' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700')}>Existente</button>
                <button type="button" onClick={() => { setPropertyMode('manual'); setErrors(prev => ({...prev, propiedad: false})); }}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all', propertyMode === 'manual' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700')}>Manual / No creada</button>
              </div>
              {propertyMode === 'existing' ? (
                <div>
                  <SearchableSelect value={formData.propiedadId || ''}
                    onChange={val => { setFormData({...formData, propiedadId: val}); setErrors(prev => ({...prev, propiedad: false})); }}
                    options={properties.map(p => ({
                      value: p.id,
                      label: p.title || p.address,
                      subtitle: [p.address, p.zone, p.city].filter(Boolean).join(', ') + (p.propertyCode || p.code ? ` · Cód: ${p.propertyCode || p.code}` : '')
                    }))}
                    placeholder="Seleccionar Propiedad" allowEmpty={false} />
                  {selectedProperty && (
                    <div className={cn('mt-2 p-3 rounded-xl border text-xs space-y-1', errors.propiedad ? 'border-red-300 bg-red-50/30' : 'bg-blue-50/50 border-blue-100')}>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{selectedProperty.title}</p>
                      <p className="text-slate-600 dark:text-slate-400">{[selectedProperty.address, selectedProperty.zone, selectedProperty.city].filter(Boolean).join(', ')}</p>
                      {(selectedProperty.propertyLink || selectedProperty.externalLink) && (
                        <a href={selectedProperty.propertyLink || selectedProperty.externalLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">
                          {selectedProperty.propertyLink || selectedProperty.externalLink}
                        </a>
                      )}
                      {(selectedProperty.propertyCode || selectedProperty.code) && (
                        <p className="text-slate-400 dark:text-slate-500 font-mono">ID/Cód: {selectedProperty.propertyCode || selectedProperty.code}</p>
                      )}
                    </div>
                  )}
                  {errors.propiedad && <p className="text-xs text-red-500 font-medium mt-1">Seleccione una propiedad existente</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Dirección</label>
                    <input className={inputCls('propiedadManual')} value={formData.externalPropertyAddress || ''} onChange={e => { setFormData({...formData, externalPropertyAddress: e.target.value}); setErrors(prev => ({...prev, propiedadManual: false})); }} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Link</label>
                    <input className={inputCls('')} value={formData.externalPropertyLink || ''} onChange={e => setFormData({...formData, externalPropertyLink: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">ID / Código</label>
                    <input className={inputCls('')} value={formData.externalPropertyCode || ''} onChange={e => setFormData({...formData, externalPropertyCode: e.target.value})} />
                  </div>
                  {errors.propiedadManual && <p className="text-xs text-red-500 font-medium md:col-span-3">Completa al menos un dato de la propiedad manual</p>}
                </div>
              )}
            </div>

            {/* Propietario / Vendedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Propietario / Vendedor</label>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Seleccionar cliente</span>
                  <button type="button" onClick={() => setShowNewSellerForm(v => !v)}
                    className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center font-bold text-xs transition-all" title="Crear nuevo vendedor">+</button>
                </div>
                <SearchableSelect value={formData.propietarioId || ''} onChange={val => setFormData({...formData, propietarioId: val || undefined})}
                  options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone }))} placeholder="Seleccionar (opcional)" allowEmpty />
                {showNewSellerForm && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Nuevo Vendedor rápido</p>
                    <input className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 rounded-lg text-sm outline-none" placeholder="Nombre *" value={newSellerName} onChange={e => setNewSellerName(e.target.value)} />
                    <input className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 rounded-lg text-sm outline-none" placeholder="Teléfono" value={newSellerPhone} onChange={e => setNewSellerPhone(e.target.value)} />
                    <div className="flex gap-2">
                      <button type="button" onClick={handleCreateSeller} className="flex-1 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700">Crear y Seleccionar</button>
                      <button type="button" onClick={() => setShowNewSellerForm(false)} className="px-3 py-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
                    </div>
                  </div>
                )}
                <div className="mt-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">O ingresar nombre manual</p>
                  <input className={inputCls('')} placeholder="Nombre vendedor (texto libre)" value={formData.vendedorManual || ''}
                    onChange={e => setFormData({...formData, vendedorManual: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Agente / Vendedor Interno</label>
                <SearchableSelect value={formData.vendedorId || ''} onChange={val => setFormData({...formData, vendedorId: val || undefined})}
                  options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone }))} placeholder="Seleccionar agente (opcional)" allowEmpty />
                <div className="mt-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Inmobiliaria Vendedor</p>
                  <input className={inputCls('')} placeholder="Nombre de la inmobiliaria" value={formData.vendedorInmobiliaria || ''}
                    onChange={e => setFormData({...formData, vendedorInmobiliaria: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Datos básicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Nombre de la operación</label>
                <input className={inputCls('')} value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Fecha</label>
                <input type="date" className={inputCls('')} value={formData.fecha || ''} onChange={e => setFormData({...formData, fecha: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Inmo / Agente (texto)</label>
                <input className={inputCls('')} value={formData.inmoAgente || ''} onChange={e => setFormData({...formData, inmoAgente: e.target.value})} />
              </div>
            </div>

            {/* Precios */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'precioPublicado', label: 'Precio Publicado', required: true, numeric: true },
                { key: 'valorOfertado', label: 'Valor Ofertado', required: false, numeric: false },
                { key: 'contraoferta1', label: 'Contraoferta 1', required: false, numeric: false },
                { key: 'contraoferta2', label: 'Contraoferta 2', required: false, numeric: false },
                { key: 'valorCierre', label: 'Valor Cierre', required: false, numeric: true },
                { key: 'comisionEstimada', label: 'Comisión Estimada', required: false, numeric: true },
                { key: 'puntas', label: 'Puntas', required: false, numeric: true },
                { key: 'presupuesto', label: 'Presupuesto', required: false, numeric: true },
              ].map(field => (
                <div key={field.key}>
                  <label className={cn('block text-[10px] font-black uppercase tracking-widest mb-1', errors[field.key] ? 'text-red-500' : 'text-slate-400 dark:text-slate-500')}>{field.label}{field.required ? ' *' : ''}</label>
                  <input
                    type={field.numeric ? 'number' : 'text'}
                    className={inputCls(field.key)}
                    value={(formData as Record<string, unknown>)[field.key] as string | number ?? ''}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({...formData, [field.key]: field.numeric ? (val ? Number(val) : undefined) : (val || undefined)});
                      if (field.required) setErrors(prev => ({...prev, [field.key]: false}));
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Porcentajes y comisiones */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'porcentajeBruto', label: '% Bruto' },
                { key: 'porcentajeNeto', label: '% Neto' },
                { key: 'porcentajeReferido', label: '% Referido' },
                { key: 'grossCommissionUsd', label: 'Comisión bruta USD' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{field.label}</label>
                  <input type="number" className={inputCls('')} value={(formData as Record<string, unknown>)[field.key] as number ?? ''}
                    onChange={e => setFormData({...formData, [field.key]: e.target.value ? Number(e.target.value) : undefined})} />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Monto Escritura</label>
                <input type="text" className={inputCls('')} value={(formData as Record<string, unknown>).montoEscritura as string ?? ''}
                  onChange={e => setFormData({...formData, montoEscritura: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Cobrada</label>
                <div className="flex items-center h-[42px]">
                  <button type="button" onClick={() => setFormData({...formData, isCollected: !formData.isCollected})}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all', formData.isCollected ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700')}>
                    {formData.isCollected ? 'Sí' : 'No'}
                  </button>
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Fecha Reserva</label>
                <input type="date" className={inputCls('')} value={formData.fechaReserva || ''} onChange={e => setFormData({...formData, fechaReserva: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Fecha Escritura</label>
                <input type="date" className={inputCls('')} value={formData.fechaEscritura || ''} onChange={e => setFormData({...formData, fechaEscritura: e.target.value})} />
              </div>
            </div>

            {/* Escribanía y Moneda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Escribanía</label>
                <input className={inputCls('')} value={formData.escribania || ''} onChange={e => setFormData({...formData, escribania: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Moneda *</label>
                <div className="flex gap-2">
                  {(['USD', 'ARS'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setFormData({...formData, moneda: m})}
                      className={cn('flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all', formData.moneda === m ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700')}>{m}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Notas / Info Extra</label>
              <textarea rows={3} className={inputCls('')} placeholder="Condiciones, observaciones..." value={formData.notas || ''} onChange={e => setFormData({...formData, notas: e.target.value})} />
            </div>
          </div>

          <div className="mt-10 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 border-none text-white shadow-lg shadow-blue-500/25">{sale ? 'Guardar Cambios' : 'Registrar Operación'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
