/**
 * Helpers de fecha para alertas y vencimientos.
 */

export function isOverdue(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < now;
}

export function isToday(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export function isWithinNextDays(dateString: string, days: number): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date >= now && date <= limit;
}

export function daysUntil(dateString: string): number {
  if (!dateString) return Infinity;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return Infinity;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDateRelative(dateString: string): string {
  if (!dateString) return '-';
  const d = daysUntil(dateString);
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Mañana';
  if (d === -1) return 'Ayer';
  if (d < 0) return `Hace ${Math.abs(d)} días`;
  return `En ${d} días`;
}

export function isDocExpiringSoon(doc: { tipo?: string; expiryDate?: string }): boolean {
  if (!doc.expiryDate || doc.tipo !== 'Contrato') return false;
  return isOverdue(doc.expiryDate) || isToday(doc.expiryDate) || isWithinNextDays(doc.expiryDate, 30);
}

export function contractTimeRemaining(contractEndDate?: string): { text: string; expired: boolean } {
  if (!contractEndDate) return { text: 'Sin vencimiento', expired: false };
  const d = daysUntil(contractEndDate);
  if (d === 0) return { text: 'Vence hoy', expired: true };
  if (d < 0) return { text: `Vencida hace ${Math.abs(d)} días`, expired: true };
  return { text: `Vence en ${d} días`, expired: false };
}
