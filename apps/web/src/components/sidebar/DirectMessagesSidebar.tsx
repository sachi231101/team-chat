import React, { useState, useMemo } from "react";
import {
  SquarePen,
  Search,
  ChevronDown,
  Users,
  Sparkles,
  Plus,
} from "lucide-react";
import { useUiStore } from "../../stores";
import { useWorkspace, useChatMutations } from "../../hooks";
import { Avatar, Tooltip } from "../ui";
import { isAgentUserId } from "../../utils/isAgentUserId";
import type { Conversation, User } from "@team-chat/shared";

function isSelfConversation(convo: Conversation, currentUserId: string) {
  const unique = Array.from(new Set(convo.participants));
  return unique.length === 1 && unique[0] === currentUserId;
}

export const DirectMessagesSidebar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadsOnly, setUnreadsOnly] = useState(false);

  const {
    activeId,
    activeType,
    setActiveConversation,
    setPeopleModalOpen,
  } = useUiStore();
  const { conversations, users, currentUser } = useWorkspace();
  const { createConversation } = useChatMutations();

  const selfConversation = conversations.find((c) =>
    isSelfConversation(c, currentUser.id),
  );
  const otherConversations = conversations.filter((c) => {
    if (isSelfConversation(c, currentUser.id)) return false;
    const otherUserId =
      c.participants.find((id) => id !== currentUser.id) || c.participants[0];
    return !isAgentUserId(otherUserId);
  });
  const selfIsActive = Boolean(
    selfConversation &&
    activeType === "conversation" &&
    activeId === selfConversation.id,
  );

  const openSelfNotes = () => {
    if (selfConversation) {
      setActiveConversation(selfConversation.id);
      return;
    }
    createConversation.mutate(currentUser.id, {
      onSuccess: (convo) => {
        setActiveConversation(convo.id);
      },
    });
  };

  const filteredOtherConversations = useMemo(() => {
    return otherConversations.filter((convo) => {
      const otherUserId =
        convo.participants.find((id) => id !== currentUser.id) ||
        convo.participants[0];
      const otherUser = users.find((u) => u.id === otherUserId);
      if (!otherUser) return false;

      if (unreadsOnly && (!convo.unreadCount || convo.unreadCount === 0)) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          otherUser.name.toLowerCase().includes(q) ||
          otherUser.title?.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [otherConversations, users, currentUser.id, unreadsOnly, searchQuery]);

  const userInitial = currentUser.name
    ? currentUser.name.charAt(0).toUpperCase()
    : "U";

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ background: "var(--color-sidebar)" }}
    >
      {/* ── Top Header ─────────────────────────────────────────── */}
      <div
        className="flex h-[49px] shrink-0 items-center justify-between px-3 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-bold truncate rounded px-1 py-1 hover-surface transition-colors"
          style={{ color: "var(--color-text-primary)" }}
        >
          <span>Direct messages</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        </button>

        <div className="flex items-center gap-2">
          {/* Unreads Toggle Switch */}
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span className="text-[11px] font-medium">Unreads</span>
            <button
              type="button"
              role="switch"
              aria-checked={unreadsOnly}
              onClick={() => setUnreadsOnly((prev) => !prev)}
              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                unreadsOnly ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                  unreadsOnly ? "translate-x-3" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* New DM button */}
          <Tooltip content="New direct message" side="bottom">
            <button
              type="button"
              onClick={() => setPeopleModalOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-md hover-surface transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <SquarePen className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Search Bar ─────────────────────────────────────────── */}
      <div className="p-2.5">
        <div
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 border transition-all focus-within:ring-1 focus-within:ring-violet-500"
          style={{
            background: "var(--color-elevated)",
            borderColor: "var(--color-border)",
          }}
        >
          <Search
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: "var(--color-text-tertiary)" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find a DM..."
            className="w-full bg-transparent text-xs outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />
        </div>
      </div>

      {/* ── Scrollable Body ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 space-y-2">
        {/* Coworkers Invite Callout Banner */}
        <div
          className="rounded-xl p-3 border space-y-2 text-xs"
          style={{
            background: "var(--color-elevated)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        >
          <div className="flex items-start gap-2.5">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg mt-0.5"
              style={{
                background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
              }}
            >
              <Users className="h-3.5 w-3.5 text-white" />
            </div>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Team Chat is better when everyone's here. Add your team and get
              the conversation started.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPeopleModalOpen(true)}
            className="w-full py-1.5 px-3 rounded-lg border text-xs font-semibold hover-surface transition-all text-center"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
              background: "var(--color-main)",
            }}
          >
            Browse Teammates
          </button>
        </div>

        {/* ── Self DM Space (You) ───────────────────────────────── */}
        {(!searchQuery ||
          currentUser.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) && (
          <button
            type="button"
            onClick={openSelfNotes}
            className={`flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-all ${
              selfIsActive ? "shadow-sm" : "hover-surface"
            }`}
            style={{
              background: selfIsActive
                ? "var(--color-active-bg)"
                : "transparent",
              color: selfIsActive
                ? "var(--color-active-text)"
                : "var(--color-text-primary)",
            }}
          >
            <div className="relative shrink-0 mt-0.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                style={{ background: "#9333ea" }}
              >
                {userInitial}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold truncate">
                  {currentUser.name}
                </span>
                <span
                  className="text-[11px] font-normal"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  (you)
                </span>
              </div>
              <p
                className="text-[11px] leading-snug line-clamp-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                This is your space. Draft messages, list your to-dos, or keep
                links and files handy.
              </p>
            </div>
          </button>
        )}

        {/* ── Other DM Conversations ────────────────────────────── */}
        <div className="space-y-0.5 pt-1">
          {filteredOtherConversations.map((convo) => {
            const otherUserId =
              convo.participants.find((id) => id !== currentUser.id) ||
              convo.participants[0];
            const otherUser = users.find((u) => u.id === otherUserId);
            if (!otherUser) return null;

            const isActive =
              activeType === "conversation" && activeId === convo.id;
            const hasUnread = Boolean(
              convo.unreadCount && convo.unreadCount > 0,
            );

            return (
              <button
                key={convo.id}
                type="button"
                onClick={() => setActiveConversation(convo.id)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-all ${
                  isActive ? "shadow-sm" : "hover-surface"
                }`}
                style={{
                  background: isActive
                    ? "var(--color-active-bg)"
                    : "transparent",
                  color: isActive
                    ? "var(--color-active-text)"
                    : "var(--color-text-primary)",
                  fontWeight: hasUnread || isActive ? 600 : 400,
                }}
              >
                <div className="flex items-center gap-2.5 truncate min-w-0">
                  <Avatar
                    name={otherUser.name}
                    src={otherUser.avatarUrl}
                    size="sm"
                    status={otherUser.status}
                    showStatus
                  />
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-medium truncate">
                      {otherUser.name}
                    </p>
                    <p
                      className="text-[10px] truncate"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {otherUser.title || "Teammate"}
                    </p>
                  </div>
                </div>

                {hasUnread && !isActive && (
                  <span
                    className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ background: "var(--color-badge)" }}
                  >
                    {convo.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
