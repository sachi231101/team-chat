import React, { useState } from 'react';
import { MessageCircleQuestion } from 'lucide-react';
import { Tooltip } from '../ui';
import { AskAiPanel } from './AskAiPanel';

interface AskAiMenuProps {
  channelId?: string;
  conversationId?: string;
}

export const AskAiMenu: React.FC<AskAiMenuProps> = ({ channelId, conversationId }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip content="Ask AI" side="bottom">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Ask AI"
        >
          <MessageCircleQuestion className="h-4 w-4" />
        </button>
      </Tooltip>
      <AskAiPanel
        open={open}
        onClose={() => setOpen(false)}
        channelId={channelId}
        conversationId={conversationId}
      />
    </>
  );
};
