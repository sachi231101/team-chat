import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUiStore, type NavEntry } from '../stores';

function pathForEntry(entry: NavEntry) {
  return entry.type === 'channel' ? `/channels/${entry.id}` : `/conversations/${entry.id}`;
}

function parsePath(pathname: string): NavEntry | null {
  const channelMatch = pathname.match(/^\/channels\/([^/]+)/);
  if (channelMatch) return { type: 'channel', id: channelMatch[1] };
  const conversationMatch = pathname.match(/^\/conversations\/([^/]+)/);
  if (conversationMatch) return { type: 'conversation', id: conversationMatch[1] };
  return null;
}

function entryState(entry: NavEntry) {
  return {
    activeId: entry.id,
    activeType: entry.type,
    activeRailTab: 'chat' as const,
    chatHeaderTab: 'messages' as const,
  };
}

export function useChatNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const syncingFromUrl = useRef(false);
  const syncingToUrl = useRef(false);

  useEffect(() => {
    if (syncingToUrl.current) {
      syncingToUrl.current = false;
      return;
    }

    const entry = parsePath(location.pathname);
    if (!entry) return;

    const state = useUiStore.getState();
    if (state.activeId === entry.id && state.activeType === entry.type) return;

    syncingFromUrl.current = true;
    const stackIndex = state.navStack.findIndex(
      (item) => item.type === entry.type && item.id === entry.id,
    );

    if (stackIndex >= 0) {
      useUiStore.setState({ ...entryState(entry), navIndex: stackIndex });
    } else {
      state.applyNavigation(entry, { recordHistory: false });
    }
    syncingFromUrl.current = false;
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = useUiStore.subscribe((state, prev) => {
      if (syncingFromUrl.current) return;
      if (state.activeId === prev.activeId && state.activeType === prev.activeType) return;
      if (!state.activeId) return;

      const path = pathForEntry({ type: state.activeType, id: state.activeId });
      if (location.pathname === path) return;

      syncingToUrl.current = true;
      navigate(path);
    });

    return unsubscribe;
  }, [location.pathname, navigate]);
}
