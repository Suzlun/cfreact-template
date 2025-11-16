import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@client/api/client.js';

export const useHelloQuery = () => {
  return useQuery({
    queryKey: ['hello'],
    queryFn: () => apiClient.getHello(),
  });
};
