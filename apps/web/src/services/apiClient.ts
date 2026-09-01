import { getApiBaseUrl } from '../lib/env';
import { getStoredToken, getStoredUserId, getStoredWorkplaceId, shouldSendMockIdentityHeaders } from '../lib/currentUser';

const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const authHeaders: Record<string, string> = {};

  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  } else if (shouldSendMockIdentityHeaders()) {
    authHeaders['x-user-id'] = getStoredUserId();
    authHeaders['x-workplace-id'] = getStoredWorkplaceId();
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message: string;
    try {
      const body = await response.json();
      message = body?.message ?? body?.error ?? response.statusText;
      if (Array.isArray(message)) message = message.join(', ');
    } catch {
      message = response.statusText;
    }

    const friendlyMessage = getFriendlyErrorMessage(response.status, message);
    throw new ApiError(response.status, response.statusText, friendlyMessage);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return undefined as T;
  }

  return response.json();
}

function getFriendlyErrorMessage(status: number, detail: string): string {
  switch (status) {
    case 400: return `Invalid request: ${detail}`;
    case 401: return 'Authentication required. Please sign in via Workplace Platform.';
    case 403: return "You don't have access to this resource.";
    case 404: return 'Resource not found.';
    case 409: return `Conflict: ${detail}`;
    case 422: return `Validation error: ${detail}`;
    case 429: return 'Too many requests. Please slow down.';
    case 503: return detail || 'AI is unavailable. Check AI_API_KEY.';
    case 500: return 'Something went wrong on the server. Please try again.';
    default:  return detail || `Request failed (${status})`;
  }
}
