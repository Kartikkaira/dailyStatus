import { DayStatus, User } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Includes httpOnly cookies for refresh token
  };

  const response = await fetch(url, config);

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (typeof data === 'object' && data !== null && (data.error || data.message)) ||
      `Request failed with status ${response.status}`;
    const details = typeof data === 'object' ? data.details : undefined;
    throw new ApiError(errorMessage, response.status, details);
  }

  return data as T;
}

export const authApi = {
  async register(email: string, password: string): Promise<{ user: User; accessToken: string }> {
    return request<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
    return request<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async refresh(): Promise<{ user: User; accessToken: string }> {
    return request<{ user: User; accessToken: string }>('/auth/refresh', {
      method: 'POST',
    });
  },

  async logout(): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },
};

export const daysApi = {
  async getAllDays(): Promise<{ count: number; days: DayStatus[] }> {
    return request<{ count: number; days: DayStatus[] }>('/days', {
      method: 'GET',
      cache: 'no-store',
    });
  },

  async getDay(month: number, day: number): Promise<DayStatus> {
    return request<DayStatus>(`/days/${month}/${day}`, {
      method: 'GET',
      cache: 'no-store',
    });
  },

  async upsertDay(
    month: number,
    day: number,
    statusText: string,
    statusColor?: string | null,
    token?: string | null
  ): Promise<{ message: string; data: DayStatus }> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return request<{ message: string; data: DayStatus }>(`/days/${month}/${day}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status_text: statusText,
        status_color: statusColor,
      }),
    });
  },
};
