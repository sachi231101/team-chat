import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setStoredToken, setStoredUserId, setStoredWorkplaceId } from '../../lib/currentUser';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    return JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export const SsoBootstrapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const workspaceId = searchParams.get('workspaceId') || searchParams.get('workplaceId');

    if (token) {
      setStoredToken(token);

      const decoded = decodeJwtPayload(token);
      if (decoded) {
        const userId = (decoded.userId || decoded.sub || decoded.id) as string | undefined;
        const wsId = (decoded.workspaceId || decoded.workplaceId) as string | undefined;
        if (userId) setStoredUserId(userId);
        if (wsId) setStoredWorkplaceId(wsId);
      }

      if (workspaceId) {
        setStoredWorkplaceId(workspaceId);
      }
    }

    navigate('/', { replace: true });
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="text-sm">Signing you in via Workplace Platform…</p>
      </div>
    </div>
  );
};
