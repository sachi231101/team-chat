import React from 'react';
import {
  Headphones,
  Bot,
  SlidersHorizontal,
  Keyboard,
  Sparkles,
  Layers,
  Workflow,
} from 'lucide-react';
import { useChatDataStore } from '../../stores';

export interface MoreMenuPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreMenuPopover: React.FC<MoreMenuPopoverProps> = ({ isOpen, onClose }) => {
  const { setSettingsModalOpen, setSearchModalOpen } = useChatDataStore();

  if (!isOpen) return null;

  const menuSections = [
    {
      title: 'Workplace Tools',
      items: [
        {
          icon: <Layers className="h-4 w-4 text-violet-400" />,
          title: 'Canvases',
          subtitle: 'Create docs, notes, and collaborative boards',
          action: () => {
            onClose();
          },
        },
        {
          icon: <Headphones className="h-4 w-4 text-emerald-400" />,
          title: 'Huddles',
          subtitle: 'Start an audio/video team huddle',
          action: () => {
            onClose();
          },
        },
        {
          icon: <Bot className="h-4 w-4 text-sky-400" />,
          title: 'Slackbot',
          subtitle: 'Your personal AI assistant and reminders',
          action: () => {
            onClose();
          },
        },
        {
          icon: <Workflow className="h-4 w-4 text-amber-400" />,
          title: 'Workflows & Automations',
          subtitle: 'Automate repetitive tasks with webhooks',
          action: () => {
            onClose();
          },
        },
      ],
    },
    {
      title: 'Preferences & Help',
      items: [
        {
          icon: <SlidersHorizontal className="h-4 w-4 text-indigo-400" />,
          title: 'Preferences',
          subtitle: 'Theme, notifications, density, and sound',
          action: () => {
            setSettingsModalOpen(true);
            onClose();
          },
        },
        {
          icon: <Keyboard className="h-4 w-4 text-slate-400" />,
          title: 'Keyboard Shortcuts',
          subtitle: 'Quick navigation (⌘K, ⌘/, Esc)',
          action: () => {
            setSearchModalOpen(true);
            onClose();
          },
        },
      ],
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed left-[72px] bottom-16 z-50 w-72 rounded-2xl p-3 shadow-2xl animate-in fade-in zoom-in-95"
        style={{
          background: 'var(--color-modal)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
            More from Team Chat
          </span>
        </div>

        <div className="space-y-3">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={item.action}
                    className="flex items-start gap-2.5 w-full rounded-xl p-2 text-left transition-colors hover:bg-white/5"
                  >
                    <div className="mt-0.5 rounded-lg p-1 shrink-0" style={{ background: 'var(--color-input)' }}>
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                        {item.title}
                      </p>
                      <p className="text-[10px] mt-0.5 leading-tight truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
