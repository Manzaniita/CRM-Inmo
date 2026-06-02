/**
 * Types for EstateCRM
 */

export type ClientType = 'comprador' | 'vendedor' | 'inquilino' | 'propietario' | 'inversor' | 'interesado';
export type ClientStatus = 'nuevo' | 'contactado' | 'interesado' | 'en seguimiento' | 'negociación' | 'cerrado' | 'perdido';
export type ClientOrigin = 'WhatsApp' | 'Instagram' | 'Web' | 'Referido' | 'Llamada' | 'Oficina' | 'Marketplace' | 'Manual' | 'Otro';

export interface EntityNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: ClientType;
  types?: ClientType[];
  status: ClientStatus;
  origin: ClientOrigin;
  budget?: number;
  currency?: 'USD' | 'ARS';
  interestZone?: string;
  propertyTypeInterest?: string;
  lastContact: string;
  notes: string;
  historyNotes?: EntityNote[];
  createdAt: string;
  profession?: string;
  referredBy?: string;
  referredByColleagueId?: string;
  dashboardPinned?: boolean;
  dashboardArchived?: boolean;
}

export type PropertyType = 'casa' | 'departamento' | 'local' | 'terreno' | 'oficina' | 'galpón' | 'cochera' | 'ph' | 'campos';
export type PropertyOperation = 'venta' | 'alquiler' | 'ambas';
export type PropertyStatus = 'disponible' | 'reservada' | 'vendida' | 'alquilada' | 'pausada' | 'vencida' | 'en_seguimiento';

export interface Property {
  id: string;
  code: string;
  title: string;
  type: PropertyType;
  operation: PropertyOperation;
  status: PropertyStatus;
  address: string;
  zone: string;
  city: string;
  price: number;
  currency: 'USD' | 'ARS';
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  externalLink?: string;
  propertyLink?: string;
  externalSource?: string;
  notes: string;
  historyNotes?: EntityNote[];
  ownerId?: string;
  images: string[];
  imageUrl?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  propertyCode?: string;
  marketplaceId?: string;
  marketplaceStatus?: 'no_publicada' | 'lista' | 'publicada' | 'pausada' | 'error';
  marketplaceTitle?: string;
  marketplaceDescription?: string;
  marketplaceLastPublishedAt?: string;
}

export type EventType = 'visita' | 'llamada' | 'reunión' | 'firma' | 'vencimiento' | 'seguimiento' | 'tasación' | 'entrega_de_llaves' | 'recordatorio';
export type EventStatus = 'pendiente' | 'realizado' | 'cancelado' | 'reprogramado';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  type: EventType;
  status: EventStatus;
  clientId?: string;
  propertyId?: string;
  notes?: string;
  createdAt: string;
}

export type TaskStatus = 'pendiente' | 'en proceso' | 'completada' | 'vencida' | 'reprogramado' | 'cancelada';
export type TaskPriority = 'baja' | 'media' | 'alta' | 'urgente';

export interface TaskRelatedEntity {
  type: 'client' | 'property' | 'colleague' | 'sale' | 'buyer';
  id: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  clientId?: string;
  propertyId?: string;
  notes?: string;
  createdAt: string;
  source?: 'manual' | 'auto_contract_renewal';
  autoKey?: string;
  relatedEntities?: TaskRelatedEntity[];
}

export type SaleStatus = 'activa' | 'vendida' | 'caída';

export interface Sale {
  id: string;
  clientCompradorId: string;
  propiedadId: string;
  propietarioId?: string;
  vendedorId?: string;
  precioPublicado: number;
  precioOfrecido?: number;
  precioAcordado?: number;
  moneda: 'USD' | 'ARS';
  comisionEstimada: number;
  fechaReserva?: string;
  fechaEscritura?: string;
  estado: SaleStatus;
  notas: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  // Campos extendidos Reservómetro
  nombre?: string;
  fecha?: string;
  vendedor?: string;
  comprador?: string;
  inmoAgente?: string;
  puntas?: number;
  porcentajeBruto?: number;
  porcentajeNeto?: number;
  porcentajeReferido?: number;
  valorOfertado?: string | number;
  contraoferta1?: string | number;
  contraoferta2?: string | number;
  valorCierre?: number;
  escribania?: string;
  montoEscritura?: string | number;
  isCollected?: boolean;
  grossCommissionUsd?: number;
  infoExtra?: string;
  presupuesto?: number;
  // Comprador/Vendedor extendido
  compradorManual?: string;
  vendedorManual?: string;
  compradorInmobiliaria?: string;
  vendedorInmobiliaria?: string;
  // Propiedad manual (sin vincular)
  externalPropertyAddress?: string;
  externalPropertyLink?: string;
  externalPropertyCode?: string;
}

export type RentalStatus = 'consulta' | 'visita' | 'documentación' | 'aprobado' | 'contrato' | 'firmado' | 'en curso' | 'renovación' | 'finalizado' | 'cancelado';

export interface Rental {
  id: string;
  inquilinoId: string;
  propiedadId: string;
  propietarioId?: string;
  locadorId?: string;
  montoMensual: number;
  deposito: number;
  comision: number;
  moneda: 'USD' | 'ARS';
  fechaInicio: string;
  fechaFin: string;
  diaPago: number;
  estado: RentalStatus;
  notas: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export type DocumentType = 'DNI' | 'Escritura' | 'Contrato' | 'Reserva' | 'Boleto' | 'Garantía' | 'Recibo' | 'Comprobante' | 'Otro';
export type DocumentStatus = 'pendiente' | 'cargado' | 'revisado' | 'vencido';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  clientId?: string;
  propertyId?: string;
  saleId?: string;
  rentalId?: string;
  uploadDate: string;
  notes?: string;
  fileName?: string;
  fileSize?: number;
  fileExtension?: string;
  simulatedUrl?: string;
}

export type WaitingRoomStatus = 'pendiente' | 'contactado' | 'descartado' | 'convertido';

export interface WaitingRoomEntry {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  interes: string;
  propiedadId?: string;
  estado: WaitingRoomStatus;
  fechaIngreso: string;
  notas: string;
}

export type BuyerStatus = 'activo' | 'pausado' | 'compró' | 'compro' | 'descartado' | 'seguimiento';

export interface Buyer {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  presupuestoMin?: number;
  presupuestoMax?: number;
  moneda?: 'USD' | 'ARS';
  zonaBuscada?: string;
  tipoPropiedad?: string;
  estado: BuyerStatus;
  notas: string;
  createdAt: string;
}

export interface ReferredColleague {
  id: string;
  nombreApellido: string;
  oficina: string;
  respondio: boolean;
  quienContacto?: string;
  comoRespondio?: number;
  yaRefirio: boolean;
  aQuien?: string;
  primerContacto?: string;
  toque1?: string;
  toque2?: string;
  toque3?: string;
  toque4?: string;
  toque5?: string;
  toque6?: string;
  propertyIds?: string[];
  referredClientIds?: string[];
}

export type ActivityLogType = 'client' | 'property' | 'task' | 'sale' | 'rental' | 'document' | 'event' | 'system' | 'waiting_room' | 'buyer' | 'colleague' | 'marketplace';
export type ActivityLogAction = 'created' | 'updated' | 'deleted' | 'status_changed';

export interface ActivityLog {
  id: string;
  type: ActivityLogType;
  action: ActivityLogAction;
  title: string;
  description?: string;
  createdAt: string;
  entityId?: string;
}

export interface Profile {
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  license: string;
  templateProperty: string;
  templateClient: string;
  templateBuyer: string;
  role?: 'agent' | 'superadmin';
  must_change_password?: boolean;
}
