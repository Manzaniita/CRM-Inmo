import React, { useState } from 'react';
import { 
  Key, 
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
  Activity
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Card, StatCard } from '../components/Card';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { generateId } from '../lib/id';
import { validateRental } from '../lib/validators';
import { Rental, RentalStatus } from '../types';

const STAGES: RentalStatus[] = [
  'consulta', 'visita', 'documentación', 'aprobado', 'contrato', 'firmado', 'en curso', 'renovación'
];

export default function Rentals() {
  const { rentals, clients, properties, tasks, events, addRental, updateRental, deleteRental } = useAppContext();
  const [view, setView] = useState<'pipeline' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'fechaInicio' | 'fechaFin' | ''>('');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);

  const filteredRentals = rentals.filter(rental => {
    const property = properties.find(p => p.id === rental.propiedadId);
    const client = clients.find(c => c.id === rental.inquilinoId);
    const matchesSearch = 
      property?.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || rental.estado === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortKey === 'fechaInicio') return a.fechaInicio.localeCompare(b.fechaInicio);
    if (sortKey === 'fechaFin') return a.fechaFin.localeCompare(b.fechaFin);
    return 0;
  });

  const stats = {
    active: rentals.filter(r => r.estado === 'en curso').length,
    expiringSoon: rentals.filter(r => {
      if (r.estado !== 'en curso') return false;
      const end = new Date(r.fechaFin);
      const now = new Date();
      const diff = (end.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diff > 0 && diff <= 60; // next 2 months
    }).length,
    negotiation: rentals.filter(r => ['consulta', 'visita', 'documentación', 'aprobado'].includes(r.estado)).length,
    totalCommissions: rentals.reduce((acc, r) => acc + (r.moneda === 'ARS' ? r.comision : 0), 0), // Simplified to ARS
  };

  const getStatusVariant = (status: string): any => {
    switch (status) {
      case 'en curso': return 'green';
      case 'firmado': return 'blue';
      case 'finalizado': return 'gray';
      case 'cancelado': return 'red';
      case 'renovación': return 'orange';
      case 'contrato': return 'purple';
      default: return 'blue';
    }
  };

  const handleOpenDetail = (rental: Rental) => {
    setSelectedRental(rental);
    setIsDetailOpen(true);
  };

  const handleOpenForm = (rental?: Rental) => {
    setEditingRental(rental || null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Alquileres</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestión de contratos de alquiler vigentes y vencimientos.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setView('pipeline')}
              className={cn("p-1.5 rounded-md transition-all", view === 'pipeline' ? "bg-blue-100 text-blue-700" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50")}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn("p-1.5 rounded-md transition-all", view === 'list' ? "bg-blue-100 text-blue-700" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50")}
            >
              <ListIcon size={18} />
            </button>
          </div>
          <Button variant="primary" onClick={() => handleOpenForm()}>
            <Plus size={18} className="mr-2" /> Nuevo Contrato
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Alquileres Activos" value={stats.active.toString()} icon={Key} color="blue" />
        <StatCard label="Por Vencer (60d)" value={stats.expiringSoon.toString()} icon={Clock} color="orange" />
        <StatCard label="En Negociación" value={stats.negotiation.toString()} icon={Activity} color="purple" />
        <StatCard label="Comisiones (ARS)" value={formatCurrency(stats.totalCommissions, 'ARS')} icon={DollarSign} color="green" />
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar por inquilino, propiedad o ID..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            <option value="finalizado">Finalizado</option>
          </select>
          <select
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={sortKey}
            onChange={e => setSortKey(e.target.value as 'fechaInicio' | 'fechaFin' | '')}
          >
            <option value="">Ordenar por</option>
            <option value="fechaInicio">Fecha de inicio</option>
            <option value="fechaFin">Fecha de vencimiento</option>
          </select>
          <Button variant="outline" size="sm">
            <Filter size={16} className="mr-2" /> Más filtros
          </Button>
        </div>
      </div>

      {view === 'pipeline' ? (
         <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-thin">
           {STAGES.map(stage => {
             const stageRentals = filteredRentals.filter(r => r.estado === stage);
             return (
               <div key={stage} className="flex-shrink-0 w-72 space-y-4">
                 <div className="flex items-center justify-between px-2">
                   <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stage}</h3>
                   <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{stageRentals.length}</span>
                 </div>
                 <div className="space-y-3">
                   {stageRentals.map(rental => {
                     const property = properties.find(p => p.id === rental.propiedadId);
                     const client = clients.find(c => c.id === rental.inquilinoId);
                     return (
                       <div key={rental.id} onClick={() => handleOpenDetail(rental)}>
                         <Card className="p-4 cursor-pointer hover:border-blue-300 transition-all active:scale-[0.98] group relative">
                           <div className="flex items-center justify-between mb-3">
                             <Badge size="xs" variant={getStatusVariant(rental.estado)}>{rental.estado}</Badge>
                             <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">#{rental.id.split('-')[0]}</p>
                           </div>
                           <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-1">
                             {property?.title || 'Propiedad desconocida'}
                           </h4>
                           <div className="flex items-center gap-2 mt-2">
                              <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center text-[10px] font-bold text-purple-600 uppercase">
                                 {client?.name.charAt(0)}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                {client?.name}
                              </p>
                           </div>
                           <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                             <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(rental.montoMensual, rental.moneda)}</p>
                             <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                               <ChevronRight size={14} />
                             </div>
                           </div>
                         </Card>
                       </div>
                     );
                   })}
                   {stageRentals.length === 0 && (
                     <div className="h-24 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                       <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase italic tracking-widest">Sin contratos</p>
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
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Inquilino / Propiedad</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Periodo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Monto Mensual</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRentals.map(rental => {
                   const property = properties.find(p => p.id === rental.propiedadId);
                   const client = clients.find(c => c.id === rental.inquilinoId);
                   return (
                    <tr key={rental.id} className="hover:bg-slate-50 dark:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => handleOpenDetail(rental)}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                          {property?.address}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                           <User size={10} /> {client?.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatDate(rental.fechaInicio)}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">al {formatDate(rental.fechaFin)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {formatCurrency(rental.montoMensual, rental.moneda)}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Día de pago: {rental.diaPago}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(rental.estado)}>{rental.estado}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><FileText size={18} /></button>
                          <button className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><ChevronRight size={20} /></button>
                        </div>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
            {filteredRentals.length === 0 && (
              <div className="py-20 text-center">
                 <AlertCircle size={40} className="mx-auto text-gray-200 mb-3" />
                 <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                   {searchTerm || filterStatus !== 'all'
                     ? 'No se encontraron contratos con los filtros actuales.'
                     : 'No hay contratos de alquiler cargados.'}
                 </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Rental Modals Implementation */}
      {isDetailOpen && selectedRental && (
        <RentalDetailModal 
          rental={selectedRental} 
          onClose={() => setIsDetailOpen(false)} 
          onEdit={() => { setIsDetailOpen(false); handleOpenForm(selectedRental); }}
        />
      )}

      {isFormOpen && (
        <RentalFormModal 
          rental={editingRental} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}

function RentalDetailModal({ rental, onClose, onEdit }: { rental: Rental, onClose: () => void, onEdit: () => void }) {
  const { clients, properties, tasks, events } = useAppContext();
  const property = properties.find(p => p.id === rental.propiedadId);
  const tenant = clients.find(c => c.id === rental.inquilinoId);
  const owner = clients.find(c => c.id === rental.propietarioId);

  const relatedTasks = tasks.filter(t => t.propertyId === rental.propiedadId && t.clientId === rental.inquilinoId);
  const relatedEvents = events.filter(e => e.propertyId === rental.propiedadId && e.clientId === rental.inquilinoId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div>
             <div className="flex items-center gap-2 mb-1">
               <Badge variant="green">Contrato de Alquiler</Badge>
               <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">#{rental.id.toUpperCase()}</span>
             </div>
             <h2 className="font-black text-2xl text-slate-900 dark:text-slate-100">{property?.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Estado del Contrato</p>
                       <p className="text-lg font-bold text-green-600 capitalize">{rental.estado}</p>
                    </div>
                    <div className="p-5 bg-green-50/50 rounded-2xl border border-green-100">
                       <p className="text-[10px] font-black text-green-600/60 uppercase tracking-widest mb-1">Monto Mensual</p>
                       <p className="text-lg font-black text-green-700">{formatCurrency(rental.montoMensual, rental.moneda)}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
                       <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Depósito en Garantía</p>
                       <p className="text-base font-black text-slate-700 dark:text-slate-300">{formatCurrency(rental.deposito, rental.moneda)}</p>
                    </Card>
                    <Card className="p-4 border-blue-100 bg-blue-50/20">
                       <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Comisión Honorarios</p>
                       <p className="text-base font-black text-blue-700">{formatCurrency(rental.comision, rental.moneda)}</p>
                    </Card>
                 </div>

                 <div className="space-y-4">
                    <h3 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                       <FileText size={18} className="text-blue-500" /> Notas y Condiciones
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm italic leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                       "{rental.notas || 'Sin notas adicionales.'}"
                    </p>
                 </div>

                 <div className="space-y-4">
                    <h3 className="font-black text-slate-900 dark:text-slate-100">Actividad Relacionada</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tareas del Contrato</p>
                          {relatedTasks.map(t => (
                             <div key={t.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                                <CheckCircle2 size={14} className={t.status === 'completada' ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'} />
                                <span className={cn("font-semibold", t.status === 'completada' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300')}>{t.title}</span>
                             </div>
                          ))}
                       </div>
                       <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Agenda / Visitas</p>
                          {relatedEvents.map(e => (
                             <div key={e.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                                <Calendar size={14} className="text-blue-500" />
                                <div>
                                   <p className="font-bold text-slate-700 dark:text-slate-300">{e.title}</p>
                                   <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(e.date)}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                 <div className="space-y-4">
                    <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">Participantes</h3>
                    <div className="space-y-3">
                       <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Inquilino</p>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">
                                {tenant?.name.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{tenant?.name}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{tenant?.phone}</p>
                             </div>
                          </div>
                       </div>
                       <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Propietario</p>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                {owner?.name.charAt(0) || 'P'}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{owner?.name || 'Propietario'}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{owner?.email || '-'}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">Vigencia y Pagos</h3>
                    <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50 space-y-4">
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Inicio:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{formatDate(rental.fechaInicio)}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Fin:</span>
                          <span className="font-bold text-red-600">{formatDate(rental.fechaFin)}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Día de pago:</span>
                          <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-black">Día {rental.diaPago}</span>
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 flex flex-col gap-2">
                    <Button variant="primary" className="w-full" onClick={onEdit}>Editar Contrato</Button>
                    <Button variant="outline" className="w-full">Generar Contrato PDF</Button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function RentalFormModal({ rental, onClose }: { rental: Rental | null, onClose: () => void }) {
  const { clients, properties, addRental, updateRental, showToast } = useAppContext();
  
  const [formData, setFormData] = useState<Partial<Rental>>(rental || {
    estado: 'consulta',
    moneda: 'ARS',
    montoMensual: 0,
    deposito: 0,
    comision: 0,
    diaPago: 1,
    notas: '',
    inquilinoId: '',
    propiedadId: '',
    propietarioId: '',
    locadorId: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.inquilinoId || !formData.propiedadId || !formData.estado) {
      return showToast('Por favor completa todos los campos obligatorios', 'error');
    }
    const validation = validateRental(formData);
    if (!validation.valid) {
      return showToast(validation.message || 'Error de validación', 'error');
    }

    const now = new Date().toISOString().split('T')[0];
    
    if (rental) {
      updateRental({
        ...rental,
        ...(formData as Rental),
        fechaActualizacion: now
      });
    } else {
      const newRental: Rental = {
        ...(formData as Rental),
        id: generateId('r'),
        fechaCreacion: now,
        fechaActualizacion: now
      };
      addRental(newRental);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <h2 className="font-black text-xl text-slate-900 dark:text-slate-100">{rental ? 'Editar Contrato' : 'Nuevo Contrato de Alquiler'}</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 scrollbar-thin">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                 <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Estado del Contrato *</label>
                 <div className="flex flex-wrap gap-2">
                    {STAGES.map(s => (
                       <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({...formData, estado: s})}
                          className={cn(
                             "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                             formData.estado === s 
                                ? "bg-green-600 text-white border-green-600 shadow-md shadow-green-200" 
                                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-green-300"
                          )}
                       >
                          {s}
                       </button>
                    ))}
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Inquilino *</label>
                 <select 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.inquilinoId}
                    onChange={e => setFormData({...formData, inquilinoId: e.target.value})}
                    required
                 >
                    <option value="">Seleccionar Cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Propiedad *</label>
                 <select 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.propiedadId}
                    onChange={e => setFormData({...formData, propiedadId: e.target.value})}
                    required
                 >
                    <option value="">Seleccionar Propiedad</option>
                    {properties.filter(p => p.operation === 'alquiler').map(p => <option key={p.id} value={p.id}>{p.address} ({p.code})</option>)}
                 </select>
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Locador (opcional)</label>
                 <select 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.locadorId || ''}
                    onChange={e => setFormData({...formData, locadorId: e.target.value})}
                 >
                    <option value="">Seleccionar Locador</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Moneda *</label>
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
                                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          )}
                       >
                          {m}
                       </button>
                    ))}
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Día de Pago (1-31)</label>
                 <input 
                    type="number" 
                    min="1" max="31"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.diaPago}
                    onChange={e => setFormData({...formData, diaPago: Number(e.target.value)})}
                 />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:col-span-2">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Monto Mensual</label>
                    <input 
                       type="number" 
                       className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                       value={formData.montoMensual}
                       onChange={e => setFormData({...formData, montoMensual: Number(e.target.value)})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Depósito</label>
                    <input 
                       type="number" 
                       className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                       value={formData.deposito}
                       onChange={e => setFormData({...formData, deposito: Number(e.target.value)})}
                    />
                 </div>
                 <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Comisión Honorarios</label>
                    <input 
                       type="number" 
                       className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-blue-600"
                       value={formData.comision}
                       onChange={e => setFormData({...formData, comision: Number(e.target.value)})}
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Fecha Inicio</label>
                 <input 
                    type="date" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.fechaInicio}
                    onChange={e => setFormData({...formData, fechaInicio: e.target.value})}
                 />
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Fecha Finalización</label>
                 <input 
                    type="date" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.fechaFin}
                    onChange={e => setFormData({...formData, fechaFin: e.target.value})}
                 />
              </div>

              <div className="md:col-span-2">
                 <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Notas del Contrato</label>
                 <textarea 
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Condiciones especiales, garantías, etc."
                    value={formData.notas}
                    onChange={e => setFormData({...formData, notas: e.target.value})}
                 />
              </div>
           </div>

           <div className="mt-10 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-800 pt-4 border-t border-gray-50">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button type="submit" variant="primary" className="flex-1">{rental ? 'Guardar Cambios' : 'Registrar Alquiler'}</Button>
           </div>
        </form>
      </div>
    </div>
  );
}
