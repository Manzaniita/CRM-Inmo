import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Rental, RentalStatus, Client, Property } from '../types';
import { useAppContext } from '../context/AppContext';
import Badge from './Badge';
import Button from './Button';
import { Card } from './Card';
import SearchableSelect from './SearchableSelect';
import { cn, formatCurrency, formatDate } from '../lib/utils';

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
  const { showToast } = useAppContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<Rental>>(rental || {
    inquilinoId: defaultClientId || '',
    propiedadId: defaultPropertyId || '',
    propietarioId: '',
    estado: 'consulta',
    montoMensual: 0,
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

  const inquilino = clients.find(c => c.id === (formData.inquilinoId || rental?.inquilinoId));
  const propiedad = properties.find(p => p.id === (formData.propiedadId || rental?.propiedadId));

  const getStatusVariant = (status: string): any => {
    const map: Record<string, any> = {
      'en curso': 'green', firmado: 'blue', finalizado: 'gray',
      cancelado: 'red', renovacion: 'orange', contrato: 'purple'
    };
    return map[status] || 'blue';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.inquilinoId) return showToast('Debes seleccionar un inquilino', 'error');
    if (!formData.propiedadId) return showToast('Debes seleccionar una propiedad', 'error');
    const now = new Date().toISOString().split('T')[0];
    if (rental) {
      onSave({ ...rental, ...(formData as Rental), fechaActualizacion: now });
    } else {
      onSave({ ...(formData as Rental), id: `r${Date.now()}`, fechaCreacion: now, fechaActualizacion: now });
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
        <div className="bg-white rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="green">Alquiler</Badge>
                <Badge variant={getStatusVariant(rental.estado)}>{rental.estado}</Badge>
              </div>
              <h2 className="font-black text-2xl text-gray-900">{propiedad?.title || 'Propiedad'}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 bg-green-50/50 rounded-2xl border border-green-100">
                  <p className="text-[10px] font-black text-green-600/60 uppercase tracking-widest mb-1">Monto Mensual</p>
                  <p className="text-lg font-black text-green-700">{formatCurrency(rental.montoMensual, rental.moneda)}</p>
                </div>
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mb-1">Deposito</p>
                  <p className="text-lg font-black text-blue-700">{formatCurrency(rental.deposito, rental.moneda)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 border-gray-100 bg-gray-50/20">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Inquilino</p>
                  <p className="text-sm font-bold text-gray-900">{inquilino?.name || 'Sin asignar'}</p>
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
                <span className="text-xs font-bold text-gray-500">Inicio: {formatDate(rental.fechaInicio)}</span>
                <span className="text-xs font-bold text-red-600">Fin: {formatDate(rental.fechaFin)}</span>
              </div>
              <p className="text-gray-600 text-sm italic leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
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
      <div className="bg-white rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="font-black text-xl text-gray-900">{rental ? 'Editar Alquiler' : 'Nuevo Alquiler'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="space-y-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Estado *</label>
              <div className="flex flex-wrap gap-2">
                {RENTAL_STAGES.map(s => (
                  <button key={s} type="button" onClick={() => setFormData({...formData, estado: s})}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all border',
                      formData.estado === s ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                    )}>{s}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Inquilino *</label>
                <SearchableSelect
                  placeholder="Seleccionar inquilino..."
                  value={formData.inquilinoId}
                  onChange={value => setFormData({...formData, inquilinoId: value})}
                  options={clientOptions}
                  emptyLabel="Seleccionar Cliente"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Propiedad *</label>
                <SearchableSelect
                  placeholder="Seleccionar propiedad..."
                  value={formData.propiedadId}
                  onChange={value => setFormData({...formData, propiedadId: value})}
                  options={propertyOptions}
                  emptyLabel="Seleccionar Propiedad"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Moneda</label>
                <div className="flex gap-2">
                  {(['USD', 'ARS'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setFormData({...formData, moneda: m})}
                      className={cn('flex-1 py-2.5 rounded-xl text-sm font-bold border',
                        formData.moneda === m ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200')}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Dia de Pago (1-31)</label>
                <input type="number" min="1" max="31" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  value={formData.diaPago} onChange={e => setFormData({...formData, diaPago: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Monto Mensual</label>
                <input type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  value={formData.montoMensual} onChange={e => setFormData({...formData, montoMensual: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Deposito</label>
                <input type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  value={formData.deposito} onChange={e => setFormData({...formData, deposito: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Comision</label>
                <input type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  value={formData.comision} onChange={e => setFormData({...formData, comision: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Fecha Inicio</label>
                <input type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Fecha Fin</label>
                <input type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  value={formData.fechaFin} onChange={e => setFormData({...formData, fechaFin: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notas</label>
              <textarea rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                placeholder="Condiciones especiales, garantias..." value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} />
            </div>
          </div>
          <div className="mt-10 flex gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-50">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1">{rental ? 'Guardar Cambios' : 'Registrar Alquiler'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}