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

// Tab colors
const TAB_COLORS: Record<ReportTab, string> = {
  hardware: '#FF7700', // Djoppie Orange
  rollout: '#E53935', // Red
  workplaces: '#7E57C2', // Purple
  swaps: '#26A69A', // Teal
  licenses: '#1976D2', // Blue
  leasing: '#F57C00', // Dark Orange
  serialnumbers: '#43A047', // Green
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
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Terug naar Dashboard">
            <IconButton
              onClick={() => navigate(ROUTES.DASHBOARD)}
              sx={{
                bgcolor: bgBase,
                boxShadow: getNeumorph(isDark, 'soft'),
                '&:hover': {
                  bgcolor: alpha(currentColor, 0.1),
                },
              }}
            >
              <ArrowBackIcon sx={{ color: currentColor }} />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
              }}
            >
              Rapportage
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentTab.description}
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Vernieuwen">
          <IconButton
            onClick={handleRefresh}
            sx={{
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              '&:hover': {
                bgcolor: alpha(currentColor, 0.1),
              },
            }}
          >
            <RefreshIcon sx={{ color: currentColor }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Paper
        sx={{
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          borderRadius: 2,
          mb: 3,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{
            minHeight: 56,
            '& .MuiTab-root': {
              minHeight: 56,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              gap: 1,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                color: TAB_COLORS[activeTab],
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: TAB_COLORS[activeTab],
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
          borderRadius: 2,
          p: 3,
          minHeight: 400,
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
