import React, { useState, useEffect } from 'react';
import {
  Plus, Search, ShoppingCart, X, Trash2, Edit3, Link2, MoreVertical, MessageCircle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useRelationsDrawer } from '../context/RelationsDrawerContext';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Card } from '../components/Card';
import { cn, normalizeSearchText, formatCurrency, generateWhatsAppLink, formatWhatsAppTemplate } from '../lib/utils';
import { generateId } from '../lib/id';
import { validateBuyer } from '../lib/validators';
import type { Buyer, BuyerStatus } from '../types';

const STATUS_VARIANT: Record<BuyerStatus, string> = {
  activo: 'green',
  pausado: 'gray',
  'compró': 'blue',
  'compro': 'blue',
  descartado: 'red',
  seguimiento: 'purple'
};

function BuyerOperationMenu({ buyer, onUpdate, onLog, showToast }: { buyer: Buyer; onUpdate: (b: Buyer) => void; onLog: (log: any) => void; showToast: (message: string, type: any) => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeStatus = (status: BuyerStatus) => {
    setOpen(false);
    onUpdate({ ...buyer, estado: status });
    onLog({ type: 'buyer', action: 'status_changed', title: `Comprador ${buyer.nombre} marcado como ${status}`, entityId: buyer.id });
    showToast(`Estado actualizado a ${status}`, 'success');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 text-xs font-medium">
          <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700" onClick={() => changeStatus('activo')}>Marcar como Activo</button>
          <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-blue-700" onClick={() => changeStatus('compro')}>Marcar como Compró</button>
          <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-700" onClick={() => changeStatus('descartado')}>Marcar como Descartado</button>
          <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-purple-700" onClick={() => changeStatus('seguimiento')}>Marcar como Seguimiento</button>
        </div>
      )}
    </div>
  );
}

export default function BuyersPage() {
  const { buyers, addBuyer, updateBuyer, deleteBuyer, profile, showToast, addActivityLog } = useAppContext();
  const { openRelations } = useRelationsDrawer();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);

  useEffect(() => {
    const buyerId = searchParams.get('buyerId');
    if (buyerId) {
      const buyer = buyers.find(b => b.id === buyerId);
      if (buyer) {
        setEditingBuyer(buyer);
        setFormData(buyer);
        setIsFormOpen(true);
      }
    }
  }, [searchParams, buyers]);

  const [formData, setFormData] = useState<Partial<Buyer>>({
    nombre: '',
    telefono: '',
    email: '',
    presupuestoMin: undefined,
    presupuestoMax: undefined,
    moneda: 'USD',
    zonaBuscada: '',
    tipoPropiedad: '',
    estado: 'activo',
    notas: '',
    createdAt: new Date().toISOString().split('T')[0]
  });

  const lowerSearch = normalizeSearchText(searchTerm);

  const filtered = buyers.filter(b => {
    const matchesSearch = normalizeSearchText(b.nombre).includes(lowerSearch) ||
      b.telefono.includes(searchTerm) ||
      normalizeSearchText(b.email).includes(lowerSearch);
    const matchesStatus = !filterStatus || b.estado === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const openForm = (buyer?: Buyer) => {
    if (buyer) {
      setEditingBuyer(buyer);
      setFormData({ ...buyer, estado: buyer.estado === 'compró' ? 'compro' : buyer.estado });
    } else {
      setEditingBuyer(null);
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        presupuestoMin: undefined,
        presupuestoMax: undefined,
        moneda: 'USD',
        zonaBuscada: '',
        tipoPropiedad: '',
        estado: 'activo',
        notas: '',
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateBuyer(formData);
    if (!validation.valid) {
      showToast(validation.message || 'Error de validación', 'error');
      return;
    }
    if (editingBuyer) {
      updateBuyer({ ...(formData as Buyer), id: editingBuyer.id });
    } else {
      addBuyer({ ...(formData as Buyer), id: generateId('b') });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este comprador?')) {
      deleteBuyer(id);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compradores</h1>
          <p className="text-gray-500">Gestión de compradores potenciales y demanda.</p>
        </div>
        <Button variant="primary" onClick={() => openForm()}>
          <Plus size={18} className="mr-2" /> Nuevo Comprador
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="compro">Compró</option>
            <option value="descartado">Descartado</option>
            <option value="seguimiento">Seguimiento</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">
            {searchTerm || filterStatus ? 'No se encontraron resultados.' : 'No hay compradores cargados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(buyer => (
            <div key={buyer.id}>
            <Card className="hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{buyer.nombre}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span>{buyer.telefono}</span>
                    <button
                      className="inline-flex items-center text-green-600 hover:text-green-700 hover:bg-green-50 rounded px-1 transition-colors"
                      onClick={e => {
                        e.stopPropagation();
                        const msg = formatWhatsAppTemplate(profile.templateBuyer, {
                          name: buyer.nombre,
                          agentName: profile.name,
                          title: '', address: '', price: '', link: ''
                        });
                        const link = generateWhatsAppLink(buyer.telefono, msg);
                        window.open(link, '_blank');
                      }}
                      title="Contactar por WhatsApp"
                    >
                      <MessageCircle size={12} className="mr-0.5" /> WhatsApp
                    </button>
                    <span>• {buyer.email}</span>
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[buyer.estado] as any}>{buyer.estado}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {buyer.presupuestoMin !== undefined && buyer.presupuestoMax !== undefined && (
                  <p className="text-gray-600">
                    <span className="font-semibold text-gray-800">Presupuesto:</span>{' '}
                    {formatCurrency(buyer.presupuestoMin, buyer.moneda)} - {formatCurrency(buyer.presupuestoMax, buyer.moneda)}
                  </p>
                )}
                {buyer.zonaBuscada && <p className="text-gray-600"><span className="font-semibold text-gray-800">Zona:</span> {buyer.zonaBuscada}</p>}
                {buyer.tipoPropiedad && <p className="text-gray-600"><span className="font-semibold text-gray-800">Tipo:</span> {buyer.tipoPropiedad}</p>}
                {buyer.notas && <p className="text-gray-500 text-xs italic">{buyer.notas}</p>}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                <BuyerOperationMenu buyer={buyer} onUpdate={updateBuyer} onLog={addActivityLog} showToast={showToast} />
                <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={() => openForm(buyer)} title="Editar">
                  <Edit3 size={16} />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={(e) => { e.stopPropagation(); openRelations('buyer', buyer.id); }} title="Ver vínculos">
                  <Link2 size={16} />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" onClick={() => handleDelete(buyer.id)} title="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-xl text-gray-900">{editingBuyer ? 'Editar' : 'Nuevo'} Comprador</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre *</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Presupuesto min</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.presupuestoMin ?? ''} onChange={e => setFormData({...formData, presupuestoMin: e.target.value ? Number(e.target.value) : undefined})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Presupuesto max</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.presupuestoMax ?? ''} onChange={e => setFormData({...formData, presupuestoMax: e.target.value ? Number(e.target.value) : undefined})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Moneda</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.moneda} onChange={e => setFormData({...formData, moneda: e.target.value as 'USD' | 'ARS'})}>
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Zona buscada</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.zonaBuscada} onChange={e => setFormData({...formData, zonaBuscada: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tipo propiedad</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.tipoPropiedad} onChange={e => setFormData({...formData, tipoPropiedad: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value as BuyerStatus})}>
                  <option value="activo">Activo</option>
                  <option value="compro">Compró</option>
                  <option value="descartado">Descartado</option>
                  <option value="seguimiento">Seguimiento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Notas</label>
                <textarea rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="primary">{editingBuyer ? 'Guardar' : 'Crear'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
