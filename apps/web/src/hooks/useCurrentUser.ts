import { useWorkspace } from './useChatQueries';

export function useCurrentUser() {
  const { currentUser, isLoading } = useWorkspace();
  return {
    user: currentUser,
    isLoading,
  };
}
