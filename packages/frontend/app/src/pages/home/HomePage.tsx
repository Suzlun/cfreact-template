import { Link as RouterLink } from 'react-router';

import type { HelloData } from '@cfreact-template-frontend/domain';
import { useHello } from '@cfreact-template-frontend/domain';
import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
  Box,
} from '@cfreact-template-frontend/ui';

const techStackItems = [
  'React 19',
  'Vite 7',
  'React Router 7',
  'TanStack Query 5',
  'Material UI 6',
  'Hono 4',
  'Drizzle ORM 0.44',
  'TypeScript 5.9',
  'Cloudflare Workers',
];

function HeroSection({ onRefresh, isLoading }: { onRefresh: () => void; isLoading: boolean }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 3,
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.light}20 0%, ${theme.palette.secondary.light}26 100%)`,
      }}
    >
      <Stack spacing={2}>
        <Chip
          label="Cloudflare · React · Hono"
          color="primary"
          variant="outlined"
          sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
        />
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '0.2px' }}>
          Welcome to cfreact-template
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620 }}>
          フルスタックで Workers を動かすためのスターター。React + TanStack Query + Hono + Drizzle
          をすぐに試せます。
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            component={RouterLink}
            to="/users"
            variant="contained"
            color="primary"
            size="large"
          >
            View Users
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={onRefresh}
            disabled={isLoading}
          >
            Refresh Hello API
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function ApiHealthCard({ data }: { data: HelloData }) {
  return (
    <Card>
      <CardHeader
        title="API Health"
        subheader="Live response from /api/v1/hello"
        slotProps={{ title: { sx: { fontWeight: 700 } } }}
      />
      <CardContent>
        {data.isLoading && (
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" height={18} width="60%" />
            <Skeleton variant="rounded" height={18} width="40%" />
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Fetching latest message...
              </Typography>
            </Stack>
          </Stack>
        )}

        {data.error != null && (
          <Alert severity="error" sx={{ mt: 1 }}>
            <AlertTitle>Error loading data</AlertTitle>
            {data.error.message}
          </Alert>
        )}

        {data.timestamp != null && (
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="body1" fontWeight={700}>
              {data.message}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Timestamp: {data.timestamp.toLocaleString()}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" color="success" label="200 OK" />
              <Chip size="small" variant="outlined" label="Workers" />
              <Chip size="small" variant="outlined" label="Hono" />
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function TechStackCard() {
  return (
    <Card>
      <CardHeader
        title="Tech Stack"
        subheader="What powers this template"
        slotProps={{ title: { sx: { fontWeight: 700 } } }}
      />
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {techStackItems.map((item) => (
            <Chip key={item} label={item} color="primary" variant="outlined" />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

/** Landing page with hello API status and tech stack overview. */
function HomePage() {
  const { data, actions } = useHello();

  return (
    <Stack spacing={4}>
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' },
          alignItems: 'stretch',
        }}
      >
        <HeroSection onRefresh={actions.refresh} isLoading={data.isLoading} />
        <ApiHealthCard data={data} />
      </Box>

      <TechStackCard />
    </Stack>
  );
}

export { HomePage };
