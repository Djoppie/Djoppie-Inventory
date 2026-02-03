import { createContext } from 'react';
import { PaletteMode } from '@mui/material';

export interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => { },
});
