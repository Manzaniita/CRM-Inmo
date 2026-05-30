import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Sale, SaleStatus, Client, Property } from '../types';
import { useAppContext } from '../context/AppContext';
import Badge from './Badge';
import Button from './Button';
import { Card } from './Card';
import SearchableSelect from './SearchableSelect';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { generateId } from '../lib/id';
import { validateSale } from '../lib/validators';

const SALE_STAGES: SaleStatus[] = [
  'consulta', 'visita', 'oferta', 'negociación', 'reserva', 'boleto', 'escritura', 'vendida', 'caída'
];

interface SaleModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  sale?: Sale;
  clients: Client[];
  properties: Property[];
  defaultClientId?: string;
  defaultPropertyId?: string;
  onClose: () => void;
  onSave: (sale: Sale) => void;
  onDelete?: (saleId: string) => void;
}

export default function SaleModal({
  isOpen,
  mode,
  sale,
  clients,
  properties,
  defaultClientId,
  defaultPropertyId,
  onClose,
  onSave,
  onDelete
}: SaleModalProps) {
  const { showToast } = useAppContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<Sale>>(sale || {
    clientCompradorId: defaultClientId || '',
    propiedadId: defaultPropertyId || '',
    propietarioId: '',
    vendedorId: '',
    estado: 'consulta',
    precioPublicado: 0,
    precioOfrecido: undefined,
    precioAcordado: undefined,
    moneda: 'USD',
    comisionEstimada: 0,
    fechaReserva: undefined,
    fechaEscritura: undefined,
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

  const comprador = clients.find(c => c.id === (formData.clientCompradorId || sale?.clientCompradorId));
  const propiedad = properties.find(p => p.id === (formData.propiedadId || sale?.propiedadId));
  const vendedor = clients.find(c => c.id === (formData.vendedorId || sale?.vendedorId));

  const getStatusVariant = (status: string): any => {
    const map: Record<string, any> = {
      vendida: 'green', reserva: 'orange', boleto: 'blue',
      escritura: 'purple', caída: 'red', negociación: 'yellow'
    };
    return map[status] || 'gray';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientCompradorId) return showToast('Debes seleccionar un comprador', 'error');
    if (!formData.propiedadId) return showToast('Debes seleccionar una propiedad', 'error');
    const validation = validateSale(formData);
    if (!validation.valid) {
      showToast(validation.message || 'Error de validación', 'error');
      return;
    }
    const now = new Date().toISOString().split('T')[0];
    if (sale) {
      onSave({ ...sale, ...(formData as Sale), fechaActualizacion: now });
    } else {
      onSave({ ...(formData as Sale), id: generateId('s'), fechaCreacion: now, fechaActualizacion: now });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!onDelete || !sale) return;
    if (!isDeleting) { setIsDeleting(true); return; }
    onDelete(sale.id);
    showToast('Venta eliminada', 'info');
    setIsDeleting(false);
    onClose();
  };

  if (mode === 'view' && sale) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="blue">Venta</Badge>
                <Badge variant={getStatusVariant(sale.estado)}>{sale.estado}</Badge>
              </div>
              <h2 className="font-black text-2xl text-slate-900 dark:text-slate-100">{propiedad?.title || 'Propiedad'}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mb-1">Precio Publicado</p>
                  <p className="text-lg font-black text-blue-700">{formatCurrency(sale.precioPublicado, sale.moneda)}</p>
                </div>
                <div className="p-5 bg-green-50/50 rounded-2xl border border-green-100">
                  <p className="text-[10px] font-black text-green-600/60 uppercase tracking-widest mb-1">Comisión</p>
                  <p className="text-lg font-black text-green-700">{formatCurrency(sale.comisionEstimada, sale.moneda)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Comprador</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{comprador?.name || 'Sin asignar'}</p>
                </Card>
                <Card className="p-4 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Vendedor</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{vendedor?.name || 'Sin vendedor asignado'}</p>
                </Card>
                <Card className="p-4 border-purple-100 bg-purple-50/20">
                  <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Propiedad</p>
                  <p className="text-sm font-bold text-purple-900">{propiedad?.title || 'No especificada'}</p>
                </Card>
              </div>
              {sale.precioAcordado != null && (
                <div className="p-4 bg-yellow-50/30 rounded-2xl border border-yellow-100/50">
                  <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest mb-1">Precio Acordado</p>
                  <p className="text-base font-black text-yellow-800">{formatCurrency(sale.precioAcordado, sale.moneda)}</p>
                </div>
              )}
              <p className="text-slate-600 dark:text-slate-400 text-sm italic leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                &quot;{sale.notas || 'Sin notas.'}&quot;
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              <Button variant="primary" className="w-full" onClick={onClose}>Cerrar</Button>
              <Button variant="outline" className={cn('w-full', isDeleting ? 'border-red-500 text-red-600 bg-red-50' : '')} onClick={handleDelete}>
                {isDeleting ? 'Confirmar Eliminación' : 'Eliminar Venta'}
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
          <h2 className="font-black text-xl text-slate-900 dark:text-slate-100">{sale ? 'Editar Venta' : 'Nueva Venta'}</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="space-y-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Estado *</label>
              <div className="flex flex-wrap gap-2">
                {SALE_STAGES.map(s => (
                  <button key={s} type="button" onClick={() => setFormData({...formData, estado: s})}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all border',
                      formData.estado === s ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    )}>{s}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Comprador *</label>
                <SearchableSelect
                  placeholder="Seleccionar comprador..."
                  value={formData.clientCompradorId}
                  onChange={value => setFormData({...formData, clientCompradorId: value})}
                  options={clientOptions}
                  emptyLabel="Seleccionar Cliente"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Propiedad *</label>
                <SearchableSelect
                  placeholder="Seleccionar propiedad..."
                  value={formData.propiedadId}
                  onChange={value => setFormData({...formData, propiedadId: value})}
                  options={propertyOptions}
                  emptyLabel="Seleccionar Propiedad"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Vendedor (opcional)</label>
                <SearchableSelect
                  placeholder="Seleccionar vendedor..."
                  value={formData.vendedorId}
                  onChange={value => setFormData({...formData, vendedorId: value})}
                  options={clientOptions}
                  emptyLabel="Seleccionar Vendedor"
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
              <div></div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Precio Publicado</label>
                <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  value={formData.precioPublicado} onChange={e => setFormData({...formData, precioPublicado: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Precio Ofrecido</label>
                <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  value={formData.precioOfrecido ?? ''} onChange={e => setFormData({...formData, precioOfrecido: e.target.value ? Number(e.target.value) : undefined})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Precio Acordado</label>
                <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  value={formData.precioAcordado ?? ''} onChange={e => setFormData({...formData, precioAcordado: e.target.value ? Number(e.target.value) : undefined})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Comisión</label>
                <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  value={formData.comisionEstimada} onChange={e => setFormData({...formData, comisionEstimada: Number(e.target.value)})} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Notas</label>
              <textarea rows={3} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                placeholder="Detalles de la operación..." value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} />
            </div>
          </div>
          <div className="mt-10 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 border-none text-white shadow-lg shadow-blue-500/25">{sale ? 'Guardar Cambios' : 'Registrar Venta'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}