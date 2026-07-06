-- Migración: eventos/tareas recurrentes y fecha de nacimiento de clientes
-- Ejecutar en el SQL Editor de Supabase (New query -> Run)

-- Fecha de nacimiento del cliente
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS birthdate DATE;

-- Recurrencia en eventos
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Recurrencia en tareas
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Nota: la columna tasks.source ya existe en el proyecto para alertas de contratos.
-- Si no existe, descomentar la siguiente línea:
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
