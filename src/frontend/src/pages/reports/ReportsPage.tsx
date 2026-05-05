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
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BusinessIcon from '@mui/icons-material/Business';
import CloudIcon from '@mui/icons-material/Cloud';
import DescriptionIcon from '@mui/icons-material/Description';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQueryClient } from '@tanstack/react-query';

import { ROUTES } from '../../constants/routes';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import { getFadeInUpAnimation } from '../../utils/designSystem';
import type { ReportTab } from '../../types/report.types';
import {
  OverviewTab,
  AssetsTab,
  IntuneTab,
  RolloutsTab,
  WerkplekkenTab,
  LeasingTab,
} from '../../components/reports';

// Report tab configuration
const REPORT_TABS: { id: ReportTab; label: string; icon: ReactElement; description: string }[] = [
  { id: 'overview',    label: 'Overview',    icon: <DashboardIcon />,    description: 'Cross-domein KPIs en trend' },
  { id: 'assets',      label: 'Assets',      icon: <InventoryIcon />,    description: 'Inventaris nu en historiek' },
  { id: 'rollouts',    label: 'Rollouts',    icon: <RocketLaunchIcon />, description: 'Sessie-rapporten en checklist' },
  { id: 'werkplekken', label: 'Werkplekken', icon: <BusinessIcon />,     description: 'Bezetting en equipment' },
  { id: 'intune',      label: 'Intune',      icon: <CloudIcon />,        description: 'Intune device analyses' },
  { id: 'leasing',     label: 'Leasing',     icon: <DescriptionIcon />,  description: 'Lease contracten en vervaldatums' },
];

// Tab colors
const TAB_COLORS: Record<ReportTab, string> = {
  overview: '#FF7700',
  assets: '#FF7700',
  rollouts: '#F44336',
  werkplekken: '#9C27B0',
  intune: '#2196F3',
  leasing: '#FF9800',
};

const ReportsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  // Legacy tab migrations (defined outside effect so it can be reused for initial state)
  const legacyMap: Record<string, { tab: ReportTab; extraParams?: Record<string, string> }> = {
    hardware:      { tab: 'assets',      extraParams: { view: 'nu' } },
    swaps:         { tab: 'assets',      extraParams: { view: 'history' } },
    workplaces:    { tab: 'werkplekken' },
    rollout:       { tab: 'rollouts' },
    serialnumbers: { tab: 'overview' }, // will be redirected externally in PR4
  };

  // Get active tab from URL (resolve legacy params at init), default to 'overview'
  const rawTabParam = searchParams.get('tab');
  const resolvedInitialTab: ReportTab = rawTabParam
    ? (legacyMap[rawTabParam]?.tab ?? (REPORT_TABS.some(t => t.id === rawTabParam) ? rawTabParam as ReportTab : 'overview'))
    : 'overview';
  const [activeTab, setActiveTab] = useState<ReportTab>(resolvedInitialTab);

  // Handle serialnumbers redirect to separate page
  useEffect(() => {
    if (searchParams.get('tab') === 'serialnumbers') {
      navigate('/operations/rollouts/serienummers', { replace: true });
    }
  }, [searchParams, navigate]);

  // Sync URL with active tab, handling legacy redirects
  useEffect(() => {
    const tabParam = searchParams.get('tab');

    if (tabParam && legacyMap[tabParam]) {
      const { tab, extraParams } = legacyMap[tabParam];
      const next = new URLSearchParams(searchParams);
      next.set('tab', tab);
      Object.entries(extraParams ?? {}).forEach(([k, v]) => next.set(k, v));
      setSearchParams(next, { replace: true });
      return;
    }

    if (tabParam !== activeTab) {
      // Preserve extra params (e.g. session= for RolloutsTab deep-links) while updating tab
      const next = new URLSearchParams(searchParams);
      next.set('tab', activeTab);
      setSearchParams(next, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    switch (activeTab) {
      case 'overview':    queryClient.invalidateQueries({ queryKey: ['reports', 'overview'] }); break;
      case 'assets':      queryClient.invalidateQueries({ queryKey: ['reports', 'assets'] }); break;
      case 'rollouts':    queryClient.invalidateQueries({ queryKey: ['rollouts'] }); break;
      case 'werkplekken': queryClient.invalidateQueries({ queryKey: ['reports', 'werkplekken'] }); break;
      case 'intune':      queryClient.invalidateQueries({ queryKey: ['reports', 'intune'] }); break;
      case 'leasing':     queryClient.invalidateQueries({ queryKey: ['reports', 'leases'] }); break;
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
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'assets' && <AssetsTab />}
        {activeTab === 'rollouts' && <RolloutsTab />}
        {activeTab === 'werkplekken' && <WerkplekkenTab />}
        {activeTab === 'intune' && <IntuneTab />}
        {activeTab === 'leasing' && <LeasingTab />}
      </Paper>
    </Container>
  );
};

export default ReportsPage;
