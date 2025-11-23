import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@cfreact-template/ui';

import type { UsersActions, UsersData } from '@cfreact-template-client/domain';
import { useUsers } from '@cfreact-template-client/domain';

import type { FormEvent } from 'react';

function PageHeader() {
  return (
    <Stack spacing={0.5}>
      <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={1}>
        User Directory
      </Typography>
      <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '0.2px' }}>
        Users
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Create users, validate inputs, and view them in a responsive table.
      </Typography>
    </Stack>
  );
}

function CreateUserForm({ data, actions }: { data: UsersData; actions: UsersActions }) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void actions.submit();
  };

  return (
    <Card>
      <CardHeader
        title="Create New User"
        subheader="名前とメールアドレスを入力してユーザーを作成します"
        slotProps={{ title: { sx: { fontWeight: 700 } } }}
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Name"
                placeholder="Name"
                value={data.form.name}
                onChange={(e) => {
                  actions.updateName(e.target.value);
                }}
                required
                fullWidth
                autoComplete="name"
              />
              <TextField
                label="Email"
                type="email"
                placeholder="Email"
                value={data.form.email}
                onChange={(e) => {
                  actions.updateEmail(e.target.value);
                }}
                required
                fullWidth
                autoComplete="email"
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={data.isSubmitting || !data.form.isValid}
                data-loading={data.isSubmitting ? 'true' : 'false'}
                startIcon={
                  data.isSubmitting ? <CircularProgress size={18} color="inherit" /> : null
                }
              >
                Create User
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                disabled={data.isSubmitting}
                onClick={() => {
                  actions.reload();
                }}
              >
                Refresh List
              </Button>
            </Stack>
            {data.isSubmitting && <LinearProgress color="primary" sx={{ borderRadius: 999 }} />}
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}

function UsersTable({ data }: { data: UsersData }) {
  if (data.list.length === 0) {
    return (
      <Paper variant="outlined" sx={{ textAlign: 'center', py: 6, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          No users found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create one above to get started.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Created At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.list.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.createdAt.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function UsersPage() {
  const { data, actions } = useUsers();

  return (
    <Stack spacing={3}>
      <PageHeader />
      <CreateUserForm data={data} actions={actions} />

      {data.isLoading && (
        <Paper
          variant="outlined"
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 2 }}
        >
          <CircularProgress size={24} />
          <Typography variant="body1">Loading users...</Typography>
        </Paper>
      )}

      {data.error != null && (
        <Alert severity="error" sx={{ mb: 1 }}>
          <AlertTitle>Error loading users</AlertTitle>
          {data.error.message}
        </Alert>
      )}

      {!data.isLoading && <UsersTable data={data} />}

      <Divider />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Powered by Cloudflare Workers + Hono + Drizzle
        </Typography>
      </Stack>
    </Stack>
  );
}
