import React, { useState } from 'react';
import {
  Store, Search, Copy, CheckCircle2, X, Tag
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Card } from '../components/Card';
import { cn, normalizeSearchText, formatCurrency } from '../lib/utils';
import { generateId } from '../lib/id';
import type { Property } from '../types';
import { useUIStore } from '../stores/uiStore';

type MarketplaceStatus = NonNullable<Property['marketplaceStatus']>;

const STATUS_LABELS: Record<MarketplaceStatus, string> = {
  no_publicada: 'No publicada',
  lista: 'Lista',
  publicada: 'Publicada',
  pausada: 'Pausada',
  error: 'Error'
};

const STATUS_VARIANT: Record<MarketplaceStatus, string> = {
  no_publicada: 'gray',
  lista: 'blue',
  publicada: 'green',
  pausada: 'orange',
  error: 'red'
};

export default function Marketplace() {
  const { properties, updateProperty } = useAppContext()
  const showToast = useUIStore(state => state.showToast);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const lowerSearch = normalizeSearchText(searchTerm);

  const filtered = properties.filter(p => {
    const matchesSearch = normalizeSearchText(p.title).includes(lowerSearch) ||
      normalizeSearchText(p.address).includes(lowerSearch);
    const mStatus = p.marketplaceStatus || 'no_publicada';
    const matchesStatus = !filterStatus || mStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const generateMarketplaceId = (prop: Property) => {
    const newId = `MP-${prop.code}-${Date.now().toString(36).toUpperCase()}`;
    updateProperty({ ...prop, marketplaceId: newId, marketplaceStatus: 'lista' });
    showToast('ID Marketplace generado', 'success');
  };

  const setStatus = (prop: Property, status: MarketplaceStatus) => {
    updateProperty({ ...prop, marketplaceStatus: status, marketplaceLastPublishedAt: status === 'publicada' ? new Date().toISOString() : prop.marketplaceLastPublishedAt });
    showToast(`Estado actualizado a ${STATUS_LABELS[status]}`, 'success');
  };

  const copyPublicationText = (prop: Property) => {
    const text = [
      prop.marketplaceTitle || prop.title,
      `📍 ${prop.address}, ${prop.zone}, ${prop.city}`,
      `💰 ${formatCurrency(prop.price, prop.currency)}`,
      prop.marketplaceDescription || prop.notes || '',
      'Contacto: inmobiliaria'
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(prop.id);
      setTimeout(() => setCopiedId(null), 2000);
      showToast('Texto copiado al portapapeles', 'success');
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Marketplace</h1>
          <p className="text-slate-500 dark:text-slate-400">Preparación de publicaciones para Facebook Marketplace.</p>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 font-medium">
        Publicación automática pendiente de integración. Por ahora podés copiar el texto preparado.
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar propiedad..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Store size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {searchTerm || filterStatus ? 'No se encontraron resultados.' : 'No hay propiedades cargadas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(prop => {
            const mStatus = prop.marketplaceStatus || 'no_publicada';
            return (
              <div key={prop.id}>
              <Card className="hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{prop.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{prop.address}, {prop.zone}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[mStatus] as any}>{STATUS_LABELS[mStatus]}</Badge>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{formatCurrency(prop.price, prop.currency)}</p>
                  {prop.marketplaceId ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Tag size={12} />
                      <span className="font-mono">{prop.marketplaceId}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">Sin ID Marketplace</p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                  {!prop.marketplaceId && (
                    <Button size="sm" variant="outline" onClick={() => generateMarketplaceId(prop)}>Generar ID</Button>
                  )}
                  {prop.marketplaceId && mStatus !== 'lista' && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(prop, 'lista')}>Marcar como lista</Button>
                  )}
                  {prop.marketplaceId && mStatus !== 'publicada' && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(prop, 'publicada')}>Marcar como publicada</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => copyPublicationText(prop)}>
                    {copiedId === prop.id ? <CheckCircle2 size={14} className="mr-1 text-green-500" /> : <Copy size={14} className="mr-1" />}
                    Copiar texto
                  </Button>
                </div>
              </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
