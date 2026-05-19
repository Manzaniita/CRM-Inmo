/**
 * Types for ImmoFlow CRM
 */

export type ClientType = 'comprador' | 'vendedor' | 'inquilino' | 'propietario' | 'inversor' | 'interesado';
export type ClientStatus = 'nuevo' | 'contactado' | 'interesado' | 'en seguimiento' | 'negociación' | 'cerrado' | 'perdido';
export type ClientOrigin = 'WhatsApp' | 'Instagram' | 'Web' | 'Referido' | 'Llamada' | 'Oficina';

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
  status: ClientStatus;
  origin: ClientOrigin;
  budget?: number;
  currency: 'USD' | 'ARS';
  interestZone?: string;
  propertyTypeInterest?: string;
  lastContact: string;
  notes: string;
  historyNotes?: EntityNote[];
  createdAt: string;
}

export type PropertyType = 'casa' | 'departamento' | 'local' | 'terreno' | 'oficina' | 'galpón' | 'cochera';
export type PropertyOperation = 'venta' | 'alquiler';
export type PropertyStatus = 'disponible' | 'reservada' | 'vendida' | 'alquilada' | 'pausada';

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
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  externalLink?: string;
  externalSource?: string;
  notes: string;
  historyNotes?: EntityNote[];
  ownerId?: string;
  images: string[];
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

export type TaskStatus = 'pendiente' | 'en proceso' | 'completada' | 'vencida' | 'reprogramado';
export type TaskPriority = 'baja' | 'media' | 'alta' | 'urgente';

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
}

export type SaleStatus = 'consulta' | 'visita' | 'oferta' | 'negociación' | 'reserva' | 'boleto' | 'escritura' | 'vendida' | 'caída';

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
