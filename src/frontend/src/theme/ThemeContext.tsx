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
  // Load theme preference from localStorage or default to dark
  const [mode, setMode] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem('djoppie-theme-mode');
    return (saved as PaletteMode) || 'dark';
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
              // Light mode - Vintage Amber Terminal style
              primary: {
                main: '#FDB931', // Warm Gold
                light: '#FFD700',
                dark: '#DAA520',
                contrastText: '#000000',
              },
              secondary: {
                main: '#E07B28', // Djoppie Orange
                light: '#ff9a4d',
                dark: '#c25d10',
                contrastText: '#ffffff',
              },
              background: {
                default: '#f5f7fa', // Light gray background
                paper: '#ffffff',
              },
              text: {
                primary: '#1a1f36', // Dark text
                secondary: '#4a5568',
              },
              success: {
                main: '#00ff88', // Green (console style)
                light: '#5fffb0',
                dark: '#00cc6b',
              },
              warning: {
                main: '#ffb86c', // Amber
                light: '#ffd699',
                dark: '#ff9c3d',
              },
              error: {
                main: '#ff5555', // Red
                light: '#ff8888',
                dark: '#ff2222',
              },
              info: {
                main: '#FDB931', // Warm Gold
                light: '#FFD700',
                dark: '#DAA520',
              },
              divider: 'rgba(0, 0, 0, 0.12)',
            }
            : {
              // Dark mode - Cyberpunk Retrofuturistic style
              primary: {
                main: '#FFD700', // Rich Gold
                light: '#FFED4E',
                dark: '#FDB931',
                contrastText: '#0a0e27',
              },
              secondary: {
                main: '#E07B28', // Djoppie Orange
                light: '#ff9a4d',
                dark: '#c25d10',
                contrastText: '#ffffff',
              },
              background: {
                default: '#0a0e27', // Deep navy (console background)
                paper: '#141829', // Slightly lighter navy
              },
              text: {
                primary: '#e6edf3', // Light text
                secondary: '#8b949e',
              },
              success: {
                main: '#00ff88', // Bright green
                light: '#5fffb0',
                dark: '#00cc6b',
              },
              warning: {
                main: '#ffb86c', // Amber
                light: '#ffd699',
                dark: '#ff9c3d',
              },
              error: {
                main: '#ff5555', // Bright red
                light: '#ff8888',
                dark: '#ff2222',
              },
              info: {
                main: '#FFD700', // Rich Gold
                light: '#FFED4E',
                dark: '#FDB931',
              },
              divider: 'rgba(255, 215, 0, 0.12)',
            }),
        },
        typography: {
          fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
          h1: {
            fontWeight: 700,
            letterSpacing: '0.02em',
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
          },
          h2: {
            fontWeight: 700,
            letterSpacing: '0.01em',
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
          },
          h3: {
            fontWeight: 600,
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
          },
          h4: {
            fontWeight: 600,
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
          },
          h5: {
            fontWeight: 600,
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
          },
          h6: {
            fontWeight: 600,
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
          },
          button: {
            textTransform: 'uppercase',
            fontWeight: 600,
            letterSpacing: '0.05em',
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
          },
          body1: {
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
          },
          body2: {
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
          },
        },
        shape: {
          borderRadius: 4,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 4,
                padding: '10px 20px',
                boxShadow: 'none',
                border: `1px solid ${mode === 'light' ? '#d1d5db' : 'rgba(255, 215, 0, 0.2)'}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: mode === 'light'
                    ? 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.2), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent)',
                  transition: 'left 0.5s ease',
                },
                '&:hover': {
                  boxShadow: mode === 'light'
                    ? '0 0 20px rgba(253, 185, 49, 0.5), inset 0 0 20px rgba(253, 185, 49, 0.1)'
                    : '0 0 24px rgba(255, 215, 0, 0.7), inset 0 0 24px rgba(255, 215, 0, 0.15)',
                  border: `1px solid ${mode === 'light' ? '#FDB931' : '#FFD700'}`,
                  transform: 'translateY(-2px)',
                },
                '&:hover::before': {
                  left: '100%',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              },
              contained: {
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #FDB931 0%, #FFD700 50%, #FDB931 100%)'
                  : 'linear-gradient(135deg, #FFD700 0%, #FFED4E 50%, #FFD700 100%)',
                backgroundSize: '200% 100%',
                color: mode === 'light' ? '#1a1410' : '#0a0e27',
                border: 'none',
                '&:hover': {
                  background: mode === 'light'
                    ? 'linear-gradient(135deg, #DAA520 0%, #FDB931 50%, #DAA520 100%)'
                    : 'linear-gradient(135deg, #FDB931 0%, #FFD700 50%, #FDB931 100%)',
                  backgroundSize: '200% 100%',
                  boxShadow: mode === 'light'
                    ? '0 0 24px rgba(253, 185, 49, 0.7), inset 0 0 12px rgba(255, 215, 0, 0.3)'
                    : '0 0 28px rgba(255, 215, 0, 0.8), inset 0 0 16px rgba(255, 237, 78, 0.4)',
                },
              },
              outlined: {
                borderColor: mode === 'light' ? '#FDB931' : 'rgba(255, 215, 0, 0.5)',
                color: mode === 'light' ? '#FDB931' : '#FFD700',
                '&:hover': {
                  borderColor: mode === 'light' ? '#FDB931' : '#FFD700',
                  background: mode === 'light'
                    ? 'rgba(253, 185, 49, 0.1)'
                    : 'rgba(255, 215, 0, 0.15)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                border: `1px solid ${mode === 'light' ? '#e5e7eb' : 'rgba(255, 215, 0, 0.15)'}`,
                boxShadow: mode === 'light'
                  ? '0 1px 3px rgba(0, 0, 0, 0.1)'
                  : '0 4px 20px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                backgroundImage: mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.02) 0%, transparent 50%)'
                  : 'none',
                '&:hover': {
                  border: `1px solid ${mode === 'light' ? '#FDB931' : 'rgba(255, 215, 0, 0.4)'}`,
                  boxShadow: mode === 'light'
                    ? '0 4px 20px rgba(253, 185, 49, 0.3)'
                    : '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)',
                  transform: 'translateY(-4px)',
                },
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 4,
                  fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& fieldset': {
                    borderColor: mode === 'light' ? '#d1d5db' : 'rgba(255, 215, 0, 0.2)',
                    transition: 'all 0.3s ease',
                  },
                  '&:hover fieldset': {
                    borderColor: mode === 'light' ? '#FDB931' : 'rgba(255, 215, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: mode === 'light' ? '#FDB931' : '#FFD700',
                    borderWidth: '2px',
                    boxShadow: mode === 'light'
                      ? '0 0 16px rgba(253, 185, 49, 0.4)'
                      : '0 0 20px rgba(255, 215, 0, 0.5), inset 0 0 12px rgba(255, 215, 0, 0.1)',
                  },
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 4,
                fontWeight: 600,
                fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
                border: `1px solid ${mode === 'light' ? '#d1d5db' : 'rgba(255, 215, 0, 0.2)'}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: mode === 'light' ? '#FDB931' : '#FFD700',
                  boxShadow: mode === 'light'
                    ? '0 0 12px rgba(253, 185, 49, 0.3)'
                    : '0 0 16px rgba(255, 215, 0, 0.4)',
                },
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backgroundColor: mode === 'light' ? '#ffffff' : '#0a0e27',
                boxShadow: mode === 'light'
                  ? '0 1px 3px rgba(0, 0, 0, 0.1)'
                  : '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 -1px 0 rgba(255, 215, 0, 0.1)',
                borderBottom: `2px solid ${mode === 'light' ? '#e5e7eb' : 'rgba(255, 215, 0, 0.2)'}`,
                backdropFilter: 'blur(12px)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                transition: 'all 0.3s ease',
              },
              elevation1: {
                boxShadow: mode === 'light'
                  ? '0 1px 3px rgba(0, 0, 0, 0.1)'
                  : '0 4px 20px rgba(0, 0, 0, 0.4)',
              },
              elevation2: {
                boxShadow: mode === 'light'
                  ? '0 3px 6px rgba(0, 0, 0, 0.15)'
                  : '0 8px 32px rgba(0, 0, 0, 0.5)',
              },
              elevation3: {
                boxShadow: mode === 'light'
                  ? '0 6px 12px rgba(0, 0, 0, 0.2)'
                  : '0 12px 40px rgba(0, 0, 0, 0.6)',
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: mode === 'light'
                    ? '0 0 12px rgba(253, 185, 49, 0.3)'
                    : '0 0 16px rgba(255, 215, 0, 0.4)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: `1px solid ${mode === 'light' ? '#e5e7eb' : 'rgba(255, 215, 0, 0.1)'}`,
              },
              head: {
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: `2px solid ${mode === 'light' ? '#d1d5db' : 'rgba(255, 215, 0, 0.3)'}`,
              },
            },
          },
          MuiLinearProgress: {
            styleOverrides: {
              root: {
                borderRadius: 4,
                backgroundColor: mode === 'light'
                  ? 'rgba(253, 185, 49, 0.2)'
                  : 'rgba(255, 215, 0, 0.15)',
              },
              bar: {
                borderRadius: 4,
                background: mode === 'light'
                  ? 'linear-gradient(90deg, #FDB931, #FFD700, #E07B28)'
                  : 'linear-gradient(90deg, #FFD700, #FFED4E, #FDB931)',
                boxShadow: mode === 'light'
                  ? '0 0 8px rgba(253, 185, 49, 0.5)'
                  : '0 0 12px rgba(255, 215, 0, 0.6)',
              },
            },
          },
          MuiCircularProgress: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#FDB931' : '#FFD700',
              },
              circle: {
                filter: mode === 'dark' ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))' : 'none',
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
