-- ============================================================
-- EstateCRM Supabase Schema
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
  templateProperty TEXT,
  templateClient TEXT,
  templateBuyer TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
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
  interestZone TEXT,
  propertyTypeInterest TEXT,
  lastContact TEXT,
  notes TEXT,
  historyNotes JSONB,
  createdAt TEXT,
  profession TEXT,
  referredBy TEXT,
  referredByColleagueId TEXT,
  dashboardPinned BOOLEAN DEFAULT FALSE,
  dashboardArchived BOOLEAN DEFAULT FALSE,
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
  externalLink TEXT,
  propertyLink TEXT,
  externalSource TEXT,
  notes TEXT,
  historyNotes JSONB,
  ownerId TEXT,
  images TEXT[],
  imageUrl TEXT,
  contractStartDate TEXT,
  contractEndDate TEXT,
  propertyCode TEXT,
  marketplaceId TEXT,
  marketplaceStatus TEXT,
  marketplaceTitle TEXT,
  marketplaceDescription TEXT,
  marketplaceLastPublishedAt TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  clientCompradorId TEXT NOT NULL,
  propiedadId TEXT NOT NULL,
  propietarioId TEXT,
  vendedorId TEXT,
  precioPublicado NUMERIC,
  precioOfrecido NUMERIC,
  precioAcordado NUMERIC,
  moneda TEXT,
  comisionEstimada NUMERIC,
  fechaReserva TEXT,
  fechaEscritura TEXT,
  estado TEXT,
  notas TEXT,
  fechaCreacion TEXT,
  fechaActualizacion TEXT,
  nombre TEXT,
  fecha TEXT,
  vendedor TEXT,
  comprador TEXT,
  inmoAgente TEXT,
  puntas INTEGER,
  porcentajeBruto NUMERIC,
  porcentajeNeto NUMERIC,
  porcentajeReferido NUMERIC,
  valorOfertado NUMERIC,
  contraoferta1 NUMERIC,
  contraoferta2 NUMERIC,
  valorCierre NUMERIC,
  escribania TEXT,
  montoEscritura TEXT,
  operationStatus TEXT,
  isCollected BOOLEAN DEFAULT FALSE,
  grossCommissionUsd NUMERIC,
  infoExtra TEXT,
  presupuesto NUMERIC,
  compradorManual TEXT,
  vendedorManual TEXT,
  compradorInmobiliaria TEXT,
  vendedorInmobiliaria TEXT,
  externalPropertyAddress TEXT,
  externalPropertyLink TEXT,
  externalPropertyCode TEXT,
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
  dueDate TEXT,
  priority TEXT,
  status TEXT,
  clientId TEXT,
  propertyId TEXT,
  notes TEXT,
  createdAt TEXT,
  source TEXT,
  autoKey TEXT,
  relatedEntities JSONB,
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
  clientId TEXT,
  propertyId TEXT,
  notes TEXT,
  createdAt TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REFERRED COLLEAGUES
-- ============================================================
CREATE TABLE IF NOT EXISTS referred_colleagues (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombreApellido TEXT NOT NULL,
  oficina TEXT,
  respondio BOOLEAN DEFAULT FALSE,
  quienContacto TEXT,
  comoRespondio INTEGER,
  yaRefirio BOOLEAN DEFAULT FALSE,
  aQuien TEXT,
  primerContacto TEXT,
  toque1 TEXT,
  toque2 TEXT,
  toque3 TEXT,
  toque4 TEXT,
  toque5 TEXT,
  toque6 TEXT,
  propertyIds TEXT[],
  referredClientIds TEXT[],
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
  createdAt TEXT,
  entityId TEXT,
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

-- Profiles: users can only see/update their own
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Clients: users can only see/manage their own
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

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(dueDate);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_referred_colleagues_user_id ON referred_colleagues(user_id);
