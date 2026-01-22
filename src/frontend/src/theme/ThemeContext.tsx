import { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { ThemeProvider, createTheme, PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => { },
});

export const useThemeMode = () => useContext(ThemeContext);

interface DjoppieThemeProviderProps {
  children: ReactNode;
}

export const DjoppieThemeProvider = ({ children }: DjoppieThemeProviderProps) => {
  // Load theme preference from localStorage or default to light (neumorphism works best in light mode)
  const [mode, setMode] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem('djoppie-theme-mode');
    return (saved as PaletteMode) || 'light';
  });

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('djoppie-theme-mode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
              // Light mode - Professional Neumorphic Style with Enhanced Contrast
              primary: {
                main: '#FF7700', // Djoppie Orange
                light: '#FF9233',
                dark: '#E06900',
                contrastText: '#FFFFFF',
              },
              secondary: {
                main: '#CC0000', // Dark Red
                light: '#FF3333',
                dark: '#990000',
                contrastText: '#FFFFFF',
              },
              background: {
                default: '#E8EAF0', // Deeper gray-blue background for better contrast
                paper: '#FFFFFF', // Pure white for cards and papers
              },
              text: {
                primary: '#1A1D29', // Darker text for better readability
                secondary: '#4A5568', // Stronger secondary text
              },
              success: {
                main: '#10B981',
                light: '#34D399',
                dark: '#059669',
              },
              warning: {
                main: '#F59E0B',
                light: '#FBBF24',
                dark: '#D97706',
              },
              error: {
                main: '#EF4444',
                light: '#F87171',
                dark: '#DC2626',
              },
              info: {
                main: '#3B82F6',
                light: '#60A5FA',
                dark: '#2563EB',
              },
              divider: 'rgba(0, 0, 0, 0.08)',
            }
            : {
              // Dark mode - Enhanced Contrast Neumorphic Dark
              primary: {
                main: '#FF9233',
                light: '#FFAD66',
                dark: '#FF7700',
                contrastText: '#FFFFFF',
              },
              secondary: {
                main: '#FF3333',
                light: '#FF6666',
                dark: '#CC0000',
                contrastText: '#FFFFFF',
              },
              background: {
                default: '#0F1117', // Darker background for better contrast
                paper: '#1C1F28', // Lighter paper for clear distinction
              },
              text: {
                primary: '#F7FAFC', // Brighter white for better readability
                secondary: '#CBD5E0', // Clearer secondary text
              },
              success: {
                main: '#34D399',
                light: '#6EE7B7',
                dark: '#10B981',
              },
              warning: {
                main: '#FBBF24',
                light: '#FCD34D',
                dark: '#F59E0B',
              },
              error: {
                main: '#F87171',
                light: '#FCA5A5',
                dark: '#EF4444',
              },
              info: {
                main: '#60A5FA',
                light: '#93C5FD',
                dark: '#3B82F6',
              },
              divider: 'rgba(255, 255, 255, 0.08)',
            }),
        },
        typography: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
          h1: {
            fontWeight: 700,
            letterSpacing: '-0.025em',
            fontSize: '3rem',
          },
          h2: {
            fontWeight: 700,
            letterSpacing: '-0.025em',
            fontSize: '2.25rem',
          },
          h3: {
            fontWeight: 600,
            letterSpacing: '-0.025em',
            fontSize: '1.875rem',
          },
          h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
          },
          h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
          },
          h6: {
            fontWeight: 600,
            fontSize: '1.125rem',
          },
          button: {
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.025em',
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                padding: '10px 24px',
                boxShadow: mode === 'light'
                  ? '0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.05)'
                  : '0 2px 4px rgba(0, 0, 0, 0.6), 0 4px 8px rgba(0, 0, 0, 0.4)',
                border: 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  transition: 'left 0.5s ease',
                },
                '&:hover': {
                  boxShadow: mode === 'light'
                    ? '0 4px 8px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(255, 119, 0, 0.2)'
                    : '0 4px 8px rgba(0, 0, 0, 0.8), 0 8px 16px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(255, 119, 0, 0.3)',
                  transform: 'translateY(-2px)',
                },
                '&:hover::before': {
                  left: '100%',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: mode === 'light'
                    ? '0 1px 2px rgba(0, 0, 0, 0.08)'
                    : '0 1px 2px rgba(0, 0, 0, 0.6)',
                },
              },
              contained: {
                background: 'linear-gradient(145deg, #FF9233, #FF7700)',
                color: '#FFFFFF',
                border: 'none',
                '&:hover': {
                  background: 'linear-gradient(145deg, #FFAD66, #FF9233)',
                },
                '&:active': {
                  background: 'linear-gradient(145deg, #FF7700, #E06900)',
                },
              },
              outlined: {
                borderColor: mode === 'light' ? '#FF7700' : '#FF9233',
                color: mode === 'light' ? '#FF7700' : '#FF9233',
                borderWidth: '2px',
                background: mode === 'light' ? '#FFFFFF' : '#1C1F28',
                '&:hover': {
                  borderColor: mode === 'light' ? '#E06900' : '#FFAD66',
                  borderWidth: '2px',
                  background: mode === 'light'
                    ? 'rgba(255, 119, 0, 0.05)'
                    : 'rgba(255, 146, 51, 0.1)',
                },
              },
              text: {
                color: mode === 'light' ? '#FF7700' : '#FF9233',
                '&:hover': {
                  background: mode === 'light'
                    ? 'rgba(255, 119, 0, 0.08)'
                    : 'rgba(255, 146, 51, 0.12)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                border: 'none',
                background: mode === 'light' ? '#FFFFFF' : '#1C1F28',
                boxShadow: mode === 'light'
                  ? '0 2px 8px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)'
                  : '0 2px 8px rgba(0, 0, 0, 0.8), 0 4px 16px rgba(0, 0, 0, 0.6)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                '&:hover': {
                  boxShadow: mode === 'light'
                    ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(255, 119, 0, 0.2)'
                    : '0 4px 12px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.7), 0 2px 8px rgba(255, 119, 0, 0.3)',
                  transform: 'translateY(-4px)',
                },
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  background: mode === 'light' ? '#FFFFFF' : '#1C1F28',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& fieldset': {
                    borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)',
                    borderWidth: '1px',
                  },
                  '&:hover fieldset': {
                    borderColor: mode === 'light' ? 'rgba(255, 119, 0, 0.4)' : 'rgba(255, 146, 51, 0.4)',
                  },
                  '&.Mui-focused': {
                    boxShadow: mode === 'light'
                      ? '0 0 0 3px rgba(255, 119, 0, 0.1)'
                      : '0 0 0 3px rgba(255, 146, 51, 0.2)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: mode === 'light' ? '#FF7700' : '#FF9233',
                    borderWidth: '2px',
                  },
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 20,
                fontWeight: 600,
                fontSize: '0.8125rem',
                boxShadow: mode === 'light'
                  ? '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.05)'
                  : '0 1px 2px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)',
                border: mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: mode === 'light'
                    ? '0 2px 4px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)'
                    : '0 2px 4px rgba(0, 0, 0, 0.7), 0 4px 8px rgba(0, 0, 0, 0.5)',
                  transform: 'scale(1.05)',
                },
              },
              filled: {
                background: mode === 'light'
                  ? 'linear-gradient(145deg, #F5F7FA, #E8EAF0)'
                  : 'linear-gradient(145deg, #252932, #1C1F28)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backgroundColor: mode === 'light' ? '#FFFFFF' : '#1C1F28',
                boxShadow: mode === 'light'
                  ? '0 2px 8px rgba(0, 0, 0, 0.08)'
                  : '0 2px 8px rgba(0, 0, 0, 0.6)',
                borderBottom: mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                transition: 'all 0.25s ease',
                background: mode === 'light' ? '#FFFFFF' : '#1C1F28',
              },
              elevation0: {
                boxShadow: 'none',
              },
              elevation1: {
                boxShadow: mode === 'light'
                  ? '0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05)'
                  : '0 1px 3px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.4)',
              },
              elevation2: {
                boxShadow: mode === 'light'
                  ? '0 2px 8px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)'
                  : '0 2px 8px rgba(0, 0, 0, 0.8), 0 4px 16px rgba(0, 0, 0, 0.6)',
              },
              elevation3: {
                boxShadow: mode === 'light'
                  ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1)'
                  : '0 4px 12px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.7)',
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: mode === 'light'
                  ? '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.05)'
                  : '0 1px 2px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: mode === 'light'
                    ? '0 2px 4px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)'
                    : '0 2px 4px rgba(0, 0, 0, 0.7), 0 4px 8px rgba(0, 0, 0, 0.5)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                  boxShadow: mode === 'light'
                    ? '0 1px 2px rgba(0, 0, 0, 0.08) inset'
                    : '0 1px 2px rgba(0, 0, 0, 0.6) inset',
                },
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: mode === 'light'
                  ? '1px solid rgba(0, 0, 0, 0.08)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              },
              head: {
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.8125rem',
                borderBottom: mode === 'light'
                  ? '2px solid rgba(0, 0, 0, 0.12)'
                  : '2px solid rgba(255, 255, 255, 0.12)',
              },
            },
          },
          MuiLinearProgress: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                height: 8,
                backgroundColor: mode === 'light'
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.08)',
              },
              bar: {
                borderRadius: 12,
                background: 'linear-gradient(90deg, #FF9233, #FF7700, #CC0000)',
              },
            },
          },
          MuiCircularProgress: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#FF7700' : '#FF9233',
              },
            },
          },
          MuiBottomNavigation: {
            styleOverrides: {
              root: {
                background: mode === 'light' ? '#FFFFFF' : '#1C1F28',
                boxShadow: mode === 'light'
                  ? '0 -2px 8px rgba(0, 0, 0, 0.08)'
                  : '0 -2px 8px rgba(0, 0, 0, 0.6)',
                borderTop: mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
              },
            },
          },
          MuiBottomNavigationAction: {
            styleOverrides: {
              root: {
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: 12,
                margin: '4px',
                '&:hover': {
                  background: mode === 'light'
                    ? 'rgba(255, 119, 0, 0.08)'
                    : 'rgba(255, 146, 51, 0.12)',
                  boxShadow: mode === 'light'
                    ? '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.05)'
                    : '0 1px 2px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)',
                },
                '&.Mui-selected': {
                  color: mode === 'light' ? '#FF7700' : '#FF9233',
                  boxShadow: mode === 'light'
                    ? '0 1px 2px rgba(0, 0, 0, 0.08) inset'
                    : '0 1px 2px rgba(0, 0, 0, 0.6) inset',
                  background: mode === 'light'
                    ? 'rgba(255, 119, 0, 0.1)'
                    : 'rgba(255, 146, 51, 0.15)',
                },
              },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === 'light'
                  ? '0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.05)'
                  : '0 2px 4px rgba(0, 0, 0, 0.6), 0 4px 8px rgba(0, 0, 0, 0.4)',
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  color: mode === 'light' ? '#FF7700' : '#FF9233',
                },
              },
            },
          },
          MuiTabs: {
            styleOverrides: {
              indicator: {
                background: 'linear-gradient(90deg, #FF9233, #FF7700, #CC0000)',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
