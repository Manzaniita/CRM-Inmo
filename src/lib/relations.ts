import type { Client, Property, ReferredColleague, Task, CalendarEvent, Document, Sale, Rental } from '../types';

export interface RelationItem {
  id: string;
  title: string;
  subtitle?: string;
  route?: string;
}

export interface RelationGroup {
  label: string;
  items: RelationItem[];
}

export function getClientRelations(
  clientId: string,
  data: {
    properties: Property[];
    sales: Sale[];
    rentals: Rental[];
    tasks: Task[];
    events: CalendarEvent[];
    documents: Document[];
    referredColleagues: ReferredColleague[];
  }
): RelationGroup[] {
  const groups: RelationGroup[] = [];

  const ownedProperties = data.properties.filter(p => p.ownerId === clientId);
  if (ownedProperties.length > 0) {
    groups.push({
      label: 'Propiedades como dueño',
      items: ownedProperties.map(p => ({
        id: p.id,
        title: p.title,
        subtitle: `${p.address}, ${p.zone}`,
        route: `/propiedades/${p.id}`
      }))
    });
  }

  const boughtSales = data.sales.filter(s => s.clientCompradorId === clientId);
  if (boughtSales.length > 0) {
    groups.push({
      label: 'Compras / Reservas',
      items: boughtSales.map(s => ({
        id: s.id,
        title: `Venta: ${data.properties.find(p => p.id === s.propiedadId)?.title || s.propiedadId}`,
        subtitle: s.estado,
        route: `/reservometro`
      }))
    });
  }

  const rented = data.rentals.filter(r => r.inquilinoId === clientId);
  if (rented.length > 0) {
    groups.push({
      label: 'Alquileres',
      items: rented.map(r => ({
        id: r.id,
        title: `Alquiler: ${data.properties.find(p => p.id === r.propiedadId)?.title || r.propiedadId}`,
        subtitle: r.estado,
        route: `/alquileres`
      }))
    });
  }

  const clientTasks = data.tasks.filter(t => t.clientId === clientId);
  if (clientTasks.length > 0) {
    groups.push({
      label: 'Tareas asociadas',
      items: clientTasks.map(t => ({
        id: t.id,
        title: t.title,
        subtitle: t.status,
        route: `/tareas`
      }))
    });
  }

  const clientEvents = data.events.filter(e => e.clientId === clientId);
  if (clientEvents.length > 0) {
    groups.push({
      label: 'Eventos asociados',
      items: clientEvents.map(e => ({
        id: e.id,
        title: e.title,
        subtitle: `${e.date} ${e.time}`,
        route: `/agenda`
      }))
    });
  }

  const clientDocs = data.documents.filter(d => d.clientId === clientId);
  if (clientDocs.length > 0) {
    groups.push({
      label: 'Documentos asociados',
      items: clientDocs.map(d => ({
        id: d.id,
        title: d.name,
        subtitle: d.type,
        route: `/documentos`
      }))
    });
  }

  const client = data.referredColleagues.find(c => c.referredClientIds?.includes(clientId));
  if (client) {
    groups.push({
      label: 'Referido por colega',
      items: [{
        id: client.id,
        title: client.nombreApellido,
        subtitle: client.oficina,
        route: `/colegas-referidos`
      }]
    });
  }

  return groups;
}

export function getPropertyRelations(
  propertyId: string,
  data: {
    clients: Client[];
    properties: Property[];
    sales: Sale[];
    rentals: Rental[];
    tasks: Task[];
    events: CalendarEvent[];
    documents: Document[];
  }
): RelationGroup[] {
  const groups: RelationGroup[] = [];
  const property = data.properties.find(p => p.id === propertyId);

  const owner = data.clients.find(c => c.id === property?.ownerId);
  if (owner) {
    groups.push({
      label: 'Dueño',
      items: [{
        id: owner.id,
        title: owner.name,
        subtitle: owner.phone,
        route: `/clientes/${owner.id}`
      }]
    });
  }

  const propSales = data.sales.filter(s => s.propiedadId === propertyId);
  if (propSales.length > 0) {
    groups.push({
      label: 'Operaciones Reservómetro',
      items: propSales.map(s => {
        const buyer = data.clients.find(c => c.id === s.clientCompradorId);
        return {
          id: s.id,
          title: `Venta: ${buyer?.name || 'Sin comprador'}`,
          subtitle: s.estado,
          route: `/reservometro`
        };
      })
    });
  }

  // Manual sales linked by externalPropertyCode matching propertyCode
  if (property?.propertyCode || property?.code) {
    const manualSales = data.sales.filter(s =>
      !s.propiedadId && s.externalPropertyCode &&
      (s.externalPropertyCode === property.propertyCode || s.externalPropertyCode === property.code)
    );
    if (manualSales.length > 0) {
      groups.push({
        label: 'Operaciones manuales vinculadas',
        items: manualSales.map(s => ({
          id: s.id,
          title: `Venta manual: ${s.externalPropertyAddress || s.id}`,
          subtitle: s.estado,
          route: `/reservometro`
        }))
      });
    }
  }

  const rental = data.rentals.find(r => r.propiedadId === propertyId);
  if (rental) {
    const tenant = data.clients.find(c => c.id === rental.inquilinoId);
    if (tenant) {
      groups.push({
        label: 'Inquilino',
        items: [{
          id: tenant.id,
          title: tenant.name,
          subtitle: rental.estado,
          route: `/clientes/${tenant.id}`
        }]
      });
    }
  }

  const propTasks = data.tasks.filter(t => t.propertyId === propertyId);
  if (propTasks.length > 0) {
    groups.push({
      label: 'Tareas asociadas',
      items: propTasks.map(t => ({
        id: t.id,
        title: t.title,
        subtitle: t.status,
        route: `/tareas`
      }))
    });
  }

  const propEvents = data.events.filter(e => e.propertyId === propertyId);
  if (propEvents.length > 0) {
    groups.push({
      label: 'Eventos asociados',
      items: propEvents.map(e => ({
        id: e.id,
        title: e.title,
        subtitle: `${e.date} ${e.time}`,
        route: `/agenda`
      }))
    });
  }

  const propDocs = data.documents.filter(d => d.propertyId === propertyId);
  if (propDocs.length > 0) {
    groups.push({
      label: 'Documentos asociados',
      items: propDocs.map(d => ({
        id: d.id,
        title: d.name,
        subtitle: d.type,
        route: `/documentos`
      }))
    });
  }

  return groups;
}

export function getColleagueRelations(
  colleagueId: string,
  data: {
    clients: Client[];
    properties: Property[];
    sales: Sale[];
    rentals: Rental[];
    referredColleagues: ReferredColleague[];
  }
): RelationGroup[] {
  const groups: RelationGroup[] = [];
  const colleague = data.referredColleagues.find(c => c.id === colleagueId);
  if (!colleague) return groups;

  const referredClients = (colleague.referredClientIds || [])
    .map(cid => data.clients.find(c => c.id === cid))
    .filter(Boolean) as Client[];

  if (referredClients.length > 0) {
    groups.push({
      label: 'Clientes referidos',
      items: referredClients.map(c => ({
        id: c.id,
        title: c.name,
        subtitle: c.phone,
        route: `/clientes/${c.id}`
      }))
    });
  }

  if (colleague.propertyIds && colleague.propertyIds.length > 0) {
    const linkedProps = data.properties.filter(p => colleague.propertyIds?.includes(p.id));
    groups.push({
      label: 'Propiedades vinculadas',
      items: linkedProps.map(p => ({
        id: p.id,
        title: p.title,
        subtitle: p.address,
        route: `/propiedades/${p.id}`
      }))
    });
  }

  const relatedSales = data.sales.filter(s => s.vendedorId === colleagueId);
  if (relatedSales.length > 0) {
    groups.push({
      label: 'Operaciones vinculadas',
      items: relatedSales.map(s => ({
        id: s.id,
        title: `Venta: ${data.properties.find(p => p.id === s.propiedadId)?.title || s.propiedadId}`,
        subtitle: s.estado,
        route: `/reservometro`
      }))
    });
  }

  const clientPropertyIds = referredClients.flatMap(c =>
    data.properties.filter(p => p.ownerId === c.id).map(p => p.id)
  );
  const clientProperties = data.properties.filter(p => clientPropertyIds.includes(p.id));
  if (clientProperties.length > 0) {
    groups.push({
      label: 'Propiedades de clientes referidos',
      items: clientProperties.map(p => ({
        id: p.id,
        title: p.title,
        subtitle: p.address,
        route: `/propiedades/${p.id}`
      }))
    });
  }

  const clientSales = data.sales.filter(s =>
    referredClients.some(c => c.id === s.clientCompradorId)
  );
  if (clientSales.length > 0) {
    groups.push({
      label: 'Operaciones de clientes referidos',
      items: clientSales.map(s => ({
        id: s.id,
        title: `Venta: ${data.properties.find(p => p.id === s.propiedadId)?.title || s.propiedadId}`,
        subtitle: s.estado,
        route: `/reservometro`
      }))
    });
  }

  return groups;
}
