import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const QUERY_KEYS = {
  feed: ['feed'],
  stashedIds: ['stashedIds'],
  following: (userId) => ['following', userId],
  exploreFeed: (tab) => ['exploreFeed', tab],
  suggestedUsers: ['suggestedUsers'],
  profile: (username) => ['profile', username],
  decisions: ['decisions'],
  branches: ['branches'],
  userDecisions: (userId) => ['userDecisions', userId],
  comments: (decisionId) => ['comments', decisionId],
  notifications: ['notifications'],
  unreadNotifCount: ['unreadNotifCount'],
  conversations: ['conversations'],
  messages: (convId) => ['messages', convId],
};
