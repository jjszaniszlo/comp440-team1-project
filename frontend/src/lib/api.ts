import type { TokenResponse, UserLogin, UserResponse, UserSignup } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'auth_token';

const dispatchAuthChange = () => {
  window.dispatchEvent(new Event('auth-change'));
};

export const tokenStorage = {
  get: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  set: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
    dispatchAuthChange();
  },

  remove: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    dispatchAuthChange();
  },

  exists: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};

export class ApiError extends Error {
  status: number;
  statusText: string;
  data?: unknown;

  constructor(status: number, statusText: string, data?: unknown) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (error instanceof ApiError) {
    if (error.data && typeof error.data === 'object' && 'detail' in error.data) {
      const detail = (error.data as { detail: unknown }).detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return error.statusText || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (requiresAuth) {
    const token = tokenStorage.get();
    if (!token) {
      throw new ApiError(401, 'Unauthorized', { detail: 'No authentication token found' });
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (response.status === 401 && requiresAuth) {
        tokenStorage.remove();
      }
      throw new ApiError(response.status, response.statusText, data);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    const data = isJson ? await response.json() : await response.text();

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'Network Error', { detail: (error as Error).message });
  }
}

export const api = {
  get: <T>(endpoint: string, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'GET' }, requiresAuth),

  post: <T>(endpoint: string, data?: unknown, requiresAuth = true) =>
    apiRequest<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      requiresAuth
    ),

  put: <T>(endpoint: string, data?: unknown, requiresAuth = true) =>
    apiRequest<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      requiresAuth
    ),

  patch: <T>(endpoint: string, data?: unknown, requiresAuth = true) =>
    apiRequest<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      requiresAuth
    ),

  delete: <T>(endpoint: string, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }, requiresAuth),

  auth: {
    signup: async (userSignup: UserSignup): Promise<UserResponse> => {
      const response = await api.post<UserResponse>(
        '/auth/signup',
        userSignup,
        false
      );
      return response;
    },

    login: async (userLogin: UserLogin): Promise<TokenResponse> => {
      const response = await api.post<TokenResponse>(
        '/auth/login',
        userLogin,
        false
      );
      tokenStorage.set(response.access_token);
      return response;
    },

    logout: () => {
      tokenStorage.remove();
    },

    isAuthenticated: (): boolean => {
      return tokenStorage.exists();
    },
  },
};

export function useApi() {
  return api;
}
