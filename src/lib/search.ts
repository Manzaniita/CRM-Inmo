import type { Client, Property, Sale, Rental, Document, Task, ReferredColleague } from '../types';
import { normalizeSearchText } from './utils';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'cliente' | 'propiedad' | 'venta' | 'alquiler' | 'documento' | 'tarea' | 'colega';
  path: string;
}

interface SearchData {
  clients: Client[];
  properties: Property[];
  sales: Sale[];
  rentals: Rental[];
  documents: Document[];
  tasks: Task[];
  referredColleagues: ReferredColleague[];
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
    const buyerName = buyer?.name || 'Comprador';
    const propTitle = prop?.title || s.externalPropertyAddress || s.propiedadId;
    if (
      matches(s.id) ||
      matches(buyerName) ||
      matches(propTitle) ||
      matches(s.estado) ||
      matches(s.externalPropertyAddress) ||
      matches(s.externalPropertyLink) ||
      matches(s.externalPropertyCode)
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

  // Alquileres
  data.rentals.forEach((r) => {
    const tenant = data.clients.find((c) => c.id === r.inquilinoId);
    const prop = data.properties.find((p) => p.id === r.propiedadId);
    const tenantName = tenant?.name || 'Inquilino';
    const propTitle = prop?.title || r.propiedadId;
    if (
      matches(r.id) ||
      matches(tenantName) ||
      matches(propTitle) ||
      matches(r.estado)
    ) {
      found.push({
        id: r.id,
        title: `Alquiler #${r.id.toUpperCase()}`,
        subtitle: `${tenantName} · ${propTitle} · ${r.estado}`,
        type: 'alquiler',
        path: '/alquileres',
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

  // Documentos
  data.documents.forEach((d) => {
    if (
      matches(d.name) ||
      matches(d.type) ||
      matches(d.status)
    ) {
      found.push({
        id: d.id,
        title: d.name,
        subtitle: `${d.type} · ${d.status}`,
        type: 'documento',
        path: '/documentos',
      });
    }
  });

  // Tareas
  data.tasks.forEach((t) => {
    if (
      matches(t.title) ||
      matches(t.description) ||
      matches(t.status) ||
      matches(t.priority)
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
