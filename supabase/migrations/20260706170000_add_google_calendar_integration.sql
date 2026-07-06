-- Integración con Google Calendar

-- Tabla para guardar tokens de integración de forma segura (separada del perfil).
create table if not exists public.user_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null,
  email text not null,
  refresh_token text,
  access_token text,
  expires_at timestamptz,
  updated_at timestamptz default now(),
  constraint unique_user_provider unique (user_id, provider)
);

-- Índice útil para búsquedas por proveedor.
create index if not exists idx_user_integrations_provider
  on public.user_integrations(provider);

-- Habilitar RLS.
alter table public.user_integrations enable row level security;

-- Política: cada usuario solo puede leer/escribir sus propias integraciones.
create policy "Users can manage own integrations"
  on public.user_integrations
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Columna para almacenar el ID remoto del evento de Google Calendar.
alter table public.events
  add column if not exists google_calendar_event_id text;
