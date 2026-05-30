---
name: supabase-rls
description: Skill para auditar y generar políticas de Row Level Security de Supabase para CRM-Inmo. Usar antes de cada deploy de cambios en la BD, o cuando se agrega una tabla nueva. Verifica que cada tabla tenga RLS habilitado y que el superadmin tenga acceso total.
---

Auditá y generá las políticas RLS de Supabase para CRM-Inmo.

## Checklist por tabla nueva

Cada vez que se agrega una tabla al CRM, verificar:

```sql
-- 1. RLS habilitado
ALTER TABLE [tabla] ENABLE ROW LEVEL SECURITY;

-- 2. SELECT: propio o superadmin
CREATE POLICY "[tabla]_select" ON [tabla]
  FOR SELECT USING (user_id = auth.uid() OR is_superadmin());

-- 3. INSERT: solo propio user_id
CREATE POLICY "[tabla]_insert" ON [tabla]
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 4. UPDATE: propio o superadmin
CREATE POLICY "[tabla]_update" ON [tabla]
  FOR UPDATE USING (user_id = auth.uid() OR is_superadmin());

-- 5. DELETE: propio o superadmin
CREATE POLICY "[tabla]_delete" ON [tabla]
  FOR DELETE USING (user_id = auth.uid() OR is_superadmin());
```

## Función is_superadmin (debe existir siempre)
```sql
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

## Verificación de estado actual
```sql
-- Ver todas las políticas activas
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Ver tablas SIN RLS (peligroso)
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename FROM pg_policies WHERE schemaname = 'public'
);
```

## Reglas de seguridad
- NUNCA tabla pública sin RLS en producción
- `profiles` solo readable por el propio user + superadmin
- `profiles` NO permite que un agente cambie su propio `role`
- Storage buckets: también configurar RLS en Supabase Dashboard

## Output
- SQL para crear/corregir todas las políticas faltantes
- Confirmación tabla por tabla del estado
