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
import { getFadeInUpAnimation } from '../utils/designSystem';
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
    label: 'Asset Geschiedenis',
    icon: <SwapHorizIcon />,
    description: 'Asset wijzigingen, status- en eigenaar historie',
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
    <Container maxWidth="xl" sx={{ py: 0.75, px: { xs: 1, sm: 1.5 } }}>
      {/* Ultra-Compact Header - Single line */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.75,
          py: 0.5,
          ...getFadeInUpAnimation(0),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Tooltip title="Dashboard">
            <IconButton
              onClick={() => navigate(ROUTES.DASHBOARD)}
              size="small"
              sx={{
                width: 28,
                height: 28,
                bgcolor: bgBase,
                boxShadow: getNeumorph(isDark, 'soft'),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: alpha(currentColor, 0.1),
                  transform: 'translateX(-1px)',
                },
              }}
            >
              <ArrowBackIcon sx={{ color: currentColor, fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1rem',
              fontWeight: 700,
              color: currentColor,
              lineHeight: 1,
              mr: 1,
            }}
          >
            Rapportage
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              color: 'text.secondary',
              opacity: 0.75,
            }}
          >
            {currentTab.description}
          </Typography>
        </Box>

        <Tooltip title="Vernieuwen">
          <IconButton
            onClick={handleRefresh}
            size="small"
            sx={{
              width: 28,
              height: 28,
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: alpha(currentColor, 0.1),
                '& svg': {
                  transform: 'rotate(180deg)',
                },
              },
            }}
          >
            <RefreshIcon
              sx={{
                color: currentColor,
                fontSize: 16,
                transition: 'transform 0.4s ease',
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Compact Chip-Style Navigation Tabs */}
      <Paper
        elevation={2}
        sx={{
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'soft'),
          borderRadius: 1.25,
          mb: 0.75,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: alpha(isDark ? '#fff' : '#000', 0.08),
          ...getFadeInUpAnimation(0.03),
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0.5,
              px: 1.25,
              minWidth: isMobile ? 50 : 80,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.7rem',
              gap: 0.5,
              transition: 'all 0.15s ease',
              '&.Mui-selected': {
                color: TAB_COLORS[activeTab],
                fontWeight: 700,
                bgcolor: alpha(TAB_COLORS[activeTab], 0.1),
                '& svg': {
                  transform: 'scale(1.05)',
                },
              },
              '& svg': {
                fontSize: 14,
                transition: 'all 0.15s ease',
              },
            },
            '& .MuiTabs-indicator': {
              height: 2,
              borderRadius: '2px 2px 0 0',
              backgroundColor: TAB_COLORS[activeTab],
              transition: 'all 0.2s ease',
            },
            '& .MuiTabs-scrollButtons': {
              width: 28,
              '& svg': {
                fontSize: 16,
              },
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
                  bgcolor: alpha(TAB_COLORS[tab.id], 0.05),
                  '& svg': {
                    color: TAB_COLORS[tab.id],
                  },
                },
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content - Maximum table density */}
      <Paper
        sx={{
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          borderRadius: 1.25,
          p: 1,
          minHeight: 400,
          border: '1px solid',
          borderColor: alpha(isDark ? '#fff' : '#000', 0.06),
          borderTop: `2px solid ${currentColor}`,
          position: 'relative',
          overflow: 'hidden',
          ...getFadeInUpAnimation(0.06),
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
