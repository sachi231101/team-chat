import { useChatDataStore } from '../stores';

export function useCurrentUser() {
  const currentUser = useChatDataStore((s) => s.currentUser);
  const isLoading = useChatDataStore((s) => s.isLoading);

  return {
    user: currentUser,
    isLoading,
  };
}
