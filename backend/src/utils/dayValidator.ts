// Maximum days per month (capped at 28 for February as specified: no leap-year logic needed)
export const DAYS_IN_MONTH: Record<number, number> = {
  1: 31,  // January
  2: 28,  // February (capped at 28)
  3: 31,  // March
  4: 30,  // April
  5: 31,  // May
  6: 30,  // June
  7: 31,  // July
  8: 31,  // August
  9: 30,  // September
  10: 31, // October
  11: 30, // November
  12: 31, // December
};

export const MONTH_NAMES: Record<number, string> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
};

export interface DayValidationResult {
  isValid: boolean;
  message?: string;
  maxDays?: number;
}

export function validateMonthAndDay(month: number, day: number): DayValidationResult {
  if (isNaN(month) || !Number.isInteger(month) || month < 1 || month > 12) {
    return {
      isValid: false,
      message: 'Month must be an integer between 1 and 12.',
    };
  }

  const maxDays = DAYS_IN_MONTH[month];

  if (isNaN(day) || !Number.isInteger(day) || day < 1 || day > maxDays) {
    const monthName = MONTH_NAMES[month];
    return {
      isValid: false,
      message: `Invalid day for ${monthName} (month ${month}). Day must be between 1 and ${maxDays}.`,
      maxDays,
    };
  }

  return {
    isValid: true,
    maxDays,
  };
}
