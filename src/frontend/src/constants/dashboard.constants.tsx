import type { ReactElement } from 'react';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';
import ErrorIcon from '@mui/icons-material/Error';
import BlockIcon from '@mui/icons-material/Block';
import ScienceIcon from '@mui/icons-material/Science';
import { SUCCESS_COLOR, DANGER_COLOR } from './filterColors';

export const VIEW_MODE_STORAGE_KEY = 'djoppie-dashboard-view-mode';

export const SEARCH_DEBOUNCE_MS = 300;
export const EXPIRING_LEASES_DAYS = 90;

export type SortOption = 'name-asc' | 'name-desc' | 'code-asc' | 'code-desc' | 'date-newest' | 'date-oldest';

export interface StatusCardConfig {
  key: string;
  label: string;
  color: string;
  gradientLight: string;
  gradientDark: string;
  shadowColor: string;
  icon: ReactElement;
}

export const STATUS_CARDS: StatusCardConfig[] = [
  {
    key: 'Nieuw',
    label: 'Nieuw',
    color: '#00BCD4',
    gradientLight: 'linear-gradient(135deg, rgba(0,188,212,0.15) 0%, rgba(77,208,225,0.08) 100%)',
    gradientDark: 'linear-gradient(135deg, rgba(0,188,212,0.25) 0%, rgba(0,151,167,0.15) 100%)',
    shadowColor: 'rgba(0,188,212,0.3)',
    icon: <FiberNewIcon />,
  },
  {
    key: 'InGebruik',
    label: 'In gebruik',
    color: SUCCESS_COLOR, // From filterColors.ts
    gradientLight: 'linear-gradient(135deg, rgba(76,175,80,0.15) 0%, rgba(129,199,132,0.08) 100%)',
    gradientDark: 'linear-gradient(135deg, rgba(76,175,80,0.25) 0%, rgba(56,142,60,0.15) 100%)',
    shadowColor: 'rgba(76,175,80,0.3)',
    icon: <CheckCircleIcon />,
  },
  {
    key: 'Stock',
    label: 'Stock',
    color: '#2196F3',
    gradientLight: 'linear-gradient(135deg, rgba(33,150,243,0.15) 0%, rgba(100,181,246,0.08) 100%)',
    gradientDark: 'linear-gradient(135deg, rgba(33,150,243,0.25) 0%, rgba(25,118,210,0.15) 100%)',
    shadowColor: 'rgba(33,150,243,0.3)',
    icon: <InventoryIcon />,
  },
  {
    key: 'Herstelling',
    label: 'Herstelling',
    color: '#FF9800',
    gradientLight: 'linear-gradient(135deg, rgba(255,152,0,0.15) 0%, rgba(255,183,77,0.08) 100%)',
    gradientDark: 'linear-gradient(135deg, rgba(255,152,0,0.25) 0%, rgba(245,124,0,0.15) 100%)',
    shadowColor: 'rgba(255,152,0,0.3)',
    icon: <BuildIcon />,
  },
  {
    key: 'Defect',
    label: 'Defect',
    color: DANGER_COLOR, // From filterColors.ts
    gradientLight: 'linear-gradient(135deg, rgba(244,67,54,0.15) 0%, rgba(239,83,80,0.08) 100%)',
    gradientDark: 'linear-gradient(135deg, rgba(244,67,54,0.25) 0%, rgba(211,47,47,0.15) 100%)',
    shadowColor: 'rgba(244,67,54,0.3)',
    icon: <ErrorIcon />,
  },
  {
    key: 'UitDienst',
    label: 'Uit dienst',
    color: '#78909C',
    gradientLight: 'linear-gradient(135deg, rgba(120,144,156,0.15) 0%, rgba(176,190,197,0.08) 100%)',
    gradientDark: 'linear-gradient(135deg, rgba(120,144,156,0.25) 0%, rgba(84,110,122,0.15) 100%)',
    shadowColor: 'rgba(120,144,156,0.3)',
    icon: <BlockIcon />,
  },
];

export const DUMMY_STATUS_CONFIG: StatusCardConfig = {
  key: 'Dummy',
  label: 'Dummy',
  color: '#9C27B0',
  gradientLight: 'linear-gradient(135deg, rgba(156,39,176,0.15) 0%, rgba(186,104,200,0.08) 100%)',
  gradientDark: 'linear-gradient(135deg, rgba(156,39,176,0.25) 0%, rgba(123,31,162,0.15) 100%)',
  shadowColor: 'rgba(156,39,176,0.3)',
  icon: <ScienceIcon />,
};
