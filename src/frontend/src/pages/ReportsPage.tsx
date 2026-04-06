import { useState, useEffect, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InventoryIcon from '@mui/icons-material/Inventory2';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BusinessIcon from '@mui/icons-material/Business';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BadgeIcon from '@mui/icons-material/Badge';
import DescriptionIcon from '@mui/icons-material/Description';
import RefreshIcon from '@mui/icons-material/Refresh';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { useQueryClient } from '@tanstack/react-query';

import { ROUTES } from '../constants/routes';
import { getNeumorph, getNeumorphColors } from '../utils/neumorphicStyles';
import { getEnhancedTypography, getFadeInUpAnimation } from '../utils/designSystem';
import { ASSET_COLOR, BUILDING_COLOR, SERVICE_COLOR, SECTOR_COLOR, SUCCESS_COLOR, DANGER_COLOR } from '../constants/filterColors';
import type { ReportTab } from '../types/report.types';
import {
  HardwareTab,
  RolloutTab,
  WorkplacesTab,
  SwapsTab,
  LicensesTab,
  LeasingTab,
  SerialNumbersTab,
} from '../components/reports';

// Report tab configuration
const REPORT_TABS: { id: ReportTab; label: string; icon: ReactElement; description: string }[] = [
  {
    id: 'hardware',
    label: 'Hardware Inventaris',
    icon: <InventoryIcon />,
    description: 'Compleet overzicht van alle IT-assets',
  },
  {
    id: 'rollout',
    label: 'Rollout Rapporten',
    icon: <RocketLaunchIcon />,
    description: 'Sessie rapporten en swap checklists',
  },
  {
    id: 'workplaces',
    label: 'Werkplekken',
    icon: <BusinessIcon />,
    description: 'Fysieke werkplek overzicht en bezetting',
  },
  {
    id: 'swaps',
    label: 'Swap Geschiedenis',
    icon: <SwapHorizIcon />,
    description: 'Asset bewegingen en swap historie',
  },
  {
    id: 'licenses',
    label: 'MS365 Licenties',
    icon: <BadgeIcon />,
    description: 'Licentie toewijzingen (E3/E5/F1)',
  },
  {
    id: 'leasing',
    label: 'Leasing',
    icon: <DescriptionIcon />,
    description: 'Lease contracten en vervaldatums',
  },
  {
    id: 'serialnumbers',
    label: 'Serienummers',
    icon: <QrCode2Icon />,
    description: 'Beheer serienummers van rollout assets',
  },
];

// Tab colors (using centralized filterColors)
const TAB_COLORS: Record<ReportTab, string> = {
  hardware: ASSET_COLOR, // Djoppie Orange
  rollout: DANGER_COLOR, // Red
  workplaces: BUILDING_COLOR, // Purple
  swaps: SERVICE_COLOR, // Teal
  licenses: SECTOR_COLOR, // Blue
  leasing: ASSET_COLOR, // Dark Orange (using ASSET_COLOR)
  serialnumbers: SUCCESS_COLOR, // Green
};

const ReportsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  // Get active tab from URL or default to 'hardware'
  const tabParam = searchParams.get('tab') as ReportTab | null;
  const [activeTab, setActiveTab] = useState<ReportTab>(
    tabParam && REPORT_TABS.some(t => t.id === tabParam) ? tabParam : 'hardware'
  );

  // Sync URL with active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: ReportTab) => {
    setActiveTab(newValue);
  };

  // Get current tab config
  const currentTab = REPORT_TABS.find(t => t.id === activeTab) || REPORT_TABS[0];
  const currentColor = TAB_COLORS[activeTab];

  // Handle refresh for current tab
  const handleRefresh = () => {
    // Invalidate queries based on active tab
    switch (activeTab) {
      case 'hardware':
        queryClient.invalidateQueries({ queryKey: ['reports', 'hardware'] });
        break;
      case 'workplaces':
        queryClient.invalidateQueries({ queryKey: ['reports', 'workplaces'] });
        break;
      case 'swaps':
        queryClient.invalidateQueries({ queryKey: ['reports', 'swaps'] });
        break;
      case 'licenses':
        queryClient.invalidateQueries({ queryKey: ['reports', 'licenses'] });
        break;
      case 'leasing':
        queryClient.invalidateQueries({ queryKey: ['reports', 'leases'] });
        break;
      case 'rollout':
        queryClient.invalidateQueries({ queryKey: ['rollouts'] });
        break;
      case 'serialnumbers':
        queryClient.invalidateQueries({ queryKey: ['reports', 'serial-numbers'] });
        break;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          ...getFadeInUpAnimation(0),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Terug naar Dashboard">
            <IconButton
              onClick={() => navigate(ROUTES.DASHBOARD)}
              sx={{
                width: 48,
                height: 48,
                bgcolor: bgBase,
                boxShadow: getNeumorph(isDark, 'soft'),
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: alpha(currentColor, 0.1),
                  boxShadow: `0 0 20px ${alpha(currentColor, 0.3)}`,
                  transform: 'translateX(-4px)',
                },
              }}
            >
              <ArrowBackIcon sx={{ color: currentColor, transition: 'color 0.3s ease' }} />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography
              variant="h4"
              sx={{
                ...getEnhancedTypography().pageTitle,
                color: currentColor,
                background: `linear-gradient(135deg, ${currentColor} 0%, ${alpha(currentColor, 0.7)} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Rapportage
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, fontSize: '0.875rem' }}
            >
              {currentTab.description}
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Vernieuwen">
          <IconButton
            onClick={handleRefresh}
            sx={{
              width: 48,
              height: 48,
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              transition: 'all 0.3s ease',
              position: 'relative',
              '&:hover': {
                bgcolor: alpha(currentColor, 0.1),
                boxShadow: `0 0 20px ${alpha(currentColor, 0.3)}`,
                '& svg': {
                  transform: 'rotate(180deg)',
                },
              },
            }}
          >
            <RefreshIcon
              sx={{
                color: currentColor,
                transition: 'transform 0.6s ease',
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Paper
        sx={{
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          borderRadius: 2.5,
          mb: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          ...getFadeInUpAnimation(0.1),
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{
            minHeight: 64,
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              gap: 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              '&.Mui-selected': {
                color: TAB_COLORS[activeTab],
                fontWeight: 700,
                '& svg': {
                  transform: 'scale(1.15)',
                  filter: `drop-shadow(0 0 8px ${alpha(TAB_COLORS[activeTab], 0.5)})`,
                },
              },
              '& svg': {
                transition: 'all 0.3s ease',
              },
            },
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: '4px 4px 0 0',
              backgroundColor: TAB_COLORS[activeTab],
              boxShadow: `0 -2px 12px ${alpha(TAB_COLORS[activeTab], 0.4)}`,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            },
          }}
        >
          {REPORT_TABS.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              icon={tab.icon}
              iconPosition="start"
              label={isMobile ? undefined : tab.label}
              sx={{
                '&:hover': {
                  bgcolor: alpha(TAB_COLORS[tab.id], 0.08),
                  '& svg': {
                    transform: 'translateY(-2px) scale(1.1)',
                    color: TAB_COLORS[tab.id],
                  },
                },
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Paper
        sx={{
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          borderRadius: 2.5,
          p: 3,
          minHeight: 400,
          border: '1px solid',
          borderColor: 'divider',
          borderTop: `3px solid ${currentColor}`,
          position: 'relative',
          overflow: 'hidden',
          ...getFadeInUpAnimation(0.2),
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '30%',
            height: '100%',
            background: `radial-gradient(circle at top right, ${alpha(currentColor, 0.05)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          },
        }}
      >
        {activeTab === 'hardware' && <HardwareTab />}
        {activeTab === 'rollout' && <RolloutTab />}
        {activeTab === 'workplaces' && <WorkplacesTab />}
        {activeTab === 'swaps' && <SwapsTab />}
        {activeTab === 'licenses' && <LicensesTab />}
        {activeTab === 'leasing' && <LeasingTab />}
        {activeTab === 'serialnumbers' && <SerialNumbersTab />}
      </Paper>
    </Container>
  );
};

export default ReportsPage;
