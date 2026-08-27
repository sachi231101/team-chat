import React, { useState } from 'react';
import {
  Settings,
  X,
  Palette,
  Bell,
  Keyboard,
  Moon,
  Sun,
  Monitor,
  MessageSquare,
  User,
  Volume2,
  VolumeX,
  Focus,
  CornerDownLeft,
} from 'lucide-react';
import { useUiStore } from '../../stores';
import { Button } from '../ui';

type SettingsSection = 'appearance' | 'messages' | 'notifications' | 'shortcuts';

const SECTIONS: Array<{ id: SettingsSection; label: string; icon: typeof Palette }> = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
];

const SHORTCUTS_BASE: Array<{ label: string; keys: string; id?: string }> = [
  { label: 'Search', keys: 'Ctrl K' },
  { id: 'send', label: 'Send message', keys: 'Enter' },
  { id: 'newline', label: 'New line', keys: 'Shift Enter' },
  { label: 'Bold', keys: 'Ctrl B' },
  { label: 'Italic', keys: 'Ctrl I' },
  { label: 'Underline', keys: 'Ctrl U' },
  { label: 'Close panel / modal', keys: 'Esc' },
];

function Toggle({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
      style={{ background: enabled ? 'var(--color-accent)' : 'var(--color-border)' }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        style={{ transform: enabled ? 'translateX(1.25rem)' : 'translateX(0)' }}
      />
    </button>
  );
}

export const SettingsView: React.FC = () => {
  const [section, setSection] = useState<SettingsSection>('appearance');
  const {
    setSettingsModalOpen,
    setProfileModalOpen,
    theme,
    setTheme,
    density,
    setDensity,
    soundEnabled,
    setSoundEnabled,
    sendWithEnter,
    setSendWithEnter,
    dndEnabled,
    setDnd,
  } = useUiStore();

  const close = () => setSettingsModalOpen(false);

  const optionCard = (selected: boolean): React.CSSProperties => ({
    background: selected ? 'var(--color-accent-muted)' : 'var(--color-elevated)',
    border: selected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
  });

  const panelStyle: React.CSSProperties = {
    background: 'var(--color-elevated)',
    border: '1px solid var(--color-border)',
  };

  const kbdStyle: React.CSSProperties = {
    background: 'var(--color-input)',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden" style={{ background: 'var(--color-main)' }}>
      <div
        className="flex h-[49px] shrink-0 items-center justify-between px-6"
        style={{ background: 'var(--color-header)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Preferences
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              close();
              setProfileModalOpen(true);
            }}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors hover-surface"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <User className="h-3.5 w-3.5" />
            Profile
          </button>
          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover-surface"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close preferences"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Section nav */}
        <nav
          className="hidden w-44 shrink-0 flex-col gap-0.5 overflow-y-auto border-r p-3 sm:flex"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-header)' }}
        >
          {SECTIONS.map(({ id, label, icon: Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors"
                style={{
                  background: active ? 'var(--color-accent-muted)' : 'transparent',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto">
          {/* Mobile section chips */}
          <div
            className="flex gap-1.5 overflow-x-auto px-4 py-2 sm:hidden"
            style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
          >
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold"
                style={{
                  background: section === id ? 'var(--color-accent-muted)' : 'transparent',
                  color: section === id ? 'var(--color-active-text)' : 'var(--color-text-secondary)',
                  border: section === id ? '1px solid var(--color-active-border)' : '1px solid transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mx-auto w-full max-w-2xl space-y-6 px-6 py-6 pb-10">
            {section === 'appearance' && (
              <>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                    Theme
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {[
                      { id: 'dark' as const, label: 'Dark Charcoal', icon: Moon, desc: 'High contrast dark' },
                      { id: 'slate' as const, label: 'Slate Navy', icon: Monitor, desc: 'Deep subtle slate' },
                      { id: 'light' as const, label: 'Light Clean', icon: Sun, desc: 'Crisp light mode' },
                    ].map((t) => {
                      const Icon = t.icon;
                      const selected = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTheme(t.id)}
                          className="flex flex-col items-start rounded-xl p-3.5 text-left transition-all"
                          style={optionCard(selected)}
                        >
                          <Icon
                            className="mb-2 h-5 w-5"
                            style={{ color: selected ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }}
                          />
                          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {t.label}
                          </span>
                          <span className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                            {t.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                    Message density
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      {
                        id: 'comfortable' as const,
                        label: 'Comfortable',
                        desc: 'More space between messages',
                      },
                      {
                        id: 'compact' as const,
                        label: 'Compact',
                        desc: 'Tighter rows, more on screen',
                      },
                    ]).map((option) => {
                      const selected = density === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setDensity(option.id)}
                          className="rounded-xl p-3.5 text-left transition-all"
                          style={optionCard(selected)}
                        >
                          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {option.label}
                          </span>
                          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                            {option.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {section === 'messages' && (
              <>
                <div className="flex items-center justify-between rounded-xl p-3.5" style={panelStyle}>
                  <div className="flex items-start gap-3">
                    <CornerDownLeft className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        Press Enter to send
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {sendWithEnter
                          ? 'Enter sends · Shift+Enter adds a new line'
                          : 'Enter adds a new line · Ctrl+Enter sends'}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={sendWithEnter}
                    onToggle={() => setSendWithEnter(!sendWithEnter)}
                    label="Press Enter to send"
                  />
                </div>

                <div
                  className="rounded-xl border p-3.5 text-xs leading-relaxed"
                  style={{
                    ...panelStyle,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Formatting shortcuts (Ctrl+B / I / U) always work in the composer, regardless of send settings.
                </div>
              </>
            )}

            {section === 'notifications' && (
              <>
                <div className="flex items-center justify-between rounded-xl p-3.5" style={panelStyle}>
                  <div className="flex items-start gap-3">
                    {soundEnabled ? (
                      <Volume2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                    ) : (
                      <VolumeX className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                    )}
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        Notification sounds
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                        Play a sound for mentions and direct messages
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={soundEnabled}
                    onToggle={() => setSoundEnabled(!soundEnabled)}
                    label="Notification sounds"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl p-3.5" style={panelStyle}>
                  <div className="flex items-start gap-3">
                    <Focus className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        Do not disturb
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                        Mute notification sounds while you focus (badge counts still update)
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={dndEnabled}
                    onToggle={() => setDnd(!dndEnabled)}
                    label="Do not disturb"
                  />
                </div>
              </>
            )}

            {section === 'shortcuts' && (
              <div className="grid gap-1.5 sm:grid-cols-2">
                {SHORTCUTS_BASE.map((item) => {
                  let keys = item.keys;
                  if (item.id === 'send') {
                    keys = sendWithEnter ? 'Enter' : 'Ctrl Enter';
                  }
                  if (item.id === 'newline') {
                    keys = sendWithEnter ? 'Shift Enter' : 'Enter';
                  }
                  return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs"
                    style={panelStyle}
                  >
                    <span style={{ color: 'var(--color-text-primary)' }}>{item.label}</span>
                    <kbd className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={kbdStyle}>
                      {keys}
                    </kbd>
                  </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
              <Button type="button" variant="primary" onClick={close}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
