import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@client/api/client.js';

export const useUsersQuery = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });
};

interface CreateUserInput {
  name: string;
  email: string;
}

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, email }: CreateUserInput) => apiClient.createUser(name, email),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
