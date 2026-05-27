import type { Client, Property, Sale, Rental, Document, Task } from '../types';
import { normalizeSearchText } from './utils';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'cliente' | 'propiedad' | 'venta' | 'alquiler' | 'documento' | 'tarea';
  path: string;
}

interface SearchData {
  clients: Client[];
  properties: Property[];
  sales: Sale[];
  rentals: Rental[];
  documents: Document[];
  tasks: Task[];
}

export function searchAll(data: SearchData, query: string): SearchResultItem[] {
  const q = normalizeSearchText(query.trim());
  if (q.length < 2) return [];

  const found: SearchResultItem[] = [];
  const matches = (text: string | null | undefined) =>
    normalizeSearchText(text).includes(q);

  // Clientes
  data.clients.forEach((c) => {
    if (
      matches(c.name) ||
      matches(c.phone) ||
      matches(c.email)
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
    if (
      matches(p.title) ||
      matches(p.address) ||
      matches(p.city) ||
      matches(p.operation) ||
      matches(p.status)
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
    const propTitle = prop?.title || s.propiedadId;
    if (
      matches(s.id) ||
      matches(buyerName) ||
      matches(propTitle) ||
      matches(s.estado)
    ) {
      found.push({
        id: s.id,
        title: `Venta #${s.id.toUpperCase()}`,
        subtitle: `${buyerName} · ${propTitle} · ${s.estado}`,
        type: 'venta',
        path: '/ventas',
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
