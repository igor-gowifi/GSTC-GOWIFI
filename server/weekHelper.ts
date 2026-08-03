/**
 * Helper functions for week-based filtering
 * Supports: current week, next week, last week, and week 1-4 of month
 */

export interface WeekRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Get the week number of a date within its month
 * Week 1: days 1-7
 * Week 2: days 8-14
 * Week 3: days 15-21
 * Week 4: days 22-28
 * Week 5: days 29+
 */
export function getWeekNumberOfMonth(date: Date): number {
  const day = date.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
}

/**
 * Get the date range for a specific week of the month
 */
export function getWeekRangeOfMonth(weekNumber: 1 | 2 | 3 | 4, month: number, year: number): WeekRange {
  const startDay = (weekNumber - 1) * 7 + 1;
  const endDay = weekNumber * 7;
  
  const startDate = new Date(year, month - 1, startDay);
  let endDate = new Date(year, month - 1, endDay);
  
  // Ensure end date doesn't go past the last day of the month
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  if (endDay > lastDayOfMonth) {
    endDate = new Date(year, month - 1, lastDayOfMonth);
  }
  
  return { startDate, endDate };
}

/**
 * Get the ISO week number (Monday-Sunday) for a date
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get the start and end dates of the current week (Monday-Sunday)
 */
export function getCurrentWeekRange(): WeekRange {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  // Calculate Sunday of current week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return { startDate: monday, endDate: sunday };
}

/**
 * Get the start and end dates of the previous week (Monday-Sunday)
 */
export function getPreviousWeekRange(): WeekRange {
  const { startDate: currentMonday } = getCurrentWeekRange();
  
  const previousMonday = new Date(currentMonday);
  previousMonday.setDate(currentMonday.getDate() - 7);
  
  const previousSunday = new Date(previousMonday);
  previousSunday.setDate(previousMonday.getDate() + 6);
  
  return { startDate: previousMonday, endDate: previousSunday };
}

/**
 * Get the start and end dates of the next week (Monday-Sunday)
 */
export function getNextWeekRange(): WeekRange {
  const { endDate: currentSunday } = getCurrentWeekRange();
  
  const nextMonday = new Date(currentSunday);
  nextMonday.setDate(currentSunday.getDate() + 1);
  
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  
  return { startDate: nextMonday, endDate: nextSunday };
}

/**
 * Get the week range based on the week type and optional month/year
 * If month/year are provided, uses those; otherwise uses current month/year
 */
export function getWeekRange(
  weekType: 'esta-semana' | 'semana-passada' | 'semana-que-vem' | '1a-semana' | '2a-semana' | '3a-semana' | '4a-semana',
  month?: number,
  year?: number
): WeekRange {
  const now = new Date();
  const currentMonth = month || now.getMonth() + 1;
  const currentYear = year || now.getFullYear();
  
  switch (weekType) {
    case 'esta-semana':
      return getCurrentWeekRange();
    case 'semana-passada':
      return getPreviousWeekRange();
    case 'semana-que-vem':
      return getNextWeekRange();
    case '1a-semana':
      return getWeekRangeOfMonth(1, currentMonth, currentYear);
    case '2a-semana':
      return getWeekRangeOfMonth(2, currentMonth, currentYear);
    case '3a-semana':
      return getWeekRangeOfMonth(3, currentMonth, currentYear);
    case '4a-semana':
      return getWeekRangeOfMonth(4, currentMonth, currentYear);
    default:
      return getCurrentWeekRange();
  }
}

/**
 * Check if a date falls within a week range
 */
export function isDateInWeekRange(date: Date, weekRange: WeekRange): boolean {
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOnly = new Date(weekRange.startDate.getFullYear(), weekRange.startDate.getMonth(), weekRange.startDate.getDate());
  const endOnly = new Date(weekRange.endDate.getFullYear(), weekRange.endDate.getMonth(), weekRange.endDate.getDate());
  
  return dateOnly >= startOnly && dateOnly <= endOnly;
}
