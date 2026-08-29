import { getApiBaseUrl } from './env';

const API_BASE_URL = getApiBaseUrl();

/** Append mock identity query so <img>/<a> can hit gated /uploads without custom headers. */
function withMockIdentity(url: string): string {
  if (typeof localStorage === 'undefined') return url;
  const userId = localStorage.getItem('team_chat_user_id') || 'usr-rahul';
  const workplaceId = 'wp-teamchat-main';
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
