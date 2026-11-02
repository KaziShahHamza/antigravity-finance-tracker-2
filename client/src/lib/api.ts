// client/src/lib/api.ts

// Fetch-based API client handling base URL prefixing, Bearer token injection, and 401 token refresh retries.

import type { ApiResponse } from '@/types';

export class ApiError extends Error {
  statusCode: number;
  errors?: unknown;

  constructor(message: string, statusCode: number, errors?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryOnUnauthorized?: boolean;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, retryOnUnauthorized = true, ...fetchOptions } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${getBaseUrl()}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(fetchOptions.headers);

  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth && accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : 'Network request failed', 0);
  }

  // Handle 401 Unauthorized with silent refresh attempt
  if (response.status === 401 && retryOnUnauthorized && !skipAuth) {
    try {
      const refreshResponse = await fetch(`${getBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshResponse.ok) {
        const refreshText = await refreshResponse.text();
        const refreshData = (refreshText ? JSON.parse(refreshText) : {}) as ApiResponse<{
          accessToken: string;
        }>;
        if (refreshData.data?.accessToken) {
          setAccessToken(refreshData.data.accessToken);
          return apiClient<T>(endpoint, {
            ...options,
            retryOnUnauthorized: false,
          });
        }
      }
    } catch {
      // Refresh failed; proceed to throw original 401 error
    }
  }

  let data: ApiResponse<T>;
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { success: false, message: text } as ApiResponse<T>;
  }

  if (!response.ok) {
    throw new ApiError(
      data.message || `Request failed with status ${response.status}`,
      response.status,
      data.errors
    );
  }

  return (data.data !== undefined ? data.data : (data as unknown)) as T;
}
