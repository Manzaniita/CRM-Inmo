import type { Client, Property, Sale, Rental, Document, Task, WaitingRoomEntry, Buyer, ReferredColleague } from '../types';

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateClient(client: Partial<Client>): ValidationResult {
  if (!client.name || !client.name.trim()) {
    return { valid: false, message: 'El nombre del cliente es obligatorio.' };
  }
  const phone = client.phone?.trim() || '';
  const email = client.email?.trim() || '';
  if (!phone && !email) {
    return { valid: false, message: 'Debe ingresar al menos un teléfono o un email.' };
  }
  if (email && !isValidEmail(email)) {
    return { valid: false, message: 'El formato del email no es válido.' };
  }
  return { valid: true };
}

export function validateProperty(property: Partial<Property>): ValidationResult {
  if (typeof property.price === 'number' && property.price < 0) {
    return { valid: false, message: 'El precio no puede ser negativo.' };
  }
  return { valid: true };
}

export function validateSale(sale: Partial<Sale>): ValidationResult {
  const hasComprador = !!(sale.clientCompradorId || (sale.compradorManual && sale.compradorManual.trim()));
  if (!hasComprador) {
    return { valid: false, message: 'El comprador es obligatorio (seleccione un cliente o ingrese el nombre manualmente).' };
  }
  const hasManualProperty = !!(sale.externalPropertyAddress || sale.externalPropertyLink || sale.externalPropertyCode);
  if (!sale.propiedadId && !hasManualProperty) {
    return { valid: false, message: 'Debe seleccionar una propiedad o completar los datos de propiedad manual.' };
  }
  if (typeof sale.precioPublicado === 'number' && sale.precioPublicado < 0) {
    return { valid: false, message: 'El precio publicado no puede ser negativo.' };
  }
  if (typeof sale.precioOfrecido === 'number' && sale.precioOfrecido < 0) {
    return { valid: false, message: 'El precio ofrecido no puede ser negativo.' };
  }
  if (typeof sale.precioAcordado === 'number' && sale.precioAcordado < 0) {
    return { valid: false, message: 'El precio acordado no puede ser negativo.' };
  }
  if (sale.nombre && !sale.nombre.trim()) {
    return { valid: false, message: 'El nombre no puede estar vacío.' };
  }
  // valorOfertado, contraoferta1 y contraoferta2 aceptan string | number
  if (typeof sale.valorOfertado === 'number' && sale.valorOfertado < 0) {
    return { valid: false, message: 'El valor ofertado no puede ser negativo.' };
  }
  if (typeof sale.contraoferta1 === 'number' && sale.contraoferta1 < 0) {
    return { valid: false, message: 'La contraoferta no puede ser negativa.' };
  }
  if (typeof sale.contraoferta2 === 'number' && sale.contraoferta2 < 0) {
    return { valid: false, message: 'La contraoferta no puede ser negativa.' };
  }
  if (typeof sale.valorCierre === 'number' && sale.valorCierre < 0) {
    return { valid: false, message: 'El valor de cierre no puede ser negativo.' };
  }
  if (typeof sale.porcentajeBruto === 'number' && sale.porcentajeBruto < 0) {
    return { valid: false, message: 'El % bruto no puede ser negativo.' };
  }
  if (typeof sale.porcentajeNeto === 'number' && sale.porcentajeNeto < 0) {
    return { valid: false, message: 'El % neto no puede ser negativo.' };
  }
  if (typeof sale.porcentajeReferido === 'number' && sale.porcentajeReferido < 0) {
    return { valid: false, message: 'El % referido no puede ser negativo.' };
  }
  if (typeof sale.grossCommissionUsd === 'number' && sale.grossCommissionUsd < 0) {
    return { valid: false, message: 'La comisión bruta no puede ser negativa.' };
  }
  return { valid: true };
}

export function validateRental(rental: Partial<Rental>): ValidationResult {
  if (!rental.inquilinoId) {
    return { valid: false, message: 'El inquilino es obligatorio.' };
  }
  if (!rental.propiedadId) {
    return { valid: false, message: 'La propiedad es obligatoria.' };
  }
  if (typeof rental.montoMensual === 'number' && rental.montoMensual < 0) {
    return { valid: false, message: 'El monto mensual no puede ser negativo.' };
  }
  if (typeof rental.deposito === 'number' && rental.deposito < 0) {
    return { valid: false, message: 'El depósito no puede ser negativo.' };
  }
  if (typeof rental.comision === 'number' && rental.comision < 0) {
    return { valid: false, message: 'La comisión no puede ser negativa.' };
  }
  if (rental.fechaInicio && rental.fechaFin && rental.fechaFin < rental.fechaInicio) {
    return { valid: false, message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' };
  }
  return { valid: true };
}

export function validateDocument(doc: Partial<Document>): ValidationResult {
  if (!doc.name || !doc.name.trim()) {
    return { valid: false, message: 'El nombre del documento es obligatorio.' };
  }
  if (!doc.type) {
    return { valid: false, message: 'El tipo de documento es obligatorio.' };
  }
  if (!doc.status) {
    return { valid: false, message: 'El estado del documento es obligatorio.' };
  }
  return { valid: true };
}

export function validateTask(task: Partial<Task>): ValidationResult {
  if (!task.title || !task.title.trim()) {
    return { valid: false, message: 'El título de la tarea es obligatorio.' };
  }
  if (task.dueDate && !/\d{4}-\d{2}-\d{2}/.test(task.dueDate)) {
    return { valid: false, message: 'La fecha límite no es válida.' };
  }
  if (task.relatedEntities && task.relatedEntities.some(r => !r.type || !r.id)) {
    return { valid: false, message: 'Las entidades relacionadas deben tener tipo e ID.' };
  }
  return { valid: true };
}

export function validateWaitingRoom(entry: Partial<WaitingRoomEntry>): ValidationResult {
  if (!entry.nombre || !entry.nombre.trim()) {
    return { valid: false, message: 'El nombre es obligatorio.' };
  }
  const phone = entry.telefono?.trim() || '';
  const email = entry.email?.trim() || '';
  if (!phone && !email) {
    return { valid: false, message: 'Debe ingresar al menos un teléfono o un email.' };
  }
  return { valid: true };
}

const VALID_BUYER_STATUSES = ['activo', 'pausado', 'compró', 'compro', 'descartado', 'seguimiento'];

export function validateBuyer(buyer: Partial<Buyer>): ValidationResult {
  if (!buyer.nombre || !buyer.nombre.trim()) {
    return { valid: false, message: 'El nombre es obligatorio.' };
  }
  if (buyer.estado && !VALID_BUYER_STATUSES.includes(buyer.estado)) {
    return { valid: false, message: 'El estado del comprador no es válido.' };
  }
  if (typeof buyer.presupuestoMin === 'number' && buyer.presupuestoMin < 0) {
    return { valid: false, message: 'El presupuesto mínimo no puede ser negativo.' };
  }
  if (typeof buyer.presupuestoMax === 'number' && buyer.presupuestoMax < 0) {
    return { valid: false, message: 'El presupuesto máximo no puede ser negativo.' };
  }
  if (
    typeof buyer.presupuestoMin === 'number' &&
    typeof buyer.presupuestoMax === 'number' &&
    buyer.presupuestoMax < buyer.presupuestoMin
  ) {
    return { valid: false, message: 'El presupuesto máximo no puede ser menor que el mínimo.' };
  }
  return { valid: true };
}

export function validateReferredColleague(colleague: Partial<ReferredColleague>): ValidationResult {
  if (!colleague.nombreApellido || !colleague.nombreApellido.trim()) {
    return { valid: false, message: 'El nombre y apellido es obligatorio.' };
  }
  if (
    typeof colleague.comoRespondio === 'number' &&
    (colleague.comoRespondio < 1 || colleague.comoRespondio > 10)
  ) {
    return { valid: false, message: 'La respuesta debe estar entre 1 y 10.' };
  }
  return { valid: true };
}
