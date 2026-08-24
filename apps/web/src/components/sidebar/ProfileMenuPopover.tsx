import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Smile, ChevronRight } from 'lucide-react';
import { useUiStore } from '../../stores';
import { useWorkspace, useChatMutations } from '../../hooks';
import { Avatar } from '../ui';

export interface ProfileMenuPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect?: DOMRect | null;
}

export const ProfileMenuPopover: React.FC<ProfileMenuPopoverProps> = ({
  isOpen,
  onClose,
  anchorRect,
}) => {
  const { currentUser } = useWorkspace();
  const { updateStatus } = useChatMutations();
  const { setProfileModalOpen, setSettingsModalOpen, soundEnabled, setSoundEnabled } = useUiStore();
  const [statusDraft, setStatusDraft] = useState(currentUser.statusMessage || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStatusDraft(currentUser.statusMessage || '');
  }, [currentUser.statusMessage, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAway = currentUser.status === 'away' || currentUser.status === 'offline';
  const statusLabel = currentUser.status === 'online' ? 'Active' : currentUser.status === 'busy' ? 'Busy' : isAway ? 'Away' : 'Active';
  const statusDot =
    currentUser.status === 'busy'
      ? 'bg-rose-500'
      : isAway
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  const left = anchorRect ? anchorRect.right + 10 : 72;
  const bottom = anchorRect ? Math.max(8, window.innerHeight - anchorRect.bottom) : 16;

  const saveStatusMessage = () => {
    void updateStatus.mutateAsync({
      status: currentUser.status,
      statusMessage: statusDraft.trim() || undefined,
    });
  };

  const toggleAway = () => {
    void updateStatus.mutateAsync({
      status: isAway ? 'online' : 'away',
      statusMessage: currentUser.statusMessage,
    });
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[180]" onClick={onClose} />
      <div
        className="fixed z-[190] w-[280px] overflow-hidden rounded-xl shadow-2xl animate-in fade-in zoom-in-95"
        style={{
          left,
          bottom,
          background: 'var(--color-modal)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-3 px-3.5 pt-3.5 pb-3">
          <Avatar name={currentUser.name} src={currentUser.avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {currentUser.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span className={`h-2 w-2 rounded-full ${statusDot}`} />
              <span className="capitalize">{statusLabel}</span>
            </p>
          </div>
        </div>

        <div className="px-3 pb-2">
          <div
            className="flex items-center gap-2 rounded-lg px-2.5 py-2"
            style={{ background: 'var(--color-input)', border: '1px solid var(--color-border)' }}
          >
            <Smile className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
            <input
              ref={inputRef}
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  saveStatusMessage();
                }
              }}
              onBlur={saveStatusMessage}
              placeholder="Update your status"
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        <div className="py-1" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          <button
            type="button"
            onClick={toggleAway}
            className="flex w-full px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {isAway ? 'Set yourself as active' : 'Set yourself as away'}
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex w-full items-center justify-between px-3.5 py-2 text-[13px] transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <span>Notifications</span>
            <span className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="text-xs">{soundEnabled ? 'On' : 'Off'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>

        <div className="py-1" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              setProfileModalOpen(true);
            }}
            className="flex w-full px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              setSettingsModalOpen(true);
            }}
            className="flex w-full px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Preferences
          </button>
        </div>

        <div className="py-1" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              setProfileModalOpen(true);
            }}
            className="flex w-full px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Sign out of Acme HQ
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
};
