import { User } from '@team-chat/shared';

/** Stable dev IDs aligned with Workplace Platform seed workspace `ws-acme-hq`. */
export const DEFAULT_WORKSPACE_ID = 'ws-acme-hq-dev';
export const DEFAULT_CURRENT_USER: User = {
  id: 'usr-dev-rahul',
  name: 'Rahul Sharma',
  email: 'rahul.sharma@teamchat.io',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  title: 'Lead Staff Engineer',
  status: 'online',
  statusMessage: 'Architecting Team Chat',
  workplaceId: DEFAULT_WORKSPACE_ID,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const TOKEN_KEY = 'team_chat_auth_token';
const USER_ID_KEY = 'team_chat_user_id';
const WORKPLACE_ID_KEY = 'team_chat_workplace_id';

function isProductionBuild(): boolean {
  return import.meta.env.PROD;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearStoredAuth() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(WORKPLACE_ID_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(WORKPLACE_ID_KEY);
  }
}

export function getStoredWorkplaceId(): string {
  if (typeof window === 'undefined') return DEFAULT_CURRENT_USER.workplaceId;
  return sessionStorage.getItem(WORKPLACE_ID_KEY) || DEFAULT_CURRENT_USER.workplaceId;
}

export function setStoredWorkplaceId(workplaceId: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(WORKPLACE_ID_KEY, workplaceId);
  }
}

export function getStoredUserId(): string {
  if (typeof window === 'undefined') return DEFAULT_CURRENT_USER.id;
  return sessionStorage.getItem(USER_ID_KEY) || DEFAULT_CURRENT_USER.id;
}

export function setStoredUserId(id: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(USER_ID_KEY, id);
  }
}

/** Whether mock identity headers may be sent (dev-only standalone mode). */
export function shouldSendMockIdentityHeaders(): boolean {
  if (isProductionBuild()) return false;
  if (getStoredToken()) return false;
  return import.meta.env.VITE_ALLOW_MOCK_IDENTITY === 'true';
}
