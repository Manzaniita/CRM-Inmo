/**
 * Helpers para eventos y tareas recurrentes.
 */

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNextOccurrence(
  dateString: string,
  frequency: RecurrenceFrequency,
  fromDate: Date = new Date(),
): string {
  const date = parseLocalDate(dateString);
  date.setHours(0, 0, 0, 0);
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);

  const candidate = new Date(date);
  candidate.setHours(0, 0, 0, 0);

  // Avanzar hasta alcanzar o superar la fecha de referencia.
  while (candidate < from) {
    switch (frequency) {
      case 'daily':
        candidate.setDate(candidate.getDate() + 1);
        break;
      case 'weekly':
        candidate.setDate(candidate.getDate() + 7);
        break;
      case 'monthly':
        candidate.setMonth(candidate.getMonth() + 1);
        break;
      case 'yearly':
        candidate.setFullYear(candidate.getFullYear() + 1);
        break;
    }
  }

  return formatDate(candidate);
}

export function getUpcomingBirthday(
  birthdate: string,
  fromDate: Date = new Date(),
): string {
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);
  const [, month, day] = birthdate.split('-').map(Number);
  let candidate = new Date(from.getFullYear(), month - 1, day);
  candidate.setHours(0, 0, 0, 0);
  if (candidate < from) {
    candidate = new Date(from.getFullYear() + 1, month - 1, day);
  }
  return formatDate(candidate);
}

export function formatRecurrenceLabel(
  frequency?: RecurrenceFrequency,
  endDate?: string,
): string {
  if (!frequency) return '';
  const label = FREQUENCY_LABELS[frequency] || frequency;
  if (endDate) return `${label} hasta ${endDate}`;
  return `${label} (sin fin)`;
}

export function isRecurringActive(
  frequency: RecurrenceFrequency,
  currentDateString: string,
  endDate?: string,
): boolean {
  if (!endDate) return true;
  return currentDateString <= endDate;
}

// Año sentinel usado cuando el usuario no quiere guardar el año real.
export const BIRTHDATE_NO_YEAR = 1900;

export function isBirthdateWithoutYear(dateString?: string): boolean {
  if (!dateString) return false;
  const year = Number(dateString.split('-')[0]);
  return year === BIRTHDATE_NO_YEAR;
}

export function formatBirthdate(dateString?: string): string {
  if (!dateString) return '-';
  const date = parseLocalDate(dateString);
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];

  if (isBirthdateWithoutYear(dateString)) {
    return `${day} de ${month}`;
  }

  const age = getAge(dateString);
  const ageText = age !== null ? ` (${age} años)` : '';
  return `${day} de ${month} de ${date.getFullYear()}${ageText}`;
}

export function getAge(dateString?: string): number | null {
  if (!dateString) return null;
  if (isBirthdateWithoutYear(dateString)) return null;

  const birth = parseLocalDate(dateString);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function normalizeBirthdate(
  dateString: string,
  includeYear: boolean,
): string {
  if (!dateString) return '';
  if (includeYear) return dateString;
  const [, month, day] = dateString.split('-');
  return `${BIRTHDATE_NO_YEAR}-${month}-${day}`;
}
