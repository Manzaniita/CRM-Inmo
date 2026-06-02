import type {
  Client,
  Property,
  ReferredColleague,
  Task,
  CalendarEvent,
  Document,
  Sale,
  ActivityLog,
  WaitingRoomEntry,
  Buyer
} from '../types';

export type RelationEntityType =
  | 'client'
  | 'property'
  | 'colleague'
  | 'buyer'
  | 'sale'
  | 'task'
  | 'event'
  | 'document'
  | 'marketplace'
  | 'waitingRoom';

export interface RelationItem {
  id: string;
  type: RelationEntityType;
  title: string;
  subtitle?: string;
  status?: string;
  date?: string;
  route?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface RelationGroup {
  id: string;
  title: string;
  count: number;
  items: RelationItem[];
}

interface AppData {
  clients: Client[];
  properties: Property[];
  sales: Sale[];
  tasks: Task[];
  events: CalendarEvent[];
  documents: Document[];
  referredColleagues: ReferredColleague[];
  waitingRoom: WaitingRoomEntry[];
  buyers: Buyer[];
  activityLogs: ActivityLog[];
}

function buildGroup(title: string, items: RelationItem[]): RelationGroup | null {
  if (items.length === 0) return null;
  return {
    id: title.toLowerCase().replace(/\s+/g, '_'),
    title,
    count: items.length,
    items
  };
}

function findClientName(clients: Client[], id?: string): string | undefined {
  if (!id) return undefined;
  return clients.find(c => c.id === id)?.name;
}

function findPropertyTitle(properties: Property[], id?: string): string | undefined {
  if (!id) return undefined;
  return properties.find(p => p.id === id)?.title;
}

function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/* ------------------------------------------------------------------ */
/*  CLIENT RELATIONS                                                   */
/* ------------------------------------------------------------------ */

export function getClientRelations(
  clientId: string,
  data: AppData
): RelationGroup[] {
  const groups: RelationGroup[] = [];
  const client = data.clients.find(c => c.id === clientId);
  if (!client || !client.name) return groups;

  // 1. Datos principales
  groups.push({
    id: 'datos_principales',
    title: 'Datos principales',
    count: 1,
    items: [{
      id: client.id,
      type: 'client',
      title: client.name,
      subtitle: [client.phone, client.email].filter(Boolean).join(' • '),
      status: client.status,
      metadata: {
        origen: client.origin,
        notas: client.notes || undefined
      }
    }]
  });

  // 2. Referido por
  const referrer = data.referredColleagues.find(c =>
    c.referredClientIds?.includes(clientId) || c.id === client.referredByColleagueId
  );
  if (referrer) {
    const g = buildGroup('Referido por', [{
      id: referrer.id,
      type: 'colleague',
      title: referrer.nombreApellido,
      subtitle: referrer.oficina,
      route: `/colegas-referidos?colleagueId=${referrer.id}`
    }]);
    if (g) groups.push(g);
  } else {
    groups.push({
      id: 'referido_por',
      title: 'Referido por',
      count: 0,
      items: []
    });
  }

  // 3. Propiedades donde es dueño
  const owned = data.properties.filter(p => p.ownerId === clientId);
  const ownedGroup = buildGroup('Propiedades como dueño', owned.map(p => ({
    id: p.id,
    type: 'property',
    title: p.title,
    subtitle: `${p.address}, ${p.zone}`,
    status: p.status,
    route: `/propiedades?propertyId=${p.id}`
  })));
  if (ownedGroup) groups.push(ownedGroup);

  // 4. Reservómetro / operaciones (comprador)
  const boughtSales = data.sales.filter(s => s.clientCompradorId === clientId);
  const asSeller = data.sales.filter(s => s.propietarioId === clientId);
  const saleItems: RelationItem[] = [
    ...boughtSales.map(s => ({
      id: s.id,
      type: 'sale' as RelationEntityType,
      title: `Compra: ${findPropertyTitle(data.properties, s.propiedadId) || s.externalPropertyAddress || s.id}`,
      subtitle: formatStatusLabel(s.estado),
      status: s.estado,
      route: `/reservometro?saleId=${s.id}` as string
    })),
    ...asSeller.map(s => ({
      id: s.id,
      type: 'sale' as RelationEntityType,
      title: `Venta (propietario): ${findPropertyTitle(data.properties, s.propiedadId) || s.externalPropertyAddress || s.id}`,
      subtitle: formatStatusLabel(s.estado),
      status: s.estado,
      route: `/reservometro?saleId=${s.id}` as string
    }))
  ];
  // Text-match fallback for sales without explicit IDs
  data.sales.forEach(s => {
    if (s.comprador && normalizeText(s.comprador) === normalizeText(client.name)) {
      if (!saleItems.find(i => i.id === s.id)) {
        saleItems.push({
          id: s.id,
          type: 'sale',
          title: `Coincidencia por texto: ${s.nombre || s.id}`,
          subtitle: `${formatStatusLabel(s.estado)} — ${s.comprador}`,
          status: s.estado,
          route: `/reservometro?saleId=${s.id}`
        });
      }
    }
    if (s.vendedor && normalizeText(s.vendedor) === normalizeText(client.name)) {
      if (!saleItems.find(i => i.id === s.id)) {
        saleItems.push({
          id: s.id,
          type: 'sale',
          title: `Coincidencia por texto (vendedor): ${s.nombre || s.id}`,
          subtitle: `${formatStatusLabel(s.estado)} — ${s.vendedor}`,
          status: s.estado,
          route: `/reservometro?saleId=${s.id}`
        });
      }
    }
  });
  const salesGroup = buildGroup('Operaciones Reservómetro', saleItems);
  if (salesGroup) groups.push(salesGroup);

  // 5. Tareas
  const clientTasks = data.tasks.filter(t => t.clientId === clientId || t.relatedEntities?.some(r => r.type === 'client' && r.id === clientId));
  const taskGroup = buildGroup('Tareas', clientTasks.map(t => ({
    id: t.id,
    type: 'task',
    title: t.title,
    subtitle: t.status,
    status: t.status,
    route: `/tareas?taskId=${t.id}`
  })));
  if (taskGroup) groups.push(taskGroup);

  // 6. Agenda / Eventos
  const clientEvents = data.events.filter(e => e.clientId === clientId);
  const eventGroup = buildGroup('Eventos', clientEvents.map(e => ({
    id: e.id,
    type: 'event',
    title: e.title,
    subtitle: `${e.date} ${e.time}`,
    status: e.status,
    route: `/agenda?eventId=${e.id}`
  })));
  if (eventGroup) groups.push(eventGroup);

  // 7. Últimos movimientos
  const logs = data.activityLogs.filter(l =>
    l.entityId === clientId ||
    normalizeText(l.title).includes(normalizeText(client.name)) ||
    normalizeText(l.description || '').includes(normalizeText(client.name))
  ).slice(0, 15);
  const logGroup = buildGroup('Últimos movimientos', logs.map(l => ({
    id: l.id,
    type: 'client',
    title: l.title,
    subtitle: l.description || l.action,
    date: l.createdAt,
    metadata: { action: l.action, tipo: l.type }
  })));
  if (logGroup) groups.push(logGroup);

  return groups;
}

/* ------------------------------------------------------------------ */
/*  PROPERTY RELATIONS                                                 */
/* ------------------------------------------------------------------ */

export function getPropertyRelations(
  propertyId: string,
  data: AppData
): RelationGroup[] {
  const groups: RelationGroup[] = [];
  const property = data.properties.find(p => p.id === propertyId);
  if (!property || !property.title) return groups;

  // 1. Datos principales
  groups.push({
    id: 'datos_principales',
    title: 'Datos principales',
    count: 1,
    items: [{
      id: property.id,
      type: 'property',
      title: property.title,
      subtitle: `${property.address}, ${property.zone}`,
      status: property.status,
      metadata: {
        codigo: property.propertyCode || property.code,
        ubicacion: `${property.city}`,
        estado: property.status,
        operacion: property.operation,
        precio: `${property.price} ${property.currency}`,
        link: property.propertyLink || property.externalLink || undefined,
        tiempoRestante: property.contractEndDate || undefined
      }
    }]
  });

  // 2. Dueño
  const owner = data.clients.find(c => c.id === property.ownerId);
  if (owner) {
    const g = buildGroup('Dueño', [{
      id: owner.id,
      type: 'client',
      title: owner.name,
      subtitle: owner.phone,
      route: `/clientes?clientId=${owner.id}`
    }]);
    if (g) groups.push(g);
  }

  // 3. Reservómetro
  const propSales = data.sales.filter(s => s.propiedadId === propertyId);
  const manualSales = data.sales.filter(s => {
    if (s.propiedadId) return false;
    const code = property.propertyCode || property.code;
    return code && s.externalPropertyCode && s.externalPropertyCode === code;
  });
  const saleItems: RelationItem[] = [
    ...propSales.map(s => ({
      id: s.id,
      type: 'sale' as RelationEntityType,
      title: `Venta: ${findClientName(data.clients, s.clientCompradorId) || 'Sin comprador'}`,
      subtitle: formatStatusLabel(s.estado),
      status: s.estado,
      route: `/reservometro?saleId=${s.id}` as string
    })),
    ...manualSales.map(s => ({
      id: s.id,
      type: 'sale' as RelationEntityType,
      title: `Venta manual: ${s.externalPropertyAddress || s.id}`,
      subtitle: formatStatusLabel(s.estado),
      status: s.estado,
      route: `/reservometro?saleId=${s.id}` as string
    }))
  ];
  // Optional address match
  if (property.address) {
    data.sales.forEach(s => {
      if (s.externalPropertyAddress && normalizeText(s.externalPropertyAddress).includes(normalizeText(property.address))) {
        if (!saleItems.find(i => i.id === s.id)) {
          saleItems.push({
            id: s.id,
            type: 'sale',
            title: `Coincidencia por dirección: ${s.nombre || s.id}`,
            subtitle: s.externalPropertyAddress,
            status: s.estado,
            route: `/reservometro?saleId=${s.id}`
          });
        }
      }
    });
  }
  const salesGroup = buildGroup('Reservómetro', saleItems);
  if (salesGroup) groups.push(salesGroup);

  // 4. Marketplace
  if (property.marketplaceId || property.marketplaceStatus) {
    groups.push({
      id: 'marketplace',
      title: 'Marketplace',
      count: 1,
      items: [{
        id: property.marketplaceId || property.id,
        type: 'marketplace',
        title: property.marketplaceTitle || property.title,
        subtitle: property.marketplaceStatus || 'Sin estado',
        status: property.marketplaceStatus || undefined,
        date: property.marketplaceLastPublishedAt,
        route: '/marketplace'
      }]
    });
  }

  // 5. Tareas
  const propTasks = data.tasks.filter(t =>
    t.propertyId === propertyId || t.clientId === property.ownerId || t.relatedEntities?.some(r => r.type === 'property' && r.id === propertyId)
  );
  const taskGroup = buildGroup('Tareas', propTasks.map(t => ({
    id: t.id,
    type: 'task',
    title: t.title,
    subtitle: t.status,
    status: t.status,
    route: `/tareas?taskId=${t.id}`
  })));
  if (taskGroup) groups.push(taskGroup);

  // 6. Últimos movimientos
  const logs = data.activityLogs.filter(l =>
    l.entityId === propertyId ||
    normalizeText(l.title).includes(normalizeText(property.title)) ||
    normalizeText(l.title).includes(normalizeText(property.code)) ||
    normalizeText(l.description || '').includes(normalizeText(property.title))
  ).slice(0, 15);
  const logGroup = buildGroup('Últimos movimientos', logs.map(l => ({
    id: l.id,
    type: 'property',
    title: l.title,
    subtitle: l.description || l.action,
    date: l.createdAt,
    metadata: { action: l.action, tipo: l.type }
  })));
  if (logGroup) groups.push(logGroup);

  return groups;
}

/* ------------------------------------------------------------------ */
/*  COLLEAGUE RELATIONS                                                */
/* ------------------------------------------------------------------ */

export function getColleagueRelations(
  colleagueId: string,
  data: AppData
): RelationGroup[] {
  const groups: RelationGroup[] = [];
  const colleague = data.referredColleagues.find(c => c.id === colleagueId);
  if (!colleague || !colleague.nombreApellido) return groups;

  // 1. Datos principales
  groups.push({
    id: 'datos_principales',
    title: 'Datos principales',
    count: 1,
    items: [{
      id: colleague.id,
      type: 'colleague',
      title: colleague.nombreApellido,
      subtitle: colleague.oficina,
      route: `/colegas-referidos?colleagueId=${colleague.id}`,
      metadata: {
        respondio: colleague.respondio ? 'Sí' : 'No',
        quienContacto: colleague.quienContacto,
        comoRespondio: colleague.comoRespondio,
        aprueba: typeof colleague.comoRespondio === 'number' && colleague.comoRespondio >= 7 ? 'Sí' : 'No',
        yaRefirio: colleague.yaRefirio ? 'Sí' : 'No',
        aQuien: colleague.aQuien,
        primerContacto: colleague.primerContacto,
        toques: [colleague.toque1, colleague.toque2, colleague.toque3, colleague.toque4, colleague.toque5, colleague.toque6].filter(Boolean).length
      }
    }]
  });

  // 2. Clientes referidos
  const referredClients = (colleague.referredClientIds || [])
    .map(cid => data.clients.find(c => c.id === cid))
    .filter(Boolean) as Client[];
  // Also include clients whose referredByColleagueId points to this colleague
  data.clients.forEach(c => {
    if (c.referredByColleagueId === colleagueId && !referredClients.find(rc => rc.id === c.id)) {
      referredClients.push(c);
    }
  });
  const rcGroup = buildGroup('Clientes referidos', referredClients.map(c => ({
    id: c.id,
    type: 'client',
    title: c.name,
    subtitle: c.phone,
    route: `/clientes?clientId=${c.id}`
  })));
  if (rcGroup) groups.push(rcGroup);

  // 3. Propiedades asociadas
  const linkedPropIds = new Set(colleague.propertyIds || []);
  referredClients.forEach(c => {
    data.properties.filter(p => p.ownerId === c.id).forEach(p => linkedPropIds.add(p.id));
  });
  const linkedProps = data.properties.filter(p => linkedPropIds.has(p.id));
  const propGroup = buildGroup('Propiedades asociadas', linkedProps.map(p => ({
    id: p.id,
    type: 'property',
    title: p.title,
    subtitle: p.address,
    status: p.status,
    route: `/propiedades?propertyId=${p.id}`
  })));
  if (propGroup) groups.push(propGroup);

  // 4. Operaciones vinculadas
  const relatedSaleIds = new Set<string>();
  data.sales.forEach(s => {
    if (s.vendedorId === colleagueId) relatedSaleIds.add(s.id);
    if (referredClients.some(c => c.id === s.clientCompradorId)) relatedSaleIds.add(s.id);
    if (referredClients.some(c => c.id === s.propietarioId)) relatedSaleIds.add(s.id);
  });
  const relatedSales = data.sales.filter(s => relatedSaleIds.has(s.id));
  const opGroup = buildGroup('Operaciones vinculadas', relatedSales.map(s => ({
    id: s.id,
    type: 'sale',
    title: `Venta: ${findPropertyTitle(data.properties, s.propiedadId) || s.externalPropertyAddress || s.id}`,
    subtitle: formatStatusLabel(s.estado),
    status: s.estado,
    route: `/reservometro?saleId=${s.id}`
  })));
  if (opGroup) groups.push(opGroup);

  // 5. Tareas relacionadas
  const colleagueTasks = data.tasks.filter(t =>
    t.relatedEntities?.some(r => r.type === 'colleague' && r.id === colleagueId)
  );
  const taskGroup = buildGroup('Tareas', colleagueTasks.map(t => ({
    id: t.id,
    type: 'task',
    title: t.title,
    subtitle: t.status,
    status: t.status,
    route: `/tareas?taskId=${t.id}`
  })));
  if (taskGroup) groups.push(taskGroup);

  // 5. Últimos movimientos
  const logs = data.activityLogs.filter(l =>
    l.entityId === colleagueId ||
    normalizeText(l.title).includes(normalizeText(colleague.nombreApellido)) ||
    normalizeText(l.description || '').includes(normalizeText(colleague.nombreApellido))
  ).slice(0, 15);
  const logGroup = buildGroup('Últimos movimientos', logs.map(l => ({
    id: l.id,
    type: 'colleague',
    title: l.title,
    subtitle: l.description || l.action,
    date: l.createdAt,
    metadata: { action: l.action, tipo: l.type }
  })));
  if (logGroup) groups.push(logGroup);

  return groups;
}

/* ------------------------------------------------------------------ */
/*  SALE RELATIONS                                                     */
/* ------------------------------------------------------------------ */

export function getSaleRelations(
  saleId: string,
  data: AppData
): RelationGroup[] {
  const groups: RelationGroup[] = [];
  const sale = data.sales.find(s => s.id === saleId);
  if (!sale || !sale.estado) return groups;

  const property = data.properties.find(p => p.id === sale.propiedadId);
  const buyer = data.clients.find(c => c.id === sale.clientCompradorId);
  const seller = data.clients.find(c => c.id === sale.propietarioId);

  // 1. Datos principales
  groups.push({
    id: 'datos_principales',
    title: 'Datos principales',
    count: 1,
    items: [{
      id: sale.id,
      type: 'sale',
      title: sale.nombre || property?.title || sale.externalPropertyAddress || `Operación ${sale.id}`,
      subtitle: formatStatusLabel(sale.estado),
      status: sale.estado,
      metadata: {
        montoEscritura: sale.montoEscritura ? String(sale.montoEscritura) : undefined,
        valorCierre: sale.valorCierre,
        comisionBruta: sale.grossCommissionUsd,
        cobrada: sale.isCollected ? 'Sí' : 'No'
      }
    }]
  });

  // 2. Propiedad
  if (property) {
    const g = buildGroup('Propiedad', [{
      id: property.id,
      type: 'property',
      title: property.title,
      subtitle: property.address,
      status: property.status,
      route: `/propiedades?propertyId=${property.id}`
    }]);
    if (g) groups.push(g);
  } else if (sale.externalPropertyAddress) {
    const g = buildGroup('Propiedad manual', [{
      id: sale.id + '_manual',
      type: 'property',
      title: sale.externalPropertyAddress,
      subtitle: sale.externalPropertyCode || 'Sin código',
      route: `/reservometro?saleId=${sale.id}`
    }]);
    if (g) groups.push(g);
  }

  // 3. Comprador
  if (buyer) {
    const g = buildGroup('Comprador', [{
      id: buyer.id,
      type: 'client',
      title: buyer.name,
      subtitle: buyer.phone,
      route: `/clientes?clientId=${buyer.id}`
    }]);
    if (g) groups.push(g);
  }

  // 4. Vendedor / Propietario
  if (seller) {
    const g = buildGroup('Vendedor / Propietario', [{
      id: seller.id,
      type: 'client',
      title: seller.name,
      subtitle: seller.phone,
      route: `/clientes?clientId=${seller.id}`
    }]);
    if (g) groups.push(g);
  }

  // 5. Tareas relacionadas
  const saleTasks = data.tasks.filter(t =>
    t.relatedEntities?.some(r => r.type === 'sale' && r.id === saleId)
  );
  const taskGroup = buildGroup('Tareas', saleTasks.map(t => ({
    id: t.id,
    type: 'task',
    title: t.title,
    subtitle: t.status,
    status: t.status,
    route: `/tareas?taskId=${t.id}`
  })));
  if (taskGroup) groups.push(taskGroup);

  // 6. Últimos movimientos
  const logs = data.activityLogs.filter(l =>
    l.entityId === saleId ||
    normalizeText(l.title).includes(normalizeText(sale.nombre || '')) ||
    normalizeText(l.description || '').includes(normalizeText(sale.nombre || ''))
  ).slice(0, 15);
  const logGroup = buildGroup('Últimos movimientos', logs.map(l => ({
    id: l.id,
    type: 'sale',
    title: l.title,
    subtitle: l.description || l.action,
    date: l.createdAt,
    metadata: { action: l.action, tipo: l.type }
  })));
  if (logGroup) groups.push(logGroup);

  return groups;
}

/* ------------------------------------------------------------------ */
/*  BUYER RELATIONS                                                    */
/* ------------------------------------------------------------------ */

export function getBuyerRelations(
  buyerId: string,
  data: AppData
): RelationGroup[] {
  const groups: RelationGroup[] = [];
  const buyer = data.buyers.find(b => b.id === buyerId);
  if (!buyer || !buyer.nombre) return groups;

  // 1. Datos principales
  groups.push({
    id: 'datos_principales',
    title: 'Datos principales',
    count: 1,
    items: [{
      id: buyer.id,
      type: 'buyer',
      title: buyer.nombre,
      subtitle: [buyer.telefono, buyer.email].filter(Boolean).join(' • '),
      status: buyer.estado,
      route: `/compradores?buyerId=${buyer.id}`,
      metadata: {
        presupuesto: buyer.presupuestoMin && buyer.presupuestoMax
          ? `${buyer.presupuestoMin} - ${buyer.presupuestoMax} ${buyer.moneda}`
          : undefined,
        zona: buyer.zonaBuscada,
        tipo: buyer.tipoPropiedad
      }
    }]
  });

  // 2. Operaciones relacionadas
  const buyerSales = data.sales.filter(s => s.clientCompradorId === buyerId);
  const saleGroup = buildGroup('Operaciones', buyerSales.map(s => ({
    id: s.id,
    type: 'sale',
    title: s.nombre || data.properties.find(p => p.id === s.propiedadId)?.title || s.externalPropertyAddress || `Operación ${s.id}`,
    subtitle: formatStatusLabel(s.estado),
    status: s.estado,
    route: `/reservometro?saleId=${s.id}`
  })));
  if (saleGroup) groups.push(saleGroup);

  // 3. Tareas relacionadas
  const buyerTasks = data.tasks.filter(t =>
    t.relatedEntities?.some(r => r.type === 'buyer' && r.id === buyerId)
  );
  const taskGroup = buildGroup('Tareas', buyerTasks.map(t => ({
    id: t.id,
    type: 'task',
    title: t.title,
    subtitle: t.status,
    status: t.status,
    route: `/tareas?taskId=${t.id}`
  })));
  if (taskGroup) groups.push(taskGroup);

  // 4. Últimos movimientos
  const logs = data.activityLogs.filter(l =>
    l.entityId === buyerId ||
    normalizeText(l.title).includes(normalizeText(buyer.nombre)) ||
    normalizeText(l.description || '').includes(normalizeText(buyer.nombre))
  ).slice(0, 15);
  const logGroup = buildGroup('Últimos movimientos', logs.map(l => ({
    id: l.id,
    type: 'buyer',
    title: l.title,
    subtitle: l.description || l.action,
    date: l.createdAt,
    metadata: { action: l.action, tipo: l.type }
  })));
  if (logGroup) groups.push(logGroup);

  return groups;
}

/* ------------------------------------------------------------------ */
/*  UTILS                                                              */
/* ------------------------------------------------------------------ */

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
