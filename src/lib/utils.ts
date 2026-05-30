import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '');
  let fullNumber = cleaned;

  if (cleaned.length < 12) {
    if (cleaned.length === 10) {
      fullNumber = `549${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('9')) {
      fullNumber = `54${cleaned}`;
    } else {
      fullNumber = `54${cleaned}`;
    }
  }

  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function parseRichText(content: string): string {
  let html = escapeHtml(content);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<u>$1</u>');
  html = html.replace(/\n/g, '<br />');
  return html;
}

export function formatWhatsAppTemplate(
  template: string,
  data: Record<string, string | number | undefined>
): string {
  let result = template;

  // If link is empty, remove entire lines containing {link}
  const linkVal = data.link;
  if (!linkVal || String(linkVal).trim() === '') {
    result = result.split('\n').filter(line => !line.includes('{link}')).join('\n');
  }

  // Replace all placeholders
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    const replacement = value !== undefined && value !== null && String(value) !== '' ? String(value) : '';
    result = result.split(placeholder).join(replacement);
  });

  // Remove any remaining unknown placeholders
  result = result.replace(/\{[a-zA-Z0-9_]+\}/g, '');

  // Clean up extra whitespace and newlines
  result = result.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  return result;
}
