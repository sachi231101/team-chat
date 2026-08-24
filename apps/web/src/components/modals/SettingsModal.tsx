import React from 'react';
import { Palette, Bell, Keyboard, Moon, Sun, Monitor } from 'lucide-react';
import { useUiStore } from '../../stores';
import { Modal, Button } from '../ui';

const sectionTitleStyle: React.CSSProperties = {
  color: 'var(--color-text-primary)',
};

const sectionDescStyle: React.CSSProperties = {
  color: 'var(--color-text-secondary)',
};

const optionCardStyle = (selected: boolean): React.CSSProperties => ({
  background: selected ? 'var(--color-accent-muted)' : 'var(--color-input)',
  border: selected ? '1px solid var(--color-active-border)' : '1px solid var(--color-border)',
  color: selected ? 'var(--color-active-text)' : 'var(--color-text-secondary)',
});

const panelStyle: React.CSSProperties = {
  background: 'var(--color-input)',
  border: '1px solid var(--color-border)',
};

const kbdStyle: React.CSSProperties = {
  background: 'var(--color-elevated)',
  color: 'var(--color-text-tertiary)',
  border: '1px solid var(--color-border)',
};

export const SettingsModal: React.FC = () => {
  const {
    settingsModalOpen,
    setSettingsModalOpen,
    theme,
    setTheme,
    density,
    setDensity,
    soundEnabled,
    setSoundEnabled,
  } = useUiStore();

  return (
    <Modal
      isOpen={settingsModalOpen}
      onClose={() => setSettingsModalOpen(false)}
      title="Preferences & Settings"
      description="Customize your Team Chat interface, notifications, and workflow shortcuts."
      maxWidth="lg"
    >
      <div className="mt-4 space-y-6">
        {/* Appearance */}
        <div>
          <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={sectionTitleStyle}>
            <Palette className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
            <span>Theme & Colors</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'dark', label: 'Dark Charcoal', icon: Moon, desc: 'High contrast dark' },
              { id: 'slate', label: 'Slate Navy', icon: Monitor, desc: 'Deep subtle slate' },
              { id: 'light', label: 'Light Clean', icon: Sun, desc: 'Crisp light mode' },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id as 'dark' | 'slate' | 'light')}
                  className="flex flex-col items-start rounded-xl p-3 text-left transition-all"
                  style={optionCardStyle(isSelected)}
                >
                  <Icon
                    className="mb-1.5 h-5 w-5"
                    style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }}
                  />
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {t.label}
                  </span>
                  <span className="mt-0.5 text-[10px]" style={sectionDescStyle}>
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Density */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider" style={sectionTitleStyle}>
            Message Display Density
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['comfortable', 'compact'] as const).map((option) => {
              const isSelected = density === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDensity(option)}
                  className="flex flex-col rounded-xl p-3 text-left transition-all"
                  style={optionCardStyle(isSelected)}
                >
                  <span className="text-xs font-semibold capitalize" style={{ color: 'var(--color-text-primary)' }}>
                    {option}
                  </span>
                  <span className="mt-0.5 text-[11px]" style={sectionDescStyle}>
                    {option === 'comfortable'
                      ? 'Spacious layout with rich avatars & timeline gaps'
                      : 'Condensed row heights for maximum chat density'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications & Sound */}
        <div className="flex items-center justify-between rounded-xl p-3.5" style={panelStyle}>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Notification Sounds
              </p>
              <p className="text-[11px]" style={sectionDescStyle}>
                Play audio ping for incoming mentions and direct messages
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            style={{ background: soundEnabled ? 'var(--color-accent)' : 'var(--color-border)' }}
          >
            <span
              className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              style={{ transform: soundEnabled ? 'translateX(1.25rem)' : 'translateX(0)' }}
            />
          </button>
        </div>

        {/* Keyboard shortcuts guide */}
        <div>
          <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={sectionTitleStyle}>
            <Keyboard className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
            <span>Keyboard Shortcuts</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {[
              ['Quick Search', 'Ctrl K'],
              ['Send message', 'Enter'],
              ['New line', 'Shift Enter'],
              ['Close modal / Thread', 'Esc'],
            ].map(([label, key]) => (
              <div key={label} className="flex justify-between rounded-lg p-2" style={panelStyle}>
                <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
                <kbd className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={kbdStyle}>
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <Button variant="primary" onClick={() => setSettingsModalOpen(false)}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
