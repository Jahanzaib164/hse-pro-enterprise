import { format, isValid, parseISO, differenceInDays } from 'date-fns';

export function fmtDate(value?: string | null, pattern = 'dd MMM yyyy'): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? parseISO(value) : value;
  return isValid(d) ? format(d, pattern) : '—';
}

export function fmtDateTime(value?: string | null): string {
  return fmtDate(value, 'dd MMM yyyy HH:mm');
}

export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? differenceInDays(d, new Date()) : null;
}

export function isOverdue(dueDate?: string | null, status?: string): boolean {
  if (!dueDate) return false;
  if (status && ['COMPLETED', 'VERIFIED', 'CLOSED'].includes(status.toUpperCase())) return false;
  const d = daysUntil(dueDate);
  return d != null && d < 0;
}
