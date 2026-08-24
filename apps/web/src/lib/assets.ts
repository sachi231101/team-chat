const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return url;
}
