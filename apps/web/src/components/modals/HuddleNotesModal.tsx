import React, { useState } from 'react';
import { Modal, Button } from '../ui';
import { chatService } from '../../services';
import { useUiStore } from '../../stores';

interface HuddleNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HuddleNotesModal: React.FC<HuddleNotesModalProps> = ({ isOpen, onClose }) => {
  const [transcript, setTranscript] = useState('');
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const { activeId, activeType, activeThreadId, setError } = useUiStore();

  const run = async (postAsMessage: boolean) => {
    setBusy(true);
    try {
      const result = await chatService.meetingNotesWithAi({
        transcript: transcript.trim() || undefined,
        channelId: activeType === 'channel' ? activeId : undefined,
        conversationId: activeType === 'conversation' ? activeId : undefined,
        parentMessageId: activeThreadId ?? undefined,
        postAsMessage,
      });
      setNotes(result.notes);
      if (postAsMessage) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate huddle notes');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Huddle notes"
      description="Paste a transcript or use the current channel/thread. MeetingAgent posts notes to the chat when you choose Post."
    >
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={6}
        placeholder="Optional: paste huddle transcript. Leave blank to use the current conversation."
        className="form-textarea mt-3 w-full rounded-lg px-3 py-2 text-xs"
      />
      {notes && (
        <div
          className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg p-3 text-xs"
          style={{ background: 'var(--color-input)', color: 'var(--color-text-primary)' }}
        >
          {notes}
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" type="button" disabled={busy} onClick={() => void run(false)}>
          Preview
        </Button>
        <Button variant="primary" type="button" disabled={busy} onClick={() => void run(true)}>
          Post notes
        </Button>
      </div>
    </Modal>
  );
};
