import type { TimeAvailability } from '../types';

/**
 * Очистка строки от опасных символов и HTML-тегов (XSS Prevention)
 */
export function sanitizeString(input: string | undefined | null, maxLength = 120): string {
  if (!input) return '';
  return input
    .replace(/[<>'"&]/g, '') // удаление символов HTML-разметки
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // удаление управляющих невидимых символов
    .trim()
    .slice(0, maxLength);
}

/**
 * Строгая валидация HEX-цвета
 */
export function sanitizeHexColor(color: string | undefined | null, defaultColor = '#3b82f6'): string {
  if (!color) return defaultColor;
  const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  return hexRegex.test(color.trim()) ? color.trim() : defaultColor;
}

/**
 * Валидация и очистка номера телефона
 */
export function sanitizePhone(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  const cleaned = phone.replace(/[^\d+()\s-]/g, '').trim().slice(0, 25);
  return cleaned.length >= 5 ? cleaned : undefined;
}

/**
 * Валидация Email
 */
export function sanitizeEmail(email: string | undefined | null): string | undefined {
  if (!email) return undefined;
  const cleaned = email.trim().toLowerCase().slice(0, 80);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : undefined;
}

/**
 * Нормализатор матрицы доступности Time-Off
 * Гарантирует целостность размерности [daysCount x maxLessons] без undefined
 */
export function normalizeTimeGrid(
  grid: Record<number, TimeAvailability[]> | undefined | null,
  daysCount: number,
  maxLessons: number
): Record<number, TimeAvailability[]> {
  const normalized: Record<number, TimeAvailability[]> = {};
  const safeDays = Math.max(1, Math.min(daysCount, 7));
  const safeLessons = Math.max(1, Math.min(maxLessons, 12));

  for (let d = 0; d < safeDays; d++) {
    const existingDay = grid?.[d] || [];
    const dayRow: TimeAvailability[] = [];
    for (let s = 0; s < safeLessons; s++) {
      const val = existingDay[s];
      dayRow.push(val === 0 || val === 2 || val === 1 ? val : 1);
    }
    normalized[d] = dayRow;
  }
  return normalized;
}