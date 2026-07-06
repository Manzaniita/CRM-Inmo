-- Migración: vencimiento de documentos y auditoría de precios de propiedades
-- Ejecutar en el SQL Editor de Supabase (New query -> Run)

-- Fecha de vencimiento opcional para documentos (contratos, garantías, etc.)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS "expiryDate" TEXT;

-- Historial de precios de propiedades (array de { date, price })
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS "priceHistory" JSONB DEFAULT '[]'::jsonb;

-- Vínculo formal entre clientes y compradores
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS "buyerId" TEXT;

-- Política para service_role (utilizada por la API edge de sincronización).
-- Aunque service_role bypass RLS por defecto, la política documenta el acceso.
CREATE POLICY IF NOT EXISTS "Service role can manage all integrations"
  ON public.user_integrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
