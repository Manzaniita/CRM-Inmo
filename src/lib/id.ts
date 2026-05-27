/**
 * Generación segura de IDs con prefijo.
 * Usa crypto.randomUUID() si está disponible, con fallback robusto.
 */

export function generateId(prefix?: string): string {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
  return prefix ? `${prefix}${suffix}` : suffix;
}
