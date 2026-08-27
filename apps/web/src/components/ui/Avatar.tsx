import React, { useEffect, useState } from 'react';
import { UserStatus } from '@team-chat/shared';
import { cn } from '../../lib/utils';
import { resolveAssetUrl } from '../../lib/assets';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: UserStatus;
  className?: string;
  showStatus?: boolean;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-16 h-16 text-xl',
};

const statusSizeMap = {
  xs: 'w-2 h-2 ring-1',
  sm: 'w-2.5 h-2.5 ring-1.5',
  md: 'w-3 h-3 ring-2',
  lg: 'w-3.5 h-3.5 ring-2',
  xl: 'w-4 h-4 ring-2',
};

const statusColors: Record<UserStatus, string> = {
  online: 'bg-emerald-500',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
  offline: 'bg-slate-400',
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  status,
  className,
  showStatus = Boolean(status),
}) => {
  const [imageError, setImageError] = useState(false);
  const resolvedSrc = resolveAssetUrl(src);

  useEffect(() => {
    setImageError(false);
  }, [resolvedSrc]);

  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase() || 'U';
  };

  const getRandomColor = (n: string) => {
    const colors = [
      'bg-indigo-600',
      'bg-violet-600',
      'bg-blue-600',
      'bg-emerald-600',
      'bg-amber-600',
      'bg-rose-600',
      'bg-teal-600',
      'bg-cyan-600',
    ];
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={cn('relative inline-flex shrink-0 select-none items-center justify-center rounded-xl font-medium text-white shadow-sm', sizeMap[size], className)}>
      {resolvedSrc && !imageError ? (
        <img
          src={resolvedSrc}
          alt={name}
          onError={() => setImageError(true)}
          className="h-full w-full rounded-xl object-cover"
        />
      ) : (
        <div className={cn('flex h-full w-full items-center justify-center rounded-xl font-semibold', getRandomColor(name))}>
          {getInitials(name)}
        </div>
      )}

      {showStatus && status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full ring-slate-900',
            statusColors[status],
            statusSizeMap[size],
          )}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
