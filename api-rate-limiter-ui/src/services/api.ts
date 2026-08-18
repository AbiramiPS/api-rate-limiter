const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorDetails: string | undefined;

    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData.details;
      } catch {
        // If parsing fails, use default message
      }
    } else {
      errorMessage = await response.text() || errorMessage;
    }

    throw new ApiError(errorMessage, response.status, errorDetails);
  }

  if (isJson && response.status !== 204) {
    return response.json();
  }

  return undefined as T;
}

export async function get<T>(url: string, params?: Record<string, string | number>): Promise<T> {
  const queryString = params
    ? '?' + new URLSearchParams(params as Record<string, string>).toString()
    : '';
  const response = await fetch(`${API_BASE_URL}${url}${queryString}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<T>(response);
}

export async function post<T>(url: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<T>(response);
}

export async function put<T>(url: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<T>(response);
}

export async function patch<T>(url: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<T>(response);
}

export async function del<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<T>(response);
}

export interface RedisHealth {
  connected: boolean;
  redisVersion: string;
  memoryUsed: number;
  totalKeys: number;
}

export interface RedisKeyInfo {
  key: string;
  category: string;
  value: string | null;
  ttl: number | null;
  clientId: string;
}

export async function getRedisHealth(): Promise<RedisHealth> {
  return get<RedisHealth>('/admin/redis/health');
}

export async function getRedisCounters(): Promise<RedisKeyInfo[]> {
  return get<RedisKeyInfo[]>('/admin/redis/counters');
}

export async function getRedisRules(): Promise<RedisKeyInfo[]> {
  return get<RedisKeyInfo[]>('/admin/redis/rules');
}

export async function resetRateLimitCounter(clientId: string): Promise<void> {
  return del<void>(`/admin/redis/rate-limit/${encodeURIComponent(clientId)}`);
}

export async function flushRedisKeys(): Promise<void> {
  return del<void>('/admin/redis/flush-all');
}

export async function executeRedisTest(clientId: string): Promise<{
  allowed: boolean;
  status: number;
  message: string;
  ttlSeconds: number;
  currentCount: number;
  maxRequests: number;
  windowValue: number;
  windowUnit: string;
  source: string;
}> {
  const response = await fetch(`${API_BASE_URL}/admin/redis/docker-test`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-clientId': clientId,
    },
  });

  const status = response.status;
  const limitHeader = response.headers.get('X-RateLimit-Limit');
  const remainingHeader = response.headers.get('X-RateLimit-Remaining');
  const resetHeader = response.headers.get('X-RateLimit-Reset');

  const maxRequests = limitHeader ? parseInt(limitHeader, 10) : 0;
  const remaining = remainingHeader ? parseInt(remainingHeader, 10) : 0;
  const ttlSeconds = resetHeader ? parseInt(resetHeader, 10) : 0;
  const currentCount = maxRequests - remaining;

  if (status === 429) {
    let message = 'Rate limit exceeded';
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {}
    return {
      allowed: false,
      status,
      message,
      ttlSeconds,
      currentCount: maxRequests,
      maxRequests,
      windowValue: 1, // Default or mock fallback if not present, interceptor doesn't pass it back directly in headers but we can estimate
      windowUnit: 'MINUTE',
      source: 'Redis Interceptor',
    };
  }

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      try {
        const text = await response.text();
        if (text) message = text;
      } catch {}
    }
    throw new ApiError(message, status);
  }

  return {
    allowed: true,
    status,
    message: `HTTP 200: Request permitted (${currentCount}/${maxRequests} requests)`,
    ttlSeconds,
    currentCount,
    maxRequests,
    windowValue: 1,
    windowUnit: 'MINUTE',
    source: 'Redis Interceptor',
  };
}

