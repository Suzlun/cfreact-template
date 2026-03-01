import { alpha, createTheme, responsiveFontSizes, type Shadows } from '@mui/material/styles';

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#5ea7ff',
      main: '#2563eb',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      light: '#c084fc',
      main: '#8b5cf6',
      dark: '#6d28d9',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#334155',
    },
    divider: alpha('#0f172a', 0.08),
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: `'Inter', 'Noto Sans JP', 'Segoe UI', system-ui, -apple-system, sans-serif`,
    h1: { fontWeight: 700, letterSpacing: '0.4px' },
    h2: { fontWeight: 700, letterSpacing: '0.3px' },
    h3: { fontWeight: 700, letterSpacing: '0.25px' },
    h4: { fontWeight: 700, letterSpacing: '0.2px' },
    h5: { fontWeight: 700, letterSpacing: '0.15px' },
    h6: { fontWeight: 700, letterSpacing: '0.1px' },
    button: { fontWeight: 600 },
  },
  shadows: (() => {
    const base = Array(25).fill('none') as Shadows;
    base[1] = '0px 10px 30px rgba(37, 99, 235, 0.06)';
    base[2] = '0px 14px 42px rgba(15, 23, 42, 0.08)';
    return base;
  })(),
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(circle at 20% 20%, rgba(37,99,235,0.08), transparent 28%), radial-gradient(circle at 80% 0%, rgba(139,92,246,0.08), transparent 25%), linear-gradient(180deg, #f7f9fc 0%, #f5f7fb 40%, #f7f9fc 100%)',
          color: '#0f172a',
          minHeight: '100vh',
          fontFeatureSettings: '"cv02","cv03","ss01"',
        },
        '*': {
          scrollBehavior: 'smooth',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 999,
          paddingInline: 16,
        },
        contained: {
          boxShadow: '0px 10px 30px rgba(37, 99, 235, 0.18)',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: alpha('#0f172a', 0.08),
          boxShadow: '0px 12px 32px rgba(15, 23, 42, 0.06)',
          transition: 'transform 180ms ease, box-shadow 180ms ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 16px 40px rgba(15, 23, 42, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: alpha('#0f172a', 0.06),
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: 'lg',
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${alpha('#0f172a', 0.06)}`,
        },
      },
    },
  },
});

/** Application theme with responsive typography. */
export const theme = responsiveFontSizes(baseTheme);
