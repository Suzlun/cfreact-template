import { Box, Heading, Text, Spinner, Alert } from '@cfreact-template/ui';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client.js';

export function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['hello'],
    queryFn: () => apiClient.getHello(),
  });

  return (
    <Box>
      <Heading size="2xl" mb={6}>
        Welcome to cfreact-template
      </Heading>

      <Box bg="gray.50" p={6} borderRadius="lg" shadow="sm">
        <Heading size="lg" mb={4}>
          API Response
        </Heading>

        {isLoading && <Spinner size="lg" />}

        {error != null && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Title>Error loading data</Alert.Title>
            <Alert.Description>{error.message}</Alert.Description>
          </Alert.Root>
        )}

        {data != null && (
          <Box>
            <Text fontSize="lg" mb={2}>
              <strong>Message:</strong> {data.message}
            </Text>
            <Text fontSize="sm" color="gray.600">
              <strong>Timestamp:</strong> {data.timestamp}
            </Text>
          </Box>
        )}
      </Box>

      <Box mt={8}>
        <Heading size="lg" mb={4}>
          Tech Stack
        </Heading>
        <Box as="ul" pl={6}>
          <li>React 19.0</li>
          <li>Vite 7.2</li>
          <li>React Router 7.9</li>
          <li>TanStack Query 5.90</li>
          <li>Chakra UI 3.28</li>
          <li>Hono 4.10</li>
          <li>Drizzle ORM 0.44</li>
          <li>TypeScript 5.9</li>
        </Box>
      </Box>
    </Box>
  );
}
