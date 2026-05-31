-- ============================================================
-- EstateCRM Supabase Schema (Cloud-First / snake_case)
-- Copiar y pegar en el SQL Editor de Supabase
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  license TEXT,
  template_property TEXT,
  template_client TEXT,
  template_buyer TEXT,
  role TEXT DEFAULT 'agent',
  must_change_password BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  type TEXT,
  types TEXT[],
  status TEXT,
  origin TEXT,
  budget NUMERIC,
  currency TEXT,
  interest_zone TEXT,
  property_type_interest TEXT,
  last_contact TEXT,
  notes TEXT,
  history_notes JSONB,
  created_at TEXT,
  profession TEXT,
  referred_by TEXT,
  referred_by_colleague_id TEXT,
  dashboard_pinned BOOLEAN DEFAULT FALSE,
  dashboard_archived BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROPERTIES
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT,
  title TEXT NOT NULL,
  type TEXT,
  operation TEXT,
  status TEXT,
  address TEXT,
  zone TEXT,
  city TEXT,
  price NUMERIC,
  currency TEXT,
  rooms INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  surface NUMERIC,
  external_link TEXT,
  property_link TEXT,
  external_source TEXT,
  notes TEXT,
  history_notes JSONB,
  owner_id TEXT,
  images TEXT[],
  image_url TEXT,
  contract_start_date TEXT,
  contract_end_date TEXT,
  property_code TEXT,
  marketplace_id TEXT,
  marketplace_status TEXT,
  marketplace_title TEXT,
  marketplace_description TEXT,
  marketplace_last_published_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_comprador_id TEXT NOT NULL,
  propiedad_id TEXT NOT NULL,
  propietario_id TEXT,
  vendedor_id TEXT,
  precio_publicado NUMERIC,
  precio_ofrecido NUMERIC,
  precio_acordado NUMERIC,
  moneda TEXT,
  comision_estimada NUMERIC,
  fecha_reserva TEXT,
  fecha_escritura TEXT,
  estado TEXT,
  notas TEXT,
  fecha_creacion TEXT,
  fecha_actualizacion TEXT,
  nombre TEXT,
  fecha TEXT,
  vendedor TEXT,
  comprador TEXT,
  inmo_agente TEXT,
  puntas INTEGER,
  porcentaje_bruto NUMERIC,
  porcentaje_neto NUMERIC,
  porcentaje_referido NUMERIC,
  valor_ofertado NUMERIC,
  contraoferta1 NUMERIC,
  contraoferta2 NUMERIC,
  valor_cierre NUMERIC,
  escribania TEXT,
  monto_escritura TEXT,
  operation_status TEXT DEFAULT 'activa',
  is_collected BOOLEAN DEFAULT FALSE,
  gross_commission_usd NUMERIC,
  info_extra TEXT,
  presupuesto NUMERIC,
  comprador_manual TEXT,
  vendedor_manual TEXT,
  comprador_inmobiliaria TEXT,
  vendedor_inmobiliaria TEXT,
  external_property_address TEXT,
  external_property_link TEXT,
  external_property_code TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  priority TEXT,
  status TEXT,
  client_id TEXT,
  property_id TEXT,
  notes TEXT,
  created_at TEXT,
  source TEXT,
  auto_key TEXT,
  related_entities JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT,
  time TEXT,
  type TEXT,
  status TEXT,
  client_id TEXT,
  property_id TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REFERRED COLLEAGUES
-- ============================================================
CREATE TABLE IF NOT EXISTS referred_colleagues (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre_apellido TEXT NOT NULL,
  oficina TEXT,
  respondio BOOLEAN DEFAULT FALSE,
  quien_contacto TEXT,
  como_respondio INTEGER,
  ya_refirio BOOLEAN DEFAULT FALSE,
  a_quien TEXT,
  primer_contacto TEXT,
  toque1 TEXT,
  toque2 TEXT,
  toque3 TEXT,
  toque4 TEXT,
  toque5 TEXT,
  toque6 TEXT,
  property_ids TEXT[],
  referred_client_ids TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT,
  action TEXT,
  title TEXT,
  description TEXT,
  created_at TEXT,
  entity_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RENTALS
-- ============================================================
CREATE TABLE IF NOT EXISTS rentals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  inquilino_id TEXT NOT NULL,
  propiedad_id TEXT NOT NULL,
  propietario_id TEXT,
  locador_id TEXT,
  monto_mensual NUMERIC,
  deposito NUMERIC,
  comision NUMERIC,
  moneda TEXT,
  fecha_inicio TEXT,
  fecha_fin TEXT,
  dia_pago INTEGER,
  estado TEXT,
  notas TEXT,
  fecha_creacion TEXT,
  fecha_actualizacion TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  status TEXT,
  client_id TEXT,
  property_id TEXT,
  sale_id TEXT,
  rental_id TEXT,
  upload_date TEXT,
  notes TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_extension TEXT,
  simulated_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WAITING ROOM
-- ============================================================
CREATE TABLE IF NOT EXISTS waiting_room (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  interes TEXT,
  propiedad_id TEXT,
  estado TEXT,
  fecha_ingreso TEXT,
  notas TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUYERS
-- ============================================================
CREATE TABLE IF NOT EXISTS buyers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  presupuesto_min NUMERIC,
  presupuesto_max NUMERIC,
  moneda TEXT,
  zona_buscada TEXT,
  tipo_propiedad TEXT,
  estado TEXT,
  notas TEXT,
  created_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE referred_colleagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_room ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

-- Helper function: SECURITY DEFINER evita recursión infinita
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Profiles
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Superadmin can manage all profiles" ON profiles;

CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Superadmin can manage all profiles" ON profiles
  FOR ALL USING (get_my_role() = 'superadmin') WITH CHECK (get_my_role() = 'superadmin');

-- Clients
CREATE POLICY "Users can manage own clients" ON clients
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Properties
CREATE POLICY "Users can manage own properties" ON properties
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Sales
CREATE POLICY "Users can manage own sales" ON sales
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Tasks
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Events
CREATE POLICY "Users can manage own events" ON events
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Referred Colleagues
CREATE POLICY "Users can manage own colleagues" ON referred_colleagues
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Activity Logs
CREATE POLICY "Users can manage own logs" ON activity_logs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Rentals
CREATE POLICY "Users can manage own rentals" ON rentals
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Documents
CREATE POLICY "Users can manage own documents" ON documents
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Waiting Room
CREATE POLICY "Users can manage own waiting_room" ON waiting_room
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Buyers
CREATE POLICY "Users can manage own buyers" ON buyers
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_referred_colleagues_user_id ON referred_colleagues(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_waiting_room_user_id ON waiting_room(user_id);
CREATE INDEX IF NOT EXISTS idx_buyers_user_id ON buyers(user_id);
