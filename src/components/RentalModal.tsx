import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Rental, RentalStatus, Client, Property } from '../types';

import Badge from './Badge';
import Button from './Button';
import { Card } from './Card';
import SearchableSelect from './SearchableSelect';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { generateId } from '../lib/id';
import { validateRental } from '../lib/validators';
import { useUIStore } from '../stores/uiStore';

const RENTAL_STAGES: RentalStatus[] = [
  'consulta', 'visita', 'documentación', 'aprobado', 'contrato', 'firmado', 'en curso', 'renovación', 'finalizado', 'cancelado'
];

interface RentalModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  rental?: Rental;
  clients: Client[];
  properties: Property[];
  defaultClientId?: string;
  defaultPropertyId?: string;
  onClose: () => void;
  onSave: (rental: Rental) => void;
  onDelete?: (rentalId: string) => void;
}

export default function RentalModal({
  isOpen,
  mode,
  rental,
  clients,
  properties,
  defaultClientId,
  defaultPropertyId,
  onClose,
  onSave,
  onDelete
}: RentalModalProps) {
    const showToast = useUIStore(state => state.showToast);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<Rental>>(rental || {
    clientId: defaultClientId || '',
    propertyId: defaultPropertyId || '',
    propietarioId: '',
    locadorId: '',
    estado: 'consulta',
    monto: 0,
    deposito: 0,
    comision: 0,
    moneda: 'ARS',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
    diaPago: 1,
    notas: ''
  });

  const clientOptions = clients.map(c => ({
    value: c.id,
    label: c.name,
    subtitle: c.type || c.phone || undefined
  }));

  const propertyOptions = properties.map(p => ({
    value: p.id,
    label: p.title,
    subtitle: [p.address, p.zone].filter(Boolean).join(', ') || `Código: ${p.code}`
  }));

  const inquilino = clients.find(c => c.id === (formData.clientId || rental?.clientId));
  const propiedad = properties.find(p => p.id === (formData.propertyId || rental?.propertyId));
  const locador = clients.find(c => c.id === (formData.locadorId || rental?.locadorId));

  const getStatusVariant = (status: string): any => {
    const map: Record<string, any> = {
      'en curso': 'green', firmado: 'blue', finalizado: 'gray',
      cancelado: 'red', renovacion: 'orange', contrato: 'purple'
    };
    return map[status] || 'blue';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) return showToast('Debes seleccionar un inquilino', 'error');
    if (!formData.propertyId) return showToast('Debes seleccionar una propiedad', 'error');
    const validation = validateRental(formData);
    if (!validation.valid) {
      showToast(validation.message || 'Error de validación', 'error');
      return;
    }
    const now = new Date().toISOString().split('T')[0];
    if (rental) {
      onSave({ ...rental, ...(formData as Rental), fechaActualizacion: now });
    } else {
      onSave({ ...(formData as Rental), id: generateId('r'), createdAt: now, fechaActualizacion: now });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!onDelete || !rental) return;
    if (!isDeleting) { setIsDeleting(true); return; }
    onDelete(rental.id);
    showToast('Alquiler eliminado', 'info');
    setIsDeleting(false);
    onClose();
  };

  if (mode === 'view' && rental) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="green">Alquiler</Badge>
                <Badge variant={getStatusVariant(rental.estado)}>{rental.estado}</Badge>
              </div>
              <h2 className="font-black text-2xl text-slate-900 dark:text-slate-100">{propiedad?.title || 'Propiedad'}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 bg-green-50/50 rounded-2xl border border-green-100">
                  <p className="text-[10px] font-black text-green-600/60 uppercase tracking-widest mb-1">Monto Mensual</p>
                  <p className="text-lg font-black text-green-700">{formatCurrency(rental.monto, rental.moneda)}</p>
                </div>
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mb-1">Deposito</p>
                  <p className="text-lg font-black text-blue-700">{formatCurrency(rental.deposito, rental.moneda)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Inquilino</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{inquilino?.name || 'Sin asignar'}</p>
                </Card>
                <Card className="p-4 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Locador</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{locador?.name || 'Sin asignar'}</p>
                </Card>
                <Card className="p-4 border-purple-100 bg-purple-50/20">
                  <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Comision</p>
                  <p className="text-sm font-bold text-purple-900">{formatCurrency(rental.comision, rental.moneda)}</p>
                </Card>
                <Card className="p-4 border-purple-100 bg-purple-50/20">
                  <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Dia de Pago</p>
                  <p className="text-sm font-bold text-purple-900">Dia {rental.diaPago}</p>
                </Card>
              </div>
              <div className="flex items-center gap-6 p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Inicio: {formatDate(rental.fechaInicio)}</span>
                <span className="text-xs font-bold text-red-600">Fin: {formatDate(rental.fechaFin)}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm italic leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                &quot;{rental.notas || 'Sin notas.'}&quot;
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              <Button variant="primary" className="w-full" onClick={onClose}>Cerrar</Button>
              <Button variant="outline" className={cn('w-full', isDeleting ? 'border-red-500 text-red-600 bg-red-50' : '')} onClick={handleDelete}>
                {isDeleting ? 'Confirmar Eliminacion' : 'Eliminar Alquiler'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <h2 className="font-black text-xl text-slate-900 dark:text-slate-100">{rental ? 'Editar Alquiler' : 'Nuevo Alquiler'}</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="space-y-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Estado *</label>
              <div className="flex flex-wrap gap-2">
                {RENTAL_STAGES.map(s => (
                  <button key={s} type="button" onClick={() => setFormData({...formData, estado: s})}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all border',
                      formData.estado === s ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-green-300'
                    )}>{s}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Inquilino *</label>
                <SearchableSelect
                  placeholder="Seleccionar inquilino..."
                  value={formData.clientId}
                  onChange={value => setFormData({...formData, clientId: value})}
                  options={clientOptions}
                  emptyLabel="Seleccionar Cliente"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Propiedad *</label>
                <SearchableSelect
                  placeholder="Seleccionar propiedad..."
                  value={formData.propertyId}
                  onChange={value => setFormData({...formData, propertyId: value})}
                  options={propertyOptions}
                  emptyLabel="Seleccionar Propiedad"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Locador (opcional)</label>
                <SearchableSelect
                  placeholder="Seleccionar locador..."
                  value={formData.locadorId}
                  onChange={value => setFormData({...formData, locadorId: value})}
                  options={clientOptions}
                  emptyLabel="Seleccionar Locador"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Moneda</label>
                <div className="flex gap-2">
                  {(['USD', 'ARS'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setFormData({...formData, moneda: m})}
                      className={cn('flex-1 py-2.5 rounded-xl text-sm font-bold border',
                        formData.moneda === m ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700')}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Dia de Pago (1-31)</label>
                <input type="number" min="1" max="31" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  value={formData.diaPago} onChange={e => setFormData({...formData, diaPago: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Monto Mensual</label>
                <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  value={formData.monto} onChange={e => setFormData({...formData, monto: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Deposito</label>
                <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  value={formData.deposito} onChange={e => setFormData({...formData, deposito: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Comision</label>
                <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  value={formData.comision} onChange={e => setFormData({...formData, comision: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Fecha Inicio</label>
                <input type="date" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Fecha Fin</label>
                <input type="date" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  value={formData.fechaFin} onChange={e => setFormData({...formData, fechaFin: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Notas</label>
              <textarea rows={3} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                placeholder="Condiciones especiales, garantias..." value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} />
            </div>
          </div>
          <div className="mt-10 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 border-none text-white shadow-lg shadow-blue-500/25">{rental ? 'Guardar Cambios' : 'Registrar Alquiler'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}