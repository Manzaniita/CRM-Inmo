---
name: data-layer
description: Tipos TypeScript, AppContext, localStorage y estructura de datos de ImmoFlow. Usar cuando se necesita agregar/modificar tipos, entender la estructura real de los datos, agregar persistencia, o preparar la migración a Supabase.
model: claude-sonnet-4-6
---

Especialista en la capa de datos real de ImmoFlow. Todo basado en src/types.ts y AppContext.tsx.

## Tipos reales (src/types.ts) — los más importantes

### Client
```typescript
type ClientType = 'comprador' | 'vendedor' | 'inquilino' | 'propietario' | 'inversor' | 'interesado'
type ClientStatus = 'nuevo' | 'contactado' | 'interesado' | 'en seguimiento' | 'negociación' | 'cerrado' | 'perdido'
type ClientOrigin = 'WhatsApp' | 'Instagram' | 'Web' | 'Referido' | 'Llamada' | 'Oficina' | 'Marketplace' | 'Manual' | 'Otro'

interface Client {
  id: string; name: string; phone: string; email: string
  type: ClientType; types?: ClientType[]  // tipos múltiples
  status: ClientStatus; origin: ClientOrigin
  budget?: number; currency?: 'USD' | 'ARS'
  interestZone?: string; propertyTypeInterest?: string
  lastContact: string; notes: string
  historyNotes?: EntityNote[]  // notas con timestamp
  createdAt: string; profession?: string
  referredBy?: string; referredByColleagueId?: string
  dashboardPinned?: boolean; dashboardArchived?: boolean
}
```

### Property
```typescript
type PropertyType = 'casa' | 'departamento' | 'local' | 'terreno' | 'oficina' | 'galpón' | 'cochera'
type PropertyOperation = 'venta' | 'alquiler' | 'ambas'
type PropertyStatus = 'disponible' | 'reservada' | 'vendida' | 'alquilada' | 'pausada' | 'vencida' | 'en_seguimiento'

interface Property {
  id: string; code: string; title: string
  type: PropertyType; operation: PropertyOperation; status: PropertyStatus
  address: string; zone: string; city: string
  price: number; currency: 'USD' | 'ARS'
  rooms: number; bedrooms: number; bathrooms: number; surface: number
  externalLink?: string; propertyLink?: string; externalSource?: string
  notes: string; historyNotes?: EntityNote[]
  ownerId?: string; images: string[]; imageUrl?: string
  contractStartDate?: string; contractEndDate?: string; propertyCode?: string
  marketplaceId?: string
  marketplaceStatus?: 'no_publicada' | 'lista' | 'publicada' | 'pausada' | 'error'
  marketplaceTitle?: string; marketplaceDescription?: string; marketplaceLastPublishedAt?: string
}
```

### Sale (COMPLEJO — 30+ campos)
```typescript
type SaleStatus = 'consulta' | 'visita' | 'oferta' | 'negociación' | 'reserva' | 'boleto' | 'escritura' | 'vendida' | 'caída'

interface Sale {
  id: string
  clientCompradorId: string   // FK a clients
  propiedadId: string         // FK a properties (puede ser '')
  propietarioId?: string      // FK a clients
  vendedorId?: string         // FK a clients
  precioPublicado: number; precioOfrecido?: number; precioAcordado?: number
  moneda: 'USD' | 'ARS'; comisionEstimada: number
  fechaReserva?: string; fechaEscritura?: string
  estado: SaleStatus; notas: string
  fechaCreacion: string; fechaActualizacion: string
  // Campos extendidos Reservómetro:
  nombre?: string; fecha?: string
  vendedor?: string; comprador?: string  // texto libre (alternativo a IDs)
  inmoAgente?: string; puntas?: number
  porcentajeBruto?: number; porcentajeNeto?: number; porcentajeReferido?: number
  fechaTomada?: string
  valorOfertado?: number; contraoferta1?: number; contraoferta2?: number; valorCierre?: number
  escribania?: string; montoEscritura?: string | number
  operationStatus?: 'activa' | 'vendida' | 'caída'
  isCollected?: boolean; grossCommissionUsd?: number
  infoExtra?: string; presupuesto?: number
  // Propiedad manual (sin vincular a properties):
  externalPropertyAddress?: string; externalPropertyLink?: string; externalPropertyCode?: string
}
```

### Rental
```typescript
type RentalStatus = 'consulta' | 'visita' | 'documentación' | 'aprobado' | 'contrato' | 'firmado' | 'en curso' | 'renovación' | 'finalizado' | 'cancelado'

interface Rental {
  id: string; inquilinoId: string; propiedadId: string
  propietarioId?: string; locadorId?: string
  montoMensual: number; deposito: number; comision: number
  moneda: 'USD' | 'ARS'; fechaInicio: string; fechaFin: string
  diaPago: number; estado: RentalStatus; notas: string
  fechaCreacion: string; fechaActualizacion: string
}
```

### Task
```typescript
type TaskStatus = 'pendiente' | 'en proceso' | 'completada' | 'vencida' | 'reprogramado' | 'cancelada'
type TaskPriority = 'baja' | 'media' | 'alta' | 'urgente'
interface TaskRelatedEntity { type: 'client' | 'property' | 'colleague' | 'sale' | 'buyer'; id: string }

interface Task {
  id: string; title: string; description: string
  dueDate: string; priority: TaskPriority; status: TaskStatus
  clientId?: string; propertyId?: string; notes?: string
  createdAt: string
  source?: 'manual' | 'auto_contract_renewal'
  autoKey?: string
  relatedEntities?: TaskRelatedEntity[]
}
```

### Otros tipos importantes
```typescript
interface CalendarEvent {
  id: string; title: string; description?: string
  date: string; time: string
  type: 'visita' | 'llamada' | 'reunión' | 'firma' | 'vencimiento' | 'seguimiento' | 'tasación' | 'entrega_de_llaves' | 'recordatorio'
  status: 'pendiente' | 'realizado' | 'cancelado' | 'reprogramado'
  clientId?: string; propertyId?: string; notes?: string; createdAt: string
}

interface Buyer {
  id: string; nombre: string; telefono: string; email: string
  presupuestoMin?: number; presupuestoMax?: number; moneda?: 'USD' | 'ARS'
  zonaBuscada?: string; tipoPropiedad?: string
  estado: 'activo' | 'pausado' | 'compró' | 'compro' | 'descartado' | 'seguimiento'
  notas: string; createdAt: string
}

interface ReferredColleague {
  id: string; nombreApellido: string; oficina: string
  respondio: boolean; quienContacto?: string; comoRespondio?: number
  yaRefirio: boolean; aQuien?: string; primerContacto?: string
  toque1?: string; toque2?: string; toque3?: string
  toque4?: string; toque5?: string; toque6?: string
  propertyIds?: string[]; referredClientIds?: string[]
}

interface Document {
  id: string; name: string
  type: 'DNI' | 'Escritura' | 'Contrato' | 'Reserva' | 'Boleto' | 'Garantía' | 'Recibo' | 'Comprobante' | 'Otro'
  status: 'pendiente' | 'cargado' | 'revisado' | 'vencido'
  clientId?: string; propertyId?: string; saleId?: string; rentalId?: string
  uploadDate: string; notes?: string
  fileName?: string; fileSize?: number; fileExtension?: string; simulatedUrl?: string
}

interface EntityNote { id: string; content: string; createdAt: string }

interface ActivityLog {
  id: string; type: ActivityLogType; action: ActivityLogAction
  title: string; description?: string; createdAt: string; entityId?: string
}
```

## STORAGE_KEYS (localStorage)
```typescript
const STORAGE_KEYS = {
  CLIENTS: 'immoflow_clients',
  PROPERTIES: 'immoflow_properties',
  TASKS: 'immoflow_tasks',
  EVENTS: 'immoflow_events',
  SALES: 'immoflow_sales',
  RENTALS: 'immoflow_rentals',
  DOCUMENTS: 'immoflow_documents',
  WAITING_ROOM: 'immoflow_waiting_room',
  BUYERS: 'immoflow_buyers',
  REFERRED_COLLEAGUES: 'immoflow_referred_colleagues',
  ACTIVITY_LOGS: 'immoflow_activity_logs'
}
```

## Prefijos de IDs por entidad
```typescript
generateId('c')   // clientes
generateId('p')   // propiedades
generateId('t')   // tareas
generateId('e')   // eventos
generateId('s')   // ventas/sales
generateId('r')   // alquileres/rentals
generateId('d')   // documentos
generateId('w')   // waiting room
generateId('b')   // buyers
generateId('col') // colleagues
generateId('log') // activity logs
generateId('n')   // notes (EntityNote)
```

## Preparación para Supabase (cuando llegue el momento)
El esquema SQL mapea 1:1 con estas interfaces. Los pasos serán:
1. `npm install @supabase/supabase-js`
2. Crear `src/lib/supabase.ts` con el cliente
3. Reemplazar `AppContext.tsx` — cambiar `loadFromStorage/saveToStorage` por queries de Supabase
4. Agregar autenticación con `supabase.auth`
5. Los tipos ya están listos, solo cambiar la fuente de datos

La propiedad `user_id` se agregará a todas las entidades para RLS.
