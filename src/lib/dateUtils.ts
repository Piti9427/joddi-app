/**
 * Date utility functions for local-safe comparisons and shared range definitions.
 * Optimized for performance in filtering loops.
 */

/**
 * Parses a YYYY-MM-DD string as a local date (midnight).
 * This avoids the UTC parsing bug where new Date('2024-01-01') returns UTC midnight.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Checks if a date string or object is "today" in local time.
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export interface DateRangeBoundaries {
  todayStart: number;
  yesterdayStart: number;
  yesterdayEnd: number;
  last7DaysStart: number;
  last30DaysStart: number;
  weekStart: number;
  monthStart: number;
  lastMonthStart: number;
  lastMonthEnd: number;
  rollingWeekStart: number;
  now: number;
}

/**
 * Returns boundaries for common date ranges in local time.
 * Using timestamps (numbers) for faster comparisons in filter loops.
 */
export function getDateRangeBoundaries(): DateRangeBoundaries {
  const now = new Date();

  // Today start
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Yesterday start & end
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const yesterdayEnd = todayStart - 1;

  // Last 7 days start
  const last7DaysStart = todayStart - 6 * 24 * 60 * 60 * 1000;

  // Last 30 days start
  const last30DaysStart = todayStart - 29 * 24 * 60 * 60 * 1000;

  // This Week (Starting Sunday)
  const tempWeek = new Date(now);
  const sunday = new Date(tempWeek.setDate(tempWeek.getDate() - tempWeek.getDay()));
  sunday.setHours(0, 0, 0, 0);
  const weekStart = sunday.getTime();

  // This Month start
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Last Month start & end
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const lastMonthEnd = monthStart - 1;

  // Last 7 days (rolling)
  const rollingWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();

  return {
    todayStart,
    yesterdayStart,
    yesterdayEnd,
    last7DaysStart,
    last30DaysStart,
    weekStart,
    monthStart,
    lastMonthStart,
    lastMonthEnd,
    rollingWeekStart,
    now: now.getTime(),
  };
}

/**
 * Safely compares if a transaction date falls within a custom range.
 * startStr/endStr are expected as 'YYYY-MM-DD' from HTML inputs.
 */
export function isInCustomRange(dateIso: string, startStr?: string, endStr?: string): boolean {
  const tTime = new Date(dateIso).getTime();

  if (startStr) {
    const start = parseLocalDate(startStr).getTime();
    if (tTime < start) return false;
  }

  if (endStr) {
    const end = parseLocalDate(endStr);
    end.setHours(23, 59, 59, 999);
    if (tTime > end.getTime()) return false;
  }

  return true;
}
