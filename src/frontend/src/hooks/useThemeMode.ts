import { useContext } from 'react';
import { ThemeContext } from '../theme/ThemeContextType';

export const useThemeMode = () => useContext(ThemeContext);
