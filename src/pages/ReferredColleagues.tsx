import React, { useState } from 'react';
import {
  Plus, Search, Briefcase, X, Trash2, Edit3, CheckCircle2, XCircle, Link2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { cn, normalizeSearchText } from '../lib/utils';
import { generateId } from '../lib/id';
import { validateReferredColleague } from '../lib/validators';
import { useRelationsDrawer } from '../context/RelationsDrawerContext';
import type { ReferredColleague } from '../types';

export default function ReferredColleagues() {
  const { referredColleagues, clients, properties, sales, rentals, tasks, events, documents, waitingRoom, buyers, activityLogs, addReferredColleague, updateReferredColleague, deleteReferredColleague, showToast } = useAppContext();
  const { openRelations } = useRelationsDrawer();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRespondio, setFilterRespondio] = useState<string>('');
  const [filterYaRefirio, setFilterYaRefirio] = useState<string>('');
  const [filterAprobado, setFilterAprobado] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingColleague, setEditingColleague] = useState<ReferredColleague | null>(null);

  const [formData, setFormData] = useState<Partial<ReferredColleague>>({
    nombreApellido: '',
    oficina: '',
    respondio: false,
    quienContacto: '',
    comoRespondio: undefined,
    yaRefirio: false,
    aQuien: '',
    primerContacto: '',
    toque1: '',
    toque2: '',
    toque3: '',
    toque4: '',
    toque5: '',
    toque6: '',
    propertyIds: [],
    referredClientIds: []
  });

  const lowerSearch = normalizeSearchText(searchTerm);

  const filtered = referredColleagues.filter(c => {
    const matchesSearch = normalizeSearchText(c.nombreApellido).includes(lowerSearch) ||
      normalizeSearchText(c.oficina).includes(lowerSearch) ||
      normalizeSearchText(c.aQuien || '').includes(lowerSearch);
    const matchesRespondio = filterRespondio === '' || String(c.respondio) === filterRespondio;
    const matchesYaRefirio = filterYaRefirio === '' || String(c.yaRefirio) === filterYaRefirio;
    const aprobado = typeof c.comoRespondio === 'number' && c.comoRespondio >= 7;
    const matchesAprobado = filterAprobado === '' || String(aprobado) === filterAprobado;
    return matchesSearch && matchesRespondio && matchesYaRefirio && matchesAprobado;
  });

  const openForm = (colleague?: ReferredColleague) => {
    if (colleague) {
      setEditingColleague(colleague);
      setFormData(colleague);
    } else {
      setEditingColleague(null);
      setFormData({
        nombreApellido: '',
        oficina: '',
        respondio: false,
        quienContacto: '',
        comoRespondio: undefined,
        yaRefirio: false,
        aQuien: '',
        primerContacto: '',
        toque1: '',
        toque2: '',
        toque3: '',
        toque4: '',
        toque5: '',
        toque6: '',
        propertyIds: [],
        referredClientIds: []
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateReferredColleague(formData);
    if (!validation.valid) {
      showToast(validation.message || 'Error de validación', 'error');
      return;
    }
    if (editingColleague) {
      updateReferredColleague({
        ...editingColleague,
        ...(formData as ReferredColleague),
        id: editingColleague.id,
        referredClientIds: editingColleague.referredClientIds || []
      });
    } else {
      addReferredColleague({
        ...(formData as ReferredColleague),
        id: generateId('col'),
        referredClientIds: (formData as ReferredColleague).referredClientIds || []
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este colega?')) {
      deleteReferredColleague(id);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Colegas Referidos</h1>
          <p className="text-gray-500">Seguimiento de colegas y referidos.</p>
        </div>
        <Button variant="primary" onClick={() => openForm()}>
          <Plus size={18} className="mr-2" /> Nuevo Colega
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, oficina o referido..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none" value={filterRespondio} onChange={e => setFilterRespondio(e.target.value)}>
            <option value="">Respondió</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none" value={filterYaRefirio} onChange={e => setFilterYaRefirio(e.target.value)}>
            <option value="">Ya refirió</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none" value={filterAprobado} onChange={e => setFilterAprobado(e.target.value)}>
            <option value="">Aprobado</option>
            <option value="true">Sí (≥7)</option>
            <option value="false">No (&lt;7)</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Briefcase size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">
            {searchTerm || filterRespondio || filterYaRefirio || filterAprobado ? 'No se encontraron resultados.' : 'No hay colegas cargados.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Oficina</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Resp.</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cómo</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Refirió</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Clientes referidos</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">A quién</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">1er contacto</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Toques</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => {
                const aprobado = typeof c.comoRespondio === 'number' && c.comoRespondio >= 7;
                return (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{c.nombreApellido}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.oficina}</td>
                    <td className="px-4 py-3">
                      {c.respondio ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-400" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className={cn("text-sm font-bold", aprobado ? "text-green-600" : "text-gray-500")}>{c.comoRespondio ?? '-'}</span>
                        {aprobado && <Badge variant="green" size="xs">OK</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.yaRefirio ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-300" />}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(c.referredClientIds && c.referredClientIds.length > 0)
                        ? c.referredClientIds.map(cid => clients.find(cl => cl.id === cid)?.name).filter(Boolean).join(', ')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.aQuien || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.primerContacto || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {[c.toque1, c.toque2, c.toque3, c.toque4, c.toque5, c.toque6].filter(Boolean).length}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={(e) => { e.stopPropagation(); openRelations('colleague', c.id); }} title="Ver vínculos">
                          <Link2 size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={() => openForm(c)} title="Editar">
                          <Edit3 size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" onClick={() => handleDelete(c.id)} title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="bg-white rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-xl text-gray-900">{editingColleague ? 'Editar' : 'Nuevo'} Colega</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre y apellido *</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.nombreApellido} onChange={e => setFormData({...formData, nombreApellido: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Oficina</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.oficina} onChange={e => setFormData({...formData, oficina: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Respondió</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={String(formData.respondio)} onChange={e => setFormData({...formData, respondio: e.target.value === 'true'})}>
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Quién contactó</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.quienContacto} onChange={e => setFormData({...formData, quienContacto: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Cómo respondió (1-10)</label>
                  <input type="number" min={1} max={10} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.comoRespondio ?? ''} onChange={e => setFormData({...formData, comoRespondio: e.target.value ? Number(e.target.value) : undefined})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ya refirió</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={String(formData.yaRefirio)} onChange={e => setFormData({...formData, yaRefirio: e.target.value === 'true'})}>
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">A quién refirió</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.aQuien} onChange={e => setFormData({...formData, aQuien: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Primer contacto</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.primerContacto} onChange={e => setFormData({...formData, primerContacto: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {['toque1','toque2','toque3','toque4','toque5','toque6'].map((t, i) => (
                  <div key={t}>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Toque {i+1}</label>
                    <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={(formData as any)[t] || ''} onChange={e => setFormData({...formData, [t]: e.target.value})} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="primary">{editingColleague ? 'Guardar' : 'Crear'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
