import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Heading,
  Table,
  Spinner,
  Alert,
  Button,
  Input,
  Stack,
  Card,
  Text,
} from '@cfreact-template/ui';
import { apiClient } from '../lib/api-client.js';

export function UsersPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });

  const createUserMutation = useMutation({
    mutationFn: () => apiClient.createUser(name, email),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      setName('');
      setEmail('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      createUserMutation.mutate();
    }
  };

  return (
    <Box>
      <Heading size="2xl" mb={6}>
        Users
      </Heading>

      <Card.Root mb={8}>
        <Card.Header>
          <Card.Title>Create New User</Card.Title>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Box>
                <Input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Box>
              <Box>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Box>
              <Button type="submit" colorScheme="brand" loading={createUserMutation.isPending}>
                Create User
              </Button>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>

      {isLoading && <Spinner size="lg" />}

      {error && (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>Error loading users</Alert.Title>
          <Alert.Description>{error.message}</Alert.Description>
        </Alert.Root>
      )}

      {users && users.length > 0 && (
        <Table.Root variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>ID</Table.ColumnHeader>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader>Email</Table.ColumnHeader>
              <Table.ColumnHeader>Created At</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((user) => (
              <Table.Row key={user.id}>
                <Table.Cell>{user.id}</Table.Cell>
                <Table.Cell>{user.name}</Table.Cell>
                <Table.Cell>{user.email}</Table.Cell>
                <Table.Cell>{new Date(user.createdAt).toLocaleString()}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}

      {users && users.length === 0 && (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg" color="gray.500">
            No users found. Create one above!
          </Text>
        </Box>
      )}
    </Box>
  );
}
