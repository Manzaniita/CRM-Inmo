
import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Grid,
  List as ListIcon,
  User,
  Home,
  CheckCircle2,
  X,
  Calendar,

  Activity,
  ArrowUpDown
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Card, StatCard } from '../components/Card';
import { cn, formatCurrency, formatDate, normalizeSearchText } from '../lib/utils';
import { Sale, SaleStatus } from '../types';
import SearchableSelect from '../components/SearchableSelect';

// Helper: get best available date for a sale
function getBestDate(sale: Sale): string {
  return sale.fechaReserva || sale.fechaEscritura || sale.fechaActualizacion || sale.fechaCreacion || '';
}

const STAGES: SaleStatus[] = [
  'consulta', 'visita', 'oferta', 'negociación', 'reserva', 'boleto', 'escritura', 'vendida'
];

export default function Sales() {
  const { sales, clients, properties, tasks, events, addSale, updateSale, deleteSale } = useAppContext();
  const [view, setView] = useState<'pipeline' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('fecha-desc');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const lowerSearch = normalizeSearchText(searchTerm);











  const filteredSales = useMemo(() => {
    let result = sales.filter(sale => {
      const property = properties.find(p => p.id === sale.propiedadId);
      const client = clients.find(c => c.id === sale.clientCompradorId);
      const matchesSearch = !lowerSearch ||
        normalizeSearchText(property?.address).includes(lowerSearch) ||
        normalizeSearchText(client?.name).includes(lowerSearch) ||
        normalizeSearchText(sale.id).includes(lowerSearch);
      const matchesStatus = filterStatus === 'all' || sale.estado === filterStatus;
      return matchesSearch && matchesStatus;
    });

    // sorting
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
          compare = (a.precioAcordado || a.precioPublicado) - (b.precioAcordado || b.precioPublicado);
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

  const getStatusVariant = (status: string): any => {
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

  const handleOpenDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const handleOpenForm = (sale?: Sale) => {
    setEditingSale(sale || null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-500">Gestión de operaciones de venta en curso y concretadas.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setView('pipeline')}
              className={cn("p-1.5 rounded-md transition-all", view === 'pipeline' ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-50")}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn("p-1.5 rounded-md transition-all", view === 'list' ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-50")}
            >
              <ListIcon size={18} />
            </button>
          </div>
          <Button variant="primary" onClick={() => handleOpenForm()}>
            <Plus size={18} className="mr-2" /> Nueva Operación
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ventas Activas" value={stats.active.toString()} icon={TrendingUp} color="blue" />
        <StatCard label="En Negociación" value={stats.negotiation.toString()} icon={Clock} color="orange" />
        <StatCard label="Reservadas" value={stats.reserved.toString()} icon={Activity} color="purple" />
        <StatCard label="Comisiones (ARS)" value={formatCurrency(stats.totalCommissions, 'ARS')} icon={DollarSign} color="green" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por comprador, propiedad o ID..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            <option value="caída">Caída</option>
          </select>
          <select
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="fecha">Fecha (más próxima)</option>
            <option value="fecha-desc">Fecha (más lejana)</option>
            <option value="estado">Estado</option>
            <option value="comision">Comisión</option>
            <option value="precio">Precio</option>
          </select>
          <button
            onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            title={sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}
          >
            <ArrowUpDown size={16} className={cn("transition-transform", sortDirection === 'asc' ? 'rotate-180' : '')} />
          </button>
          <Button variant="outline" size="sm">
            <Filter size={16} className="mr-2" /> Más filtros
          </Button>
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
                      <div key={sale.id} onClick={() => handleOpenDetail(sale)}>
                        <Card className="p-4 cursor-pointer hover:border-blue-300 transition-all active:scale-[0.98] group relative">
                          <div className="flex items-center justify-between mb-3">
                            <Badge size="xs" variant={getStatusVariant(sale.estado)}>{sale.estado}</Badge>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">#{sale.id}</p>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {property?.title || 'Propiedad desconocida'}
                          </h4>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase">
                              {client?.name?.charAt(0) || '?'}
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium truncate">
                              {client?.name || 'Sin comprador'}
                            </p>
                          </div>

                          <div className="mt-2 pt-3 border-t border-gray-50 flex items-center justify-between">
                            <p className="text-sm font-black text-gray-900">{formatCurrency(sale.precioAcordado || sale.precioPublicado, sale.moneda)}</p>
                            <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                              <ChevronRight size={14} />
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 font-medium">
                            {formatDate(getBestDate(sale))}
                          </p>
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
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Comprador / Propiedad</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio</th>
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
                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenDetail(sale)}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {property?.address || 'Propiedad'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <User size={10} /> {client?.name || 'Sin comprador'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700">
                            Pub: {formatCurrency(sale.precioPublicado, sale.moneda)}
                          </span>
                          {sale.precioAcordado && (
                            <span className="text-[10px] text-green-600 font-medium">
                              Acordado: {formatCurrency(sale.precioAcordado, sale.moneda)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-blue-600">
                          {formatCurrency(sale.comisionEstimada, sale.moneda)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">{formatDate(getBestDate(sale))}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(sale.estado)}>{sale.estado}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><FileText size={18} /></button>
                          <button className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><ChevronRight size={20} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <div className="py-20 text-center">
                <AlertCircle size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium tracking-tight">No se encontraron operaciones de venta.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {isDetailOpen && selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setIsDetailOpen(false)}
          onEdit={() => { setIsDetailOpen(false); handleOpenForm(selectedSale); }}
        />
      )}

      {isFormOpen && (
        <SaleFormModal
          sale={editingSale}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}

function SaleDetailModal({ sale, onClose, onEdit }: { sale: Sale; onClose: () => void; onEdit: () => void }) {
  const { clients, properties, tasks, events } = useAppContext();
  const property = properties.find(p => p.id === sale.propiedadId);
  const buyer = clients.find(c => c.id === sale.clientCompradorId);
  const owner = clients.find(c => c.id === sale.propietarioId);

  const relatedTasks = tasks.filter(t => t.propertyId === sale.propiedadId && t.clientId === sale.clientCompradorId);
  const relatedEvents = events.filter(e => e.propertyId === sale.propiedadId && e.clientId === sale.clientCompradorId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-4xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="blue">Operación de Venta</Badge>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">#{sale.id.toUpperCase()}</span>
            </div>
            <h2 className="font-black text-2xl text-gray-900">{property?.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estado</p>
                  <p className="text-lg font-bold text-blue-600 capitalize">{sale.estado}</p>
                </div>
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mb-1">Precio Publicado</p>
                  <p className="text-lg font-black text-blue-700">{formatCurrency(sale.precioPublicado, sale.moneda)}</p>
                </div>
              </div>

              {(sale.precioOfrecido || sale.precioAcordado) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sale.precioOfrecido && (
                    <Card className="p-4 border-gray-100 bg-gray-50/20">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Oferta Recibida</p>
                      <p className="text-base font-black text-gray-700">{formatCurrency(sale.precioOfrecido, sale.moneda)}</p>
                    </Card>
                  )}
                  {sale.precioAcordado && (
                    <Card className="p-4 border-green-100 bg-green-50/20">
                      <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Precio Acordado</p>
                      <p className="text-base font-black text-green-700">{formatCurrency(sale.precioAcordado, sale.moneda)}</p>
                    </Card>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 border-gray-100 bg-gray-50/20">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Comisión Estimada</p>
                  <p className="text-base font-black text-gray-700">{formatCurrency(sale.comisionEstimada, sale.moneda)}</p>
                </Card>
                {sale.fechaReserva && (
                  <Card className="p-4 border-yellow-100 bg-yellow-50/20">
                    <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest mb-1">Fecha Reserva</p>
                    <p className="text-base font-black text-yellow-700">{formatDate(sale.fechaReserva)}</p>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-black text-gray-900 flex items-center gap-2">
                  <FileText size={18} className="text-blue-500" /> Notas
                </h3>
                <p className="text-gray-600 text-sm italic leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  "{sale.notas || 'Sin notas adicionales.'}"
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-black text-gray-900">Actividad Relacionada</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tareas</p>
                    {relatedTasks.map(t => (
                      <div key={t.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 text-xs">
                        <CheckCircle2 size={14} className={t.status === 'completada' ? 'text-green-500' : 'text-gray-300'} />
                        <span className={cn("font-semibold", t.status === 'completada' ? 'text-gray-400 line-through' : 'text-gray-700')}>{t.title}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agenda / Visitas</p>
                    {relatedEvents.map(e => (
                      <div key={e.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 text-xs">
                        <Calendar size={14} className="text-blue-500" />
                        <div>
                          <p className="font-bold text-gray-700">{e.title}</p>
                          <p className="text-[10px] text-gray-400">{formatDate(e.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-black text-gray-900 text-sm">Participantes</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Comprador</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                        {buyer?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{buyer?.name || 'Desconocido'}</p>
                        <p className="text-[10px] text-gray-500">{buyer?.phone || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Propietario</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {owner?.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{owner?.name || 'Propietario'}</p>
                        <p className="text-[10px] text-gray-500">{owner?.email || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-black text-gray-900 text-sm">Fechas Clave</h3>
                <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Creada:</span>
                    <span className="font-bold text-gray-900">{formatDate(sale.fechaCreacion)}</span>
                  </div>
                  {sale.fechaReserva && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Reserva:</span>
                      <span className="font-bold text-yellow-600">{formatDate(sale.fechaReserva)}</span>
                    </div>
                  )}
                  {sale.fechaEscritura && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Escritura:</span>
                      <span className="font-bold text-green-600">{formatDate(sale.fechaEscritura)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <Button variant="primary" className="w-full" onClick={onEdit}>Editar Operación</Button>
                <Button variant="outline" className="w-full">Generar Reserva PDF</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
    fechaCreacion: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientCompradorId || !formData.propiedadId || !formData.estado) {
      return showToast('Por favor completa todos los campos obligatorios', 'error');
    }

    const now = new Date().toISOString().split('T')[0];

    if (sale) {
      updateSale({
        ...sale,
        ...(formData as Sale),
        fechaActualizacion: now
      });
    } else {
      const newSale: Sale = {
        ...(formData as Sale),
        id: `s${Date.now()}`,
        fechaCreacion: now,
        fechaActualizacion: now
      };
      addSale(newSale);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="font-black text-xl text-gray-900">{sale ? 'Editar Operación' : 'Nueva Operación de Venta'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Estado *</label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({...formData, estado: s})}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                      formData.estado === s
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                        : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SearchableSelect
                label="Comprador *"
                value={formData.clientCompradorId || ''}
                onChange={val => setFormData({...formData, clientCompradorId: val})}
                options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone }))}
                placeholder="Seleccionar Cliente"
                allowEmpty={false}
              />
            </div>

            <div>
              <SearchableSelect
                label="Propiedad *"
                value={formData.propiedadId || ''}
                onChange={val => setFormData({...formData, propiedadId: val})}
                options={properties.filter(p => p.operation === 'venta').map(p => ({ value: p.id, label: p.address, subtitle: p.code }))}
                placeholder="Seleccionar Propiedad"
                allowEmpty={false}
              />
            </div>

            <div>
              <SearchableSelect
                label="Vendedor / Agente"
                value={formData.vendedorId || ''}
                onChange={val => setFormData({...formData, vendedorId: val || undefined})}
                options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone }))}
                placeholder="Seleccionar agente (opcional)"
                allowEmpty={true}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Moneda *</label>
              <div className="flex gap-2">
                {['USD', 'ARS'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormData({...formData, moneda: m as any})}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all",
                      formData.moneda === m
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-500 border-gray-200"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:col-span-2">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Precio Publicado</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  value={formData.precioPublicado}
                  onChange={e => setFormData({...formData, precioPublicado: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Oferta Recibida</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.precioOfrecido || ''}
                  onChange={e => setFormData({...formData, precioOfrecido: e.target.value ? Number(e.target.value) : undefined})}
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Comisión Estimada</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-blue-600"
                  value={formData.comisionEstimada}
                  onChange={e => setFormData({...formData, comisionEstimada: Number(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Fecha Reserva</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.fechaReserva || ''}
                onChange={e => setFormData({...formData, fechaReserva: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Fecha Escritura</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.fechaEscritura || ''}
                onChange={e => setFormData({...formData, fechaEscritura: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notas</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Condiciones, observaciones..."
                value={formData.notas}
                onChange={e => setFormData({...formData, notas: e.target.value})}
              />
            </div>
          </div>

          <div className="mt-10 flex gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-50">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1">{sale ? 'Guardar Cambios' : 'Registrar Venta'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}