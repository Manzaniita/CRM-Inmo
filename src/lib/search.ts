import type { Client, Property, Sale, Document, Task, ReferredColleague } from '../types';
import { normalizeSearchText } from './utils';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'cliente' | 'propiedad' | 'venta' | 'tarea' | 'colega';
  path: string;
}

interface SearchData {
  clients: Client[];
  properties: Property[];
  sales: Sale[];
  tasks: Task[];
  referredColleagues: ReferredColleague[];
  buyers: import('../types').Buyer[];
}

export function searchAll(data: SearchData, query: string): SearchResultItem[] {
  const q = normalizeSearchText(query.trim());
  if (q.length < 2) return [];

  const found: SearchResultItem[] = [];
  const matches = (text: string | null | undefined) =>
    normalizeSearchText(text).includes(q);

  // Clientes
  data.clients.forEach((c) => {
    const colleague = data.referredColleagues.find(col => col.id === c.referredByColleagueId);
    if (
      matches(c.name) ||
      matches(c.phone) ||
      matches(c.email) ||
      matches(c.referredByColleagueId) ||
      matches(colleague?.nombreApellido)
    ) {
      found.push({
        id: c.id,
        title: c.name,
        subtitle: `${c.phone || ''} · ${c.type}`,
        type: 'cliente',
        path: `/clientes/${c.id}`,
      });
    }
  });

  // Propiedades
  data.properties.forEach((p) => {
    const owner = data.clients.find(c => c.id === p.ownerId);
    if (
      matches(p.title) ||
      matches(p.address) ||
      matches(p.city) ||
      matches(p.operation) ||
      matches(p.status) ||
      matches(p.propertyCode) ||
      matches(p.propertyLink) ||
      matches(p.externalLink) ||
      matches(p.notes) ||
      matches(p.contractEndDate) ||
      matches(owner?.name)
    ) {
      found.push({
        id: p.id,
        title: p.title,
        subtitle: `${p.address}, ${p.city} · ${p.operation} · ${p.status}`,
        type: 'propiedad',
        path: `/propiedades/${p.id}`,
      });
    }
  });

  // Ventas
  data.sales.forEach((s) => {
    const buyer = data.clients.find((c) => c.id === s.clientCompradorId);
    const prop = data.properties.find((p) => p.id === s.propiedadId);
    const buyerName = buyer?.name || s.comprador || 'Comprador';
    const sellerName = data.clients.find((c) => c.id === s.propietarioId)?.name || s.vendedor || '';
    const agentName = s.inmoAgente || '';
    const propTitle = prop?.title || s.externalPropertyAddress || s.propiedadId;
    if (
      matches(s.id) ||
      matches(buyerName) ||
      matches(sellerName) ||
      matches(agentName) ||
      matches(propTitle) ||
      matches(s.estado) ||
      matches(s.operationStatus) ||
      matches(s.externalPropertyAddress) ||
      matches(s.externalPropertyLink) ||
      matches(s.externalPropertyCode) ||
      matches(String(s.montoEscritura || ''))
    ) {
      found.push({
        id: s.id,
        title: `Venta #${s.id.toUpperCase()}`,
        subtitle: `${buyerName} · ${propTitle} · ${s.estado}`,
        type: 'venta',
        path: '/reservometro',
      });
    }
  });

  // Compradores
  data.buyers.forEach((b) => {
    if (
      matches(b.nombre) ||
      matches(b.telefono) ||
      matches(b.email) ||
      matches(b.estado) ||
      matches(b.zonaBuscada) ||
      matches(b.tipoPropiedad)
    ) {
      found.push({
        id: b.id,
        title: b.nombre,
        subtitle: `${b.telefono} · ${b.estado}`,
        type: 'cliente',
        path: '/compradores',
      });
    }
  });

  // Colegas referidos
  data.referredColleagues.forEach((col) => {
    const clientNames = (col.referredClientIds || [])
      .map(cid => data.clients.find(c => c.id === cid)?.name)
      .filter(Boolean)
      .join(', ');
    if (
      matches(col.nombreApellido) ||
      matches(col.oficina) ||
      matches(clientNames)
    ) {
      found.push({
        id: col.id,
        title: col.nombreApellido,
        subtitle: `${col.oficina} · Referidos: ${clientNames || '—'}`,
        type: 'colega',
        path: '/colegas-referidos',
      });
    }
  });

  // Tareas
  data.tasks.forEach((t) => {
    const relatedNames = (t.relatedEntities || []).map(r => {
      if (r.type === 'client') return data.clients.find(c => c.id === r.id)?.name;
      if (r.type === 'property') return data.properties.find(p => p.id === r.id)?.title;
      if (r.type === 'sale') return `Operación ${r.id.slice(0, 6)}`;
      if (r.type === 'colleague') return data.referredColleagues.find(c => c.id === r.id)?.nombreApellido;
      if (r.type === 'buyer') return data.buyers.find(b => b.id === r.id)?.nombre;
      return '';
    }).filter(Boolean).join(', ');
    if (
      matches(t.title) ||
      matches(t.description) ||
      matches(t.status) ||
      matches(t.priority) ||
      matches(relatedNames)
    ) {
      found.push({
        id: t.id,
        title: t.title,
        subtitle: `${t.status} · ${t.priority}`,
        type: 'tarea',
        path: '/tareas',
      });
    }
  });

  return found.slice(0, 30);
}
