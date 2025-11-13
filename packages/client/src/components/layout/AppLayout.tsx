import { Box, Container, Flex, Heading, Link } from '@cfreact-template/ui';
import { Link as RouterLink, Outlet } from 'react-router';

export function AppLayout() {
  return (
    <Box minH="100vh">
      <Box as="header" bg="brand.600" color="white" py={4} shadow="md">
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Heading size="lg">cfreact-template</Heading>
            <Flex gap={6}>
              <Link asChild color="white" _hover={{ color: 'brand.200' }}>
                <RouterLink to="/">Home</RouterLink>
              </Link>
              <Link asChild color="white" _hover={{ color: 'brand.200' }}>
                <RouterLink to="/users">Users</RouterLink>
              </Link>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        <Outlet />
      </Container>
    </Box>
  );
}
