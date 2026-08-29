export function getApiBaseUrl(): string {
  const value = import.meta.env.VITE_API_URL;
  if (value === '') return '';
  return value || 'http://localhost:3000';
}

export function getWsUrl(): string {
  const ws = import.meta.env.VITE_WS_URL;
  const api = import.meta.env.VITE_API_URL;
  if (ws === '') {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  if (ws) return ws;
  if (api && api.startsWith('/')) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return 'http://localhost:3000';
}
