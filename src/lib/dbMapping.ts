/**
 * Helper de normalización de datos entre frontend y Supabase.
 * El esquema de la base de datos usa camelCase nativo; esta capa
 * se limita a filtrar campos prohibidos y normalizar null/undefined.
 * NO transforma el casing de las claves.
 */

/** Prepara un objeto para enviar a Supabase.
 *  - Elimina campos `undefined` para no sobreescribirlos con null.
 *  - Filtra campos de control interno (userId / user_id) porque se
 *    inyectan manualmente en la capa de autenticación.
 */
export function toDb<T extends object>(
  obj: T,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...extra };
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (key === 'userId' || key === 'user_id') continue;
    result[key] = value;
  }
  return result;
}

/** Normaliza un registro recibido de Supabase.
 *  - Convierte `null` → `undefined` para evitar crashes en campos
 *    opcionales del frontend que esperan string | number | undefined.
 *  - Filtra campos de sistema que no pertenecen al estado de React.
 */
export function fromDb<T extends object>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'user_id' || key === 'userId') continue;
    result[key] = value === null ? undefined : value;
  }
  return result as T;
}

/** Mapea un array de registros de Supabase a entidades del frontend. */
export function fromDbArray<T extends object>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => fromDb<T>(row));
}
