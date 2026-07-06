-- Migración: campos de gastos de oficina y comisión neta en ventas
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS gastos_oficina NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS comision_neta_final NUMERIC;
