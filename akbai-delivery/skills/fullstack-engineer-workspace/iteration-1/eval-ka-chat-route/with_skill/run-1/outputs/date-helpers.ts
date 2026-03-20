/**
 * /lib/utils/date-helpers.ts
 * Timezone-aware date formatting for Philippine locales
 *
 * AKBai operates in Asia/Manila timezone for all date displays and boundaries.
 * BIR deadlines and financial periods are date-critical — timezone bugs are compliance failures.
 */

/**
 * Format a date in a specific timezone
 * Uses the Intl API and custom formatting
 *
 * @param date - JavaScript Date object (in UTC or local)
 * @param timezone - IANA timezone string (e.g., 'Asia/Manila')
 * @param format - Format string (e.g., 'yyyy-MM-dd', 'MMMM dd, yyyy')
 * @returns Formatted date string
 *
 * Example:
 * formatDateInTimezone(new Date('2026-03-15T10:30:00Z'), 'Asia/Manila', 'yyyy-MM-dd')
 * => '2026-03-15'
 */
export function formatDateInTimezone(
  date: Date,
  timezone: string = 'Asia/Manila',
  format: string = 'yyyy-MM-dd'
): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const dateMap: Record<string, string> = {};

  parts.forEach((part) => {
    dateMap[part.type] = part.value;
  });

  // Build formatted string based on requested format
  let result = format;
  result = result.replace('yyyy', dateMap.year);
  result = result.replace('MM', dateMap.month);
  result = result.replace('dd', dateMap.day);
  result = result.replace('HH', dateMap.hour);
  result = result.replace('mm', dateMap.minute);
  result = result.replace('ss', dateMap.second);

  return result;
}

/**
 * Get today's date in a timezone (useful for day boundaries)
 *
 * @param timezone - IANA timezone string
 * @returns Date object at midnight (00:00:00) in that timezone
 *
 * Example:
 * getTodayInTimezone('Asia/Manila')
 * => Date object at 2026-03-15T00:00:00 (Manila time)
 */
export function getTodayInTimezone(timezone: string = 'Asia/Manila'): Date {
  const now = new Date();
  const dateStr = formatDateInTimezone(now, timezone, 'yyyy-MM-dd');
  const [year, month, day] = dateStr.split('-').map(Number);

  // Return UTC date (will be correct date in the target timezone)
  return new Date(year, month - 1, day);
}

/**
 * Get start of month in a timezone
 *
 * @param timezone - IANA timezone string
 * @param year - Year (defaults to current year)
 * @param month - Month 1-12 (defaults to current month)
 * @returns Date object at midnight on the 1st of that month
 */
export function getStartOfMonthInTimezone(
  timezone: string = 'Asia/Manila',
  year?: number,
  month?: number
): Date {
  const now = new Date();

  if (year === undefined) {
    const dateStr = formatDateInTimezone(now, timezone, 'yyyy');
    year = parseInt(dateStr, 10);
  }

  if (month === undefined) {
    const dateStr = formatDateInTimezone(now, timezone, 'MM');
    month = parseInt(dateStr, 10);
  }

  return new Date(year, month - 1, 1);
}

/**
 * Get end of month in a timezone
 *
 * @param timezone - IANA timezone string
 * @param year - Year (defaults to current year)
 * @param month - Month 1-12 (defaults to current month)
 * @returns Date object at 23:59:59 on the last day of that month
 */
export function getEndOfMonthInTimezone(
  timezone: string = 'Asia/Manila',
  year?: number,
  month?: number
): Date {
  const now = new Date();

  if (year === undefined) {
    const dateStr = formatDateInTimezone(now, timezone, 'yyyy');
    year = parseInt(dateStr, 10);
  }

  if (month === undefined) {
    const dateStr = formatDateInTimezone(now, timezone, 'MM');
    month = parseInt(dateStr, 10);
  }

  // Get first day of next month, then subtract 1 day
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const firstOfNext = new Date(nextYear, nextMonth - 1, 1);
  const lastOfCurrent = new Date(firstOfNext.getTime() - 1000); // 1 second before midnight

  return lastOfCurrent;
}

/**
 * Check if two dates are the same day in a timezone
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @param timezone - IANA timezone string
 * @returns true if dates are same day
 */
export function isSameDayInTimezone(
  date1: Date,
  date2: Date,
  timezone: string = 'Asia/Manila'
): boolean {
  const str1 = formatDateInTimezone(date1, timezone, 'yyyy-MM-dd');
  const str2 = formatDateInTimezone(date2, timezone, 'yyyy-MM-dd');
  return str1 === str2;
}

/**
 * Get number of days between two dates (in a timezone)
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param timezone - IANA timezone string
 * @returns Number of days (positive if endDate > startDate)
 */
export function daysBetweenInTimezone(
  startDate: Date,
  endDate: Date,
  timezone: string = 'Asia/Manila'
): number {
  const str1 = formatDateInTimezone(startDate, timezone, 'yyyy-MM-dd');
  const str2 = formatDateInTimezone(endDate, timezone, 'yyyy-MM-dd');

  const d1 = new Date(str1);
  const d2 = new Date(str2);

  const diffMs = d2.getTime() - d1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Convert ISO timestamp to Manila timezone string (convenient for display)
 *
 * @param isoString - ISO 8601 timestamp
 * @param format - Output format (defaults to 'MMM dd, yyyy HH:mm')
 * @returns Formatted date string in Manila timezone
 *
 * Example:
 * isoToManilaTime('2026-03-15T02:30:00Z', 'MMMM dd, yyyy')
 * => 'March 15, 2026' (10:30 AM Manila time, but only shows date)
 */
export function isoToManilaTime(isoString: string, format: string = 'MMM dd, yyyy HH:mm'): string {
  const date = new Date(isoString);
  return formatDateInTimezone(date, 'Asia/Manila', format);
}

/**
 * Get human-readable relative time in Manila timezone
 *
 * @param date - Date to format
 * @returns String like "2 hours ago", "tomorrow", "in 3 days"
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const todayStart = getTodayInTimezone('Asia/Manila');
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  // Normalize to dates only (strip time)
  const targetDate = getTodayInTimezone('Asia/Manila');
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  const diffMs = compareDate.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const hourDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (hourDiff < 1) {
      const minDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return minDiff <= 1 ? 'just now' : `${minDiff} minutes ago`;
    }
    return hourDiff === 1 ? '1 hour ago' : `${hourDiff} hours ago`;
  } else if (diffDays === -1) {
    return 'tomorrow';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 0) {
    return `in ${-diffDays} days`;
  } else {
    return `${diffDays} days ago`;
  }
}
