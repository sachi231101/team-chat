import { getApiBaseUrl } from './env';
import {
  getStoredToken,
  getStoredUserId,
  getStoredWorkplaceId,
  shouldSendMockIdentityHeaders,
} from './currentUser';

const API_BASE_URL = getApiBaseUrl();

/** Append mock identity query so <img>/<a> can hit gated /uploads without custom headers. */
function withMockIdentity(url: string): string {
  if (!shouldSendMockIdentityHeaders()) return url;
  const userId = getStoredUserId();
  const workplaceId = getStoredWorkplaceId();
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}x-user-id=${encodeURIComponent(userId)}&x-workplace-id=${encodeURIComponent(workplaceId)}`;
}

export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/uploads/')) {
        return withMockIdentity(url);
      }
    } catch {
      return url;
    }
    return url;
  }
  if (url.startsWith('/uploads/')) {
    return withMockIdentity(`${API_BASE_URL}${url}`);
  }
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return url;
}
