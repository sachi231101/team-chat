import React, { useState, useEffect } from 'react';
import { FileCheck2, UserCheck, Check } from 'lucide-react';
import { useChatDataStore } from '../../stores';
import { Modal, Button, Input } from '../ui';

export const CreateApprovalModal: React.FC = () => {
  const {
    approvalModalOpen,
    setApprovalModalOpen,
    actionTargetMessage,
    users,
    currentUser,
  } = useChatDataStore();

  const [title, setTitle] = useState('');
  const [justification, setJustification] = useState('');
  const [approverId, setApproverId] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const eligibleApprovers = users.filter((u) => u.id !== currentUser.id);

  useEffect(() => {
    if (actionTargetMessage) {
      const clean = actionTargetMessage.content.replace(/\n+/g, ' ');
      setTitle(`Approval: ${clean.slice(0, 60)}`);
      setJustification(`Based on message from @${actionTargetMessage.senderName}:\n\n"${actionTargetMessage.content}"`);
      setApproverId(eligibleApprovers[0]?.id || '');
      setIsSuccess(false);
    }
  }, [actionTargetMessage, currentUser.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRequest = () => {
    if (!title.trim() || !approverId) return;

    const approvalPayload = {
      id: `appr-${Date.now()}`,
      title: title.trim(),
      justification: justification.trim(),
      requesterId: currentUser.id,
      approverId,
      status: 'pending',
      sourceMessageId: actionTargetMessage?.id,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('team_chat_approvals') || '[]');
      localStorage.setItem('team_chat_approvals', JSON.stringify([approvalPayload, ...existing]));
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setApprovalModalOpen(false);
    }, 1200);
  };

  const handleClose = () => {
    setIsSuccess(false);
    setApprovalModalOpen(false);
  };

  return (
    <Modal
      isOpen={approvalModalOpen}
      onClose={handleClose}
      title="Request Team Approval"
      description="Create a formal approval request from this message for team lead or executive sign-off."
    >
      <div className="mt-4 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Approval Subject</label>
          <Input
            placeholder="e.g. Sign-off on architecture design spec..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Approver */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
            <UserCheck className="h-3.5 w-3.5 text-violet-400" />
            <span>Select Approver</span>
          </label>
          <select
            value={approverId}
            onChange={(e) => setApproverId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            {eligibleApprovers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.title || 'Lead'})
              </option>
            ))}
          </select>
        </div>

        {/* Justification & Context */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Context & Rationale</label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">
            Formal approval record will be logged
          </span>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!title.trim() || !approverId}
              onClick={handleRequest}
              className="gap-1.5"
            >
              {isSuccess ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Request Sent!</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="h-4 w-4" />
                  <span>Request Approval</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
