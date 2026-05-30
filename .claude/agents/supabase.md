---
name: supabase
description: Migración de ImmoFlow a Supabase. El proyecto usa localStorage actualmente. Usar para: planear la migración, crear el schema SQL, configurar RLS multiusuario, reemplazar AppContext con queries de Supabase, agregar autenticación. Conoce la estructura real del código.
model: claude-sonnet-4-6
---

Especialista en migración de ImmoFlow a Supabase. Conozco el código actual.

## Estado actual del proyecto
- Datos en localStorage con prefijo `immoflow_`
- Sin autenticación (single user)
- AppContext.tsx maneja todo el estado
- 11 entidades: clients, properties, tasks, events, sales, rentals, documents, waitingRoom, buyers, referredColleagues, activityLogs

## Paso 1 — Instalar
```bash
npm install @supabase/supabase-js
```

Crear `.env` (si no existe, copiar `.env.example`):
```
VITE_SUPABASE_URL=https://XXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Crear `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Faltan variables de entorno de Supabase')

export const supabase = createClient(url, key)
```

## Schema SQL completo (mapea 1:1 con src/types.ts)
```sql
-- Profiles (extiende auth.users)
create table profiles (
  id uuid references auth.users(id) primary key,
  nombre text not null,
  email text unique not null,
  role text not null default 'agent' check (role in ('agent', 'admin', 'superadmin')),
  created_at timestamptz default now()
);

-- Clients (mapea interface Client)
create table clients (
  id text primary key,
  user_id uuid references profiles(id) not null,
  name text not null,
  phone text not null default '',
  email text not null default '',
  type text not null,
  types text[] default '{}',
  status text not null default 'nuevo',
  origin text not null default 'Manual',
  budget numeric,
  currency text default 'USD',
  interest_zone text,
  property_type_interest text,
  last_contact text,
  notes text default '',
  history_notes jsonb default '[]',
  profession text,
  referred_by text,
  referred_by_colleague_id text,
  dashboard_pinned boolean default false,
  dashboard_archived boolean default false,
  created_at text not null
);

-- Properties (mapea interface Property)
create table properties (
  id text primary key,
  user_id uuid references profiles(id) not null,
  code text not null,
  title text not null,
  type text not null,
  operation text not null,
  status text not null default 'disponible',
  address text not null default '',
  zone text not null default '',
  city text not null default '',
  price numeric not null default 0,
  currency text default 'USD',
  rooms int default 1,
  bedrooms int default 1,
  bathrooms int default 1,
  surface numeric default 0,
  external_link text,
  property_link text,
  external_source text,
  notes text default '',
  history_notes jsonb default '[]',
  owner_id text,
  images text[] default '{}',
  image_url text,
  contract_start_date text,
  contract_end_date text,
  property_code text,
  marketplace_id text,
  marketplace_status text,
  marketplace_title text,
  marketplace_last_published_at text
);

-- Sales (mapea interface Sale — campo complejo)
create table sales (
  id text primary key,
  user_id uuid references profiles(id) not null,
  client_comprador_id text,
  propiedad_id text,
  propietario_id text,
  vendedor_id text,
  precio_publicado numeric default 0,
  precio_ofrecido numeric,
  precio_acordado numeric,
  moneda text default 'USD',
  comision_estimada numeric default 0,
  fecha_reserva text,
  fecha_escritura text,
  estado text not null default 'consulta',
  notas text default '',
  fecha_creacion text not null,
  fecha_actualizacion text not null,
  -- Campos extendidos Reservómetro
  nombre text,
  fecha text,
  vendedor text,
  comprador text,
  inmo_agente text,
  puntas numeric,
  porcentaje_bruto numeric,
  porcentaje_neto numeric,
  porcentaje_referido numeric,
  valor_ofertado numeric,
  contraoferta1 numeric,
  contraoferta2 numeric,
  valor_cierre numeric,
  escribania text,
  monto_escritura text,
  operation_status text default 'activa',
  is_collected boolean default false,
  gross_commission_usd numeric,
  external_property_address text,
  external_property_link text,
  external_property_code text
);

-- Tasks
create table tasks (
  id text primary key,
  user_id uuid references profiles(id) not null,
  title text not null,
  description text default '',
  due_date text,
  priority text not null default 'media',
  status text not null default 'pendiente',
  client_id text,
  property_id text,
  notes text,
  created_at text not null,
  source text,
  auto_key text,
  related_entities jsonb default '[]'
);

-- (Agregar tablas para rentals, events, documents, buyers, etc. con el mismo patrón)
```

## RLS — Row Level Security
```sql
-- Helper superadmin
create or replace function is_superadmin()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'superadmin');
$$ language sql security definer stable;

-- Habilitar RLS en todas las tablas
alter table clients    enable row level security;
alter table properties enable row level security;
alter table sales      enable row level security;
alter table tasks      enable row level security;
-- (repetir para todas)

-- Policies (mismo patrón para cada tabla)
create policy "select" on clients
  for select using (user_id = auth.uid() or is_superadmin());
create policy "insert" on clients
  for insert with check (user_id = auth.uid());
create policy "update" on clients
  for update using (user_id = auth.uid() or is_superadmin());
create policy "delete" on clients
  for delete using (user_id = auth.uid() or is_superadmin());

-- Superadmin: UPDATE profiles SET role = 'superadmin' WHERE email = 'tu@email.com';
```

## Migración de AppContext.tsx
La estrategia es reemplazar las funciones del AppContext una por una:

```typescript
// ANTES (localStorage):
const addClient = (client: Client) => {
  setClients(prev => [client, ...prev])
  showToast('Cliente creado', 'success')
}

// DESPUÉS (Supabase):
const addClient = async (client: Client) => {
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...client, user_id: user.id })
    .select().single()
  if (error) { showToast('Error al crear cliente', 'error'); return }
  setClients(prev => [data, ...prev])
  showToast('Cliente creado', 'success')
}
```

## AuthContext para multiusuario
Una vez con Supabase, agregar `src/contexts/AuthContext.tsx`:
```typescript
// Ver agente auth-roles para el código completo
// Los formularios en AppProvider necesitarán user.id para filtrar datos
```

## Script de migración de datos locales
```typescript
// Ejecutar una sola vez para migrar localStorage → Supabase
async function migrateLocalStorage(userId: string) {
  const clients = loadFromStorage<Client[]>('immoflow_clients', [])
  if (clients.length > 0) {
    await supabase.from('clients').insert(
      clients.map(c => ({ ...c, user_id: userId }))
    )
  }
  // Repetir para cada entidad
}
```
