/**
 * Helper de transformación entre camelCase (frontend) y snake_case (Supabase DB).
 * El frontend sigue usando camelCase; la capa de datos traduce automáticamente.
 */

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/** Convierte las claves de un objeto de camelCase a snake_case.
 *  Útil para INSERT/UPDATE hacia Supabase.
 */
export function toDb<T extends object>(
  obj: T,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...extra };
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    // No enviamos campos de control internos al payload de Supabase
    if (key === 'userId' || key === 'user_id') continue;
    result[toSnakeCase(key)] = value;
  }
  return result;
}

/** Convierte las claves de un registro de Supabase (snake_case) a camelCase.
 *  Útil al leer datos de la nube.
 *  Filtra campos de sistema que no pertenecen al estado de React.
 */
export function fromDb<T extends object>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'user_id' || key === 'updated_at') continue;
    const camelKey = toCamelCase(key);
    // Normalizar null → undefined para evitar crashes en campos opcionales del frontend
    result[camelKey] = value === null ? undefined : value;
  }
  return result as T;
}

/** Mapea un array de registros de Supabase a entidades del frontend. */
export function fromDbArray<T extends object>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => fromDb<T>(row));
}
