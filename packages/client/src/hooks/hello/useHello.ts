import { useQuery } from '@tanstack/react-query';

import { helloApi } from '@client/api';

export interface HelloData {
  message: string;
  timestamp: Date | null;
  isLoading: boolean;
  error?: Error;
}

export interface HelloActions {
  refresh: () => void;
}

export function useHello(): { data: HelloData; actions: HelloActions } {
  const query = useQuery({
    queryKey: ['hello'],
    queryFn: () => helloApi.get(),
  });

  const data: HelloData = {
    message: query.data?.message ?? '',
    timestamp: query.data?.timestamp ?? null,
    isLoading: query.isPending,
    error: query.error ?? undefined,
  };

  const actions: HelloActions = {
    refresh: () => {
      void query.refetch();
    },
  };

  return {
    data,
    actions,
  };
}
