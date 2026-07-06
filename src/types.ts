/**
 * Types for EstateCRM
 */

export type ClientType = string;
export type ClientStatus = string;
export type ClientOrigin = string;

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
  referredByClientId?: string;
  dashboardPinned?: boolean;
  dashboardArchived?: boolean;
  birthdate?: string;
}

export type PropertyType = string;
export type PropertyOperation = string;
export type PropertyStatus = string;

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
  isRecurring?: boolean;
  recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: string;
  source?: 'manual' | 'auto_birthday';
  googleCalendarEventId?: string;
}

export interface UserIntegration {
  user_id: string;
  provider: string;
  email: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: string;
  updated_at?: string;
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
  source?: 'manual' | 'auto_contract_renewal' | 'auto_birthday' | 'auto_post_sale';
  autoKey?: string;
  relatedEntities?: TaskRelatedEntity[];
  isRecurring?: boolean;
  recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: string;
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
  gastosOficina?: number;
  comisionNetaFinal?: number;
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
  clientId: string;
  propertyId: string;
  propietarioId?: string;
  locadorId?: string;
  monto: number;
  deposito: number;
  comision: number;
  moneda: 'USD' | 'ARS';
  fechaInicio: string;
  fechaFin: string;
  diaPago: number;
  estado: RentalStatus;
  notas: string;
  createdAt: string;
  fechaActualizacion: string;
}

export type DocumentType = 'DNI' | 'Escritura' | 'Contrato' | 'Reserva' | 'Boleto' | 'Garantía' | 'Recibo' | 'Comprobante' | 'Otro';
export type DocumentStatus = 'pendiente' | 'cargado' | 'revisado' | 'vencido';

export interface Document {
  id: string;
  nombre: string;
  tipo: DocumentType;
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
  url?: string;
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

export interface CustomOptionItem {
  id: string;
  label: string;
  color?: string;
}

export interface CustomOptions {
  clientTypes: CustomOptionItem[];
  clientStatuses: CustomOptionItem[];
  clientOrigins: CustomOptionItem[];
  propertyTypes: CustomOptionItem[];
  propertyStatuses: CustomOptionItem[];
  propertyOperations: CustomOptionItem[];
}

export const DEFAULT_CUSTOM_OPTIONS: CustomOptions = {
  clientTypes: [
    { id: 'comprador', label: 'Comprador', color: 'green' },
    { id: 'vendedor', label: 'Vendedor', color: 'blue' },
    { id: 'inquilino', label: 'Inquilino', color: 'orange' },
    { id: 'propietario', label: 'Propietario', color: 'purple' },
    { id: 'inversor', label: 'Inversor', color: 'yellow' },
    { id: 'interesado', label: 'Interesado', color: 'gray' },
  ],
  clientStatuses: [
    { id: 'nuevo', label: 'Nuevo', color: 'green' },
    { id: 'contactado', label: 'Contactado', color: 'blue' },
    { id: 'interesado', label: 'Interesado', color: 'orange' },
    { id: 'en seguimiento', label: 'En Seguimiento', color: 'purple' },
    { id: 'negociación', label: 'Negociación', color: 'yellow' },
    { id: 'cerrado', label: 'Cerrado', color: 'gray' },
    { id: 'perdido', label: 'Perdido', color: 'red' },
  ],
  clientOrigins: [
    { id: 'WhatsApp', label: 'WhatsApp' },
    { id: 'Instagram', label: 'Instagram' },
    { id: 'Web', label: 'Web' },
    { id: 'Referido', label: 'Referido' },
    { id: 'Llamada', label: 'Llamada' },
    { id: 'Oficina', label: 'Oficina' },
    { id: 'Marketplace', label: 'Marketplace' },
    { id: 'Manual', label: 'Manual' },
    { id: 'Otro', label: 'Otro' },
  ],
  propertyTypes: [
    { id: 'departamento', label: 'Departamento' },
    { id: 'casa', label: 'Casa' },
    { id: 'ph', label: 'PH' },
    { id: 'lote', label: 'Lote' },
    { id: 'local', label: 'Local' },
    { id: 'oficina', label: 'Oficina' },
    { id: 'campos', label: 'Campos' },
  ],
  propertyStatuses: [
    { id: 'disponible', label: 'Disponible', color: 'green' },
    { id: 'reservada', label: 'Reservada', color: 'orange' },
    { id: 'vendida', label: 'Vendida', color: 'red' },
    { id: 'alquilada', label: 'Alquilada', color: 'blue' },
    { id: 'pausada', label: 'Pausada', color: 'gray' },
    { id: 'vencida', label: 'Vencida', color: 'purple' },
    { id: 'en_seguimiento', label: 'En Seguimiento', color: 'purple' },
  ],
  propertyOperations: [
    { id: 'venta', label: 'Venta' },
    { id: 'alquiler', label: 'Alquiler' },
    { id: 'ambas', label: 'Ambas' },
  ],
};

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
  googleEmail?: string;
}
