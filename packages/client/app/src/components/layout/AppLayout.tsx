import {
  AppBar,
  Box,
  Container,
  Link,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@cfreact-template/ui';
import { Link as RouterLink, Outlet } from 'react-router';

/** Shared layout for the main app routes. */
function AppLayout() {
  return (
    <Box
      minHeight="100vh"
      sx={{
        backgroundColor: 'transparent',
        pb: 6,
      }}
    >
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: 'blur(14px)',
          backgroundColor: 'rgba(255,255,255,0.8)',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container>
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: 72, gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.2px' }}>
              cfreact-template
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Link component={RouterLink} to="/" color="inherit" fontWeight={600}>
                Home
              </Link>
              <Link component={RouterLink} to="/users" color="inherit" fontWeight={600}>
                Users
              </Link>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Container sx={{ pt: 4 }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.5, sm: 3, md: 4 },
            borderRadius: 3,
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255,255,255,0.85) 100%)`,
            boxShadow: '0px 12px 32px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}

export { AppLayout };
