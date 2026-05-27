import React, { useState, useMemo } from 'react';
import {
  Gauge, Search, Plus, ChevronRight, Clock, DollarSign, Grid, List as ListIcon, X, ArrowUpDown, Edit3, Trash2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Card, StatCard } from '../components/Card';
import { cn, formatCurrency, formatDate, normalizeSearchText } from '../lib/utils';
import { generateId } from '../lib/id';
import { validateSale } from '../lib/validators';
import type { Sale, SaleStatus } from '../types';
import SearchableSelect from '../components/SearchableSelect';

const STAGES: SaleStatus[] = [
  'consulta', 'visita', 'oferta', 'negociación', 'reserva', 'boleto', 'escritura', 'vendida'
];

function getBestDate(sale: Sale): string {
  return sale.fecha || sale.fechaReserva || sale.fechaEscritura || sale.fechaActualizacion || sale.fechaCreacion || '';
}

export default function Reservometro() {
  const { sales, clients, properties, addSale, updateSale, deleteSale, showToast } = useAppContext();
  const [view, setView] = useState<'pipeline' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('fecha-desc');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const lowerSearch = normalizeSearchText(searchTerm);

  const filteredSales = useMemo(() => {
    let result = sales.filter(sale => {
      const property = properties.find(p => p.id === sale.propiedadId);
      const client = clients.find(c => c.id === sale.clientCompradorId);
      const matchesSearch = !lowerSearch ||
        normalizeSearchText(property?.address).includes(lowerSearch) ||
        normalizeSearchText(client?.name).includes(lowerSearch) ||
        normalizeSearchText(sale.nombre).includes(lowerSearch) ||
        normalizeSearchText(sale.id).includes(lowerSearch);
      const matchesStatus = filterStatus === 'all' || sale.estado === filterStatus;
      return matchesSearch && matchesStatus;
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
  }, [sales, lowerSearch, filterStatus, sortKey, sortDirection, clients, properties]);

  const stats = {
    active: sales.filter(s => !['vendida', 'caída'].includes(s.estado)).length,
    negotiation: sales.filter(s => ['oferta', 'negociación'].includes(s.estado)).length,
    reserved: sales.filter(s => s.estado === 'reserva').length,
    totalCommissions: sales
      .filter(s => s.estado === 'vendida')
      .reduce((acc, s) => acc + (s.moneda === 'ARS' ? s.comisionEstimada : 0), 0),
  };

  const getStatusVariant = (status: string): string => {
    switch (status) {
      case 'consulta': return 'blue';
      case 'visita': return 'blue';
      case 'oferta': return 'purple';
      case 'negociación': return 'orange';
      case 'reserva': return 'yellow';
      case 'boleto': return 'green';
      case 'escritura': return 'green';
      case 'vendida': return 'green';
      case 'caída': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservómetro</h1>
          <p className="text-gray-500">Gestión completa de reservas y operaciones de venta.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200">
            <button onClick={() => setView('pipeline')} className={cn("p-1.5 rounded-md transition-all", view === 'pipeline' ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-50")}><Grid size={18} /></button>
            <button onClick={() => setView('list')} className={cn("p-1.5 rounded-md transition-all", view === 'list' ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-50")}><ListIcon size={18} /></button>
          </div>
          <Button variant="primary" onClick={() => { setEditingSale(null); setIsFormOpen(true); }}>
            <Plus size={18} className="mr-2" /> Nueva Operación
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Activas" value={stats.active.toString()} icon={Gauge} color="blue" />
        <StatCard label="En Negociación" value={stats.negotiation.toString()} icon={Clock} color="orange" />
        <StatCard label="Reservadas" value={stats.reserved.toString()} icon={Gauge} color="purple" />
        <StatCard label="Comisiones (ARS)" value={formatCurrency(stats.totalCommissions, 'ARS')} icon={DollarSign} color="green" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por comprador, propiedad o ID..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            <option value="caída">Caída</option>
          </select>
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none" value={sortKey} onChange={e => setSortKey(e.target.value)}>
            <option value="fecha">Fecha (más próxima)</option>
            <option value="fecha-desc">Fecha (más lejana)</option>
            <option value="estado">Estado</option>
            <option value="comision">Comisión</option>
            <option value="precio">Precio</option>
          </select>
          <button onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors" title={sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}>
            <ArrowUpDown size={16} className={cn("transition-transform", sortDirection === 'asc' ? 'rotate-180' : '')} />
          </button>
        </div>
      </div>

      {view === 'pipeline' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-thin">
          {STAGES.map(stage => {
            const stageSales = filteredSales.filter(s => s.estado === stage);
            return (
              <div key={stage} className="flex-shrink-0 w-72 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{stage}</h3>
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{stageSales.length}</span>
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
                            <p className="text-[10px] font-bold text-gray-400 uppercase">#{sale.id}</p>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{sale.nombre || property?.title || 'Propiedad'}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase">{client?.name?.charAt(0) || '?'}</div>
                            <p className="text-[11px] text-gray-500 font-medium truncate">{client?.name || 'Sin comprador'}</p>
                          </div>
                          <div className="mt-2 pt-3 border-t border-gray-50 flex items-center justify-between">
                            <p className="text-sm font-black text-gray-900">{formatCurrency(sale.valorCierre || sale.precioAcordado || sale.precioPublicado, sale.moneda)}</p>
                            <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all"><ChevronRight size={14} /></div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 font-medium">{formatDate(getBestDate(sale))}</p>
                        </Card>
                      </div>
                    );
                  })}
                  {stageSales.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center bg-gray-50/50">
                      <p className="text-[10px] font-black text-gray-300 uppercase italic tracking-widest">Sin operaciones</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden shadow-sm border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operación</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Precios</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Comisión</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.map(sale => {
                  const property = properties.find(p => p.id === sale.propiedadId);
                  const client = clients.find(c => c.id === sale.clientCompradorId);
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => { setEditingSale(sale); setIsFormOpen(true); }}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{sale.nombre || property?.address || 'Propiedad'}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">{client?.name || 'Sin comprador'} • {property?.title || sale.propiedadId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-gray-700">Pub: {formatCurrency(sale.precioPublicado, sale.moneda)}</span>
                          {sale.valorOfertado !== undefined && <span className="text-blue-600 font-medium">Ofertado: {formatCurrency(sale.valorOfertado, sale.moneda)}</span>}
                          {sale.valorCierre !== undefined && <span className="text-green-600 font-medium">Cierre: {formatCurrency(sale.valorCierre, sale.moneda)}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-blue-600">{formatCurrency(sale.comisionEstimada, sale.moneda)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">{formatDate(getBestDate(sale))}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(sale.estado) as any}>{sale.estado}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={e => { e.stopPropagation(); setEditingSale(sale); setIsFormOpen(true); }}><Edit3 size={18} /></button>
                          <button className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" onClick={e => { e.stopPropagation(); if (confirm('¿Eliminar esta operación?')) deleteSale(sale.id); }}><Trash2 size={18} /></button>
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
                <p className="text-gray-500 font-medium tracking-tight">No se encontraron operaciones.</p>
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

function SaleFormModal({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  const { clients, properties, addSale, updateSale, showToast } = useAppContext();

  const [formData, setFormData] = useState<Partial<Sale>>(sale || {
    estado: 'consulta',
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
    inmoAgente: '',
    puntas: undefined,
    porcentajeBruto: undefined,
    porcentajeNeto: undefined,
    porcentajeReferido: undefined,
    fechaTomada: '',
    valorOfertado: undefined,
    contraoferta1: undefined,
    contraoferta2: undefined,
    valorCierre: undefined,
    escribania: '',
    montoEscritura: undefined,
    infoExtra: '',
    presupuesto: undefined,
    fechaCreacion: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientCompradorId || !formData.propiedadId || !formData.estado) {
      return showToast('Por favor completa todos los campos obligatorios', 'error');
    }
    const validation = validateSale(formData);
    if (!validation.valid) {
      return showToast(validation.message || 'Error de validación', 'error');
    }
    const now = new Date().toISOString().split('T')[0];
    if (sale) {
      updateSale({ ...sale, ...(formData as Sale), fechaActualizacion: now });
    } else {
      const newSale: Sale = { ...(formData as Sale), id: generateId('s'), fechaCreacion: now, fechaActualizacion: now };
      addSale(newSale);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-3xl w-full max-w-4xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="font-black text-xl text-gray-900">{sale ? 'Editar' : 'Nueva'} Operación</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="space-y-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Estado *</label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map(s => (
                  <button key={s} type="button" onClick={() => setFormData({...formData, estado: s})} className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-all border", formData.estado === s ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300")}>{s}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SearchableSelect label="Comprador *" value={formData.clientCompradorId || ''} onChange={val => setFormData({...formData, clientCompradorId: val})} options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone }))} placeholder="Seleccionar Cliente" allowEmpty={false} />
              </div>
              <div>
                <SearchableSelect label="Propiedad *" value={formData.propiedadId || ''} onChange={val => setFormData({...formData, propiedadId: val})} options={properties.filter(p => p.operation === 'venta').map(p => ({ value: p.id, label: p.address, subtitle: p.code }))} placeholder="Seleccionar Propiedad" allowEmpty={false} />
              </div>
              <div>
                <SearchableSelect label="Propietario" value={formData.propietarioId || ''} onChange={val => setFormData({...formData, propietarioId: val || undefined})} options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone }))} placeholder="Seleccionar propietario (opcional)" allowEmpty />
              </div>
              <div>
                <SearchableSelect label="Vendedor / Agente" value={formData.vendedorId || ''} onChange={val => setFormData({...formData, vendedorId: val || undefined})} options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone }))} placeholder="Seleccionar agente (opcional)" allowEmpty />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nombre de la operación</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-bold" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Fecha</label>
                <input type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.fecha || ''} onChange={e => setFormData({...formData, fecha: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Inmo / Agente (texto)</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.inmoAgente || ''} onChange={e => setFormData({...formData, inmoAgente: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'precioPublicado', label: 'Precio Publicado' },
                { key: 'valorOfertado', label: 'Valor Ofertado' },
                { key: 'contraoferta1', label: 'Contraoferta 1' },
                { key: 'contraoferta2', label: 'Contraoferta 2' },
                { key: 'valorCierre', label: 'Valor Cierre' },
                { key: 'comisionEstimada', label: 'Comisión Estimada' },
                { key: 'puntas', label: 'Puntas' },
                { key: 'presupuesto', label: 'Presupuesto' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{field.label}</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={(formData as any)[field.key] ?? ''} onChange={e => setFormData({...formData, [field.key]: e.target.value ? Number(e.target.value) : undefined})} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'porcentajeBruto', label: '% Bruto' },
                { key: 'porcentajeNeto', label: '% Neto' },
                { key: 'porcentajeReferido', label: '% Referido' },
                { key: 'montoEscritura', label: 'Monto Escritura' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{field.label}</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={(formData as any)[field.key] ?? ''} onChange={e => setFormData({...formData, [field.key]: e.target.value ? Number(e.target.value) : undefined})} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Fecha Tomada</label>
                <input type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.fechaTomada || ''} onChange={e => setFormData({...formData, fechaTomada: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Fecha Reserva</label>
                <input type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.fechaReserva || ''} onChange={e => setFormData({...formData, fechaReserva: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Fecha Escritura</label>
                <input type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.fechaEscritura || ''} onChange={e => setFormData({...formData, fechaEscritura: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Escribanía</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.escribania || ''} onChange={e => setFormData({...formData, escribania: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Moneda *</label>
                <div className="flex gap-2">
                  {['USD', 'ARS'].map(m => (
                    <button key={m} type="button" onClick={() => setFormData({...formData, moneda: m as any})} className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all", formData.moneda === m ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200")}>{m}</button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notas / Info Extra</label>
              <textarea rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Condiciones, observaciones..." value={formData.notas || ''} onChange={e => setFormData({...formData, notas: e.target.value})} />
            </div>
          </div>

          <div className="mt-10 flex gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-50">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1">{sale ? 'Guardar Cambios' : 'Registrar Operación'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
