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
  return getNextOccurrence(birthdate, 'yearly', fromDate);
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
