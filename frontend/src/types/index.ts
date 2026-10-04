export interface User {
  id: string;
  email: string;
}

export interface DayStatus {
  id: number;
  month: number;
  day: number;
  status_text: string;
  status_color?: string | null;
  updated_by?: {
    id: string;
    email: string;
  } | null;
  updated_at: string;
}

export interface MonthInfo {
  month: number; // 1-12
  name: string;
  shortName: string;
  maxDays: number;
}

export const MONTHS_DATA: MonthInfo[] = [
  { month: 1, name: 'January', shortName: 'Jan', maxDays: 31 },
  { month: 2, name: 'February', shortName: 'Feb', maxDays: 28 }, // capped at 28 as per spec
  { month: 3, name: 'March', shortName: 'Mar', maxDays: 31 },
  { month: 4, name: 'April', shortName: 'Apr', maxDays: 30 },
  { month: 5, name: 'May', shortName: 'May', maxDays: 31 },
  { month: 6, name: 'June', shortName: 'Jun', maxDays: 30 },
  { month: 7, name: 'July', shortName: 'Jul', maxDays: 31 },
  { month: 8, name: 'August', shortName: 'Aug', maxDays: 31 },
  { month: 9, name: 'September', shortName: 'Sep', maxDays: 30 },
  { month: 10, name: 'October', shortName: 'Oct', maxDays: 31 },
  { month: 11, name: 'November', shortName: 'Nov', maxDays: 30 },
  { month: 12, name: 'December', shortName: 'Dec', maxDays: 31 },
];

export const STATUS_COLORS = [
  { name: 'Emerald', value: '#10b981', label: 'Completed / Great' },
  { name: 'Blue', value: '#3b82f6', label: 'In Progress / Normal' },
  { name: 'Indigo', value: '#6366f1', label: 'Milestone / Focus' },
  { name: 'Amber', value: '#f59e0b', label: 'Pending / Alert' },
  { name: 'Rose', value: '#f43f5e', label: 'Blocked / Critical' },
  { name: 'Purple', value: '#a855f7', label: 'Special / Event' },
  { name: 'Slate', value: '#64748b', label: 'Neutral / Note' },
];
