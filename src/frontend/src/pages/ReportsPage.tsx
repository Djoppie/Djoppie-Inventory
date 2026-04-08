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
    <Container maxWidth="xl" sx={{ py: 1.25, px: { xs: 1.5, sm: 2 } }}>
      {/* Ultra-Compact Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.75,
          ...getFadeInUpAnimation(0),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Terug naar Dashboard">
            <IconButton
              onClick={() => navigate(ROUTES.DASHBOARD)}
              size="small"
              sx={{
                width: 32,
                height: 32,
                bgcolor: bgBase,
                boxShadow: getNeumorph(isDark, 'soft'),
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(currentColor, 0.1),
                  boxShadow: `0 0 12px ${alpha(currentColor, 0.25)}`,
                  transform: 'translateX(-2px)',
                },
              }}
            >
              <ArrowBackIcon sx={{ color: currentColor, fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: currentColor,
                lineHeight: 1.1,
                background: `linear-gradient(135deg, ${currentColor} 0%, ${alpha(currentColor, 0.7)} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Rapportage
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.65rem', display: 'block', mt: 0.15 }}
            >
              {currentTab.description}
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Vernieuwen">
          <IconButton
            onClick={handleRefresh}
            size="small"
            sx={{
              width: 32,
              height: 32,
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(currentColor, 0.1),
                boxShadow: `0 0 12px ${alpha(currentColor, 0.25)}`,
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
                transition: 'transform 0.5s ease',
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Ultra-Compact Tabs */}
      <Paper
        elevation={6}
        sx={{
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          borderRadius: 1.5,
          mb: 2.5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: alpha(isDark ? '#fff' : '#000', 0.12),
          position: 'relative',
          zIndex: 10,
          ...getFadeInUpAnimation(0.05),
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{
            minHeight: 38,
            '& .MuiTab-root': {
              minHeight: 38,
              py: 0.75,
              px: 1.25,
              minWidth: isMobile ? 56 : 90,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.7rem',
              gap: 0.5,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                color: TAB_COLORS[activeTab],
                fontWeight: 700,
                '& svg': {
                  transform: 'scale(1.1)',
                  filter: `drop-shadow(0 0 6px ${alpha(TAB_COLORS[activeTab], 0.4)})`,
                },
              },
              '& svg': {
                fontSize: 16,
                transition: 'all 0.2s ease',
              },
            },
            '& .MuiTabs-indicator': {
              height: 2.5,
              borderRadius: '2.5px 2.5px 0 0',
              backgroundColor: TAB_COLORS[activeTab],
              boxShadow: `0 -1px 6px ${alpha(TAB_COLORS[activeTab], 0.3)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                  bgcolor: alpha(TAB_COLORS[tab.id], 0.06),
                  '& svg': {
                    transform: 'translateY(-1px) scale(1.05)',
                    color: TAB_COLORS[tab.id],
                  },
                },
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Ultra-Compact Tab Content */}
      <Paper
        sx={{
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          borderRadius: 1.5,
          p: 1.5,
          minHeight: 400,
          border: '1px solid',
          borderColor: alpha(isDark ? '#fff' : '#000', 0.08),
          borderTop: `2px solid ${currentColor}`,
          position: 'relative',
          overflow: 'hidden',
          ...getFadeInUpAnimation(0.1),
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '25%',
            height: '100%',
            background: `radial-gradient(circle at top right, ${alpha(currentColor, 0.04)} 0%, transparent 60%)`,
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
