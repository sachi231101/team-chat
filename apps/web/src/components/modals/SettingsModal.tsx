import React from 'react';
import { Palette, Bell, Keyboard, Moon, Sun, Monitor } from 'lucide-react';
import { useChatDataStore } from '../../stores';
import { Modal, Button } from '../ui';
import { cn } from '../../lib/utils';

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
  } = useChatDataStore();

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
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-2.5">
            <Palette className="h-4 w-4 text-indigo-400" />
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
                  className={cn(
                    'flex flex-col items-start p-3 rounded-xl border transition-all text-left',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-md shadow-indigo-950'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700',
                  )}
                >
                  <Icon className={cn('h-5 w-5 mb-1.5', isSelected ? 'text-indigo-400' : 'text-slate-500')} />
                  <span className="text-xs font-semibold text-white">{t.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Density */}
        <div>
          <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
            Message Display Density
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={cn(
                'flex flex-col p-3 rounded-xl border transition-all text-left',
                density === 'comfortable'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700',
              )}
            >
              <span className="text-xs font-semibold text-white">Comfortable</span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Spacious layout with rich avatars & timeline gaps
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={cn(
                'flex flex-col p-3 rounded-xl border transition-all text-left',
                density === 'compact'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700',
              )}
            >
              <span className="text-xs font-semibold text-white">Compact</span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Condensed row heights for maximum chat density
              </span>
            </button>
          </div>
        </div>

        {/* Notifications & Sound */}
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-indigo-400" />
            <div>
              <p className="text-xs font-semibold text-white">Notification Sounds</p>
              <p className="text-[11px] text-slate-400">Play audio ping for incoming mentions and direct messages</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
              soundEnabled ? 'bg-indigo-600' : 'bg-slate-700',
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                soundEnabled ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        {/* Keyboard shortcuts guide */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-2.5">
            <Keyboard className="h-4 w-4 text-indigo-400" />
            <span>Keyboard Shortcuts</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex justify-between rounded-lg bg-slate-900/80 p-2 border border-slate-800">
              <span>Quick Search</span>
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px]">Ctrl K</kbd>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-900/80 p-2 border border-slate-800">
              <span>Send message</span>
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-900/80 p-2 border border-slate-800">
              <span>New line</span>
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px]">Shift Enter</kbd>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-900/80 p-2 border border-slate-800">
              <span>Close modal / Thread</span>
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <Button variant="primary" onClick={() => setSettingsModalOpen(false)}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
