/**
 * DashboardOverviewPage Component
 * Compact tabbed dashboard with Overview, Inventory, Rollout Planning, and Swap Management
 */

import { useState, useEffect } from 'react';
import { Box, useTheme, Tabs, Tab, alpha } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { getNeumorphColors, getNeumorph, getNeumorphInset } from '../../utils/neumorphicStyles';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  RocketLaunch,
  SwapHoriz,
  MonitorHeart as MonitorHeartIcon,
} from '@mui/icons-material';
import { ASSET_COLOR } from '../../constants/filterColors';
import {
  OverviewTab,
  InventoryTab,
  RolloutPlanningTab,
  SwapManagementTab,
} from '../../components/dashboard-tabs';
import IntuneDeviceDashboardPage from '../devices/IntuneDeviceDashboardPage';

type TabValue = 'overview' | 'inventory' | 'intune' | 'rollout' | 'swaps';

const DashboardOverviewPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = (searchParams.get('tab') as TabValue) || 'overview';
  const [activeTab, setActiveTab] = useState<TabValue>(tabFromUrl);

  // Sync tab with URL
  useEffect(() => {
    const urlTab = (searchParams.get('tab') as TabValue) || 'overview';
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
    setSearchParams({ tab: newValue });
  };

  return (
    <Box
      sx={{
        bgcolor: bgBase,
        borderRadius: 3,
        boxShadow: getNeumorph(isDark, 'medium'),
        overflow: 'hidden',
      }}
    >
      {/* Navigation Bar */}
      <Box
        sx={{
          px: { xs: 1, sm: 1.5 },
          pt: { xs: 1, sm: 1.25 },
          pb: 0,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 42,
            '& .MuiTabs-indicator': {
              display: 'none',
            },
            '& .MuiTabs-flexContainer': {
              gap: 0.5,
            },
            '& .MuiTab-root': {
              minHeight: 38,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.82rem' },
              color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
              px: { xs: 1.25, sm: 1.75 },
              py: 0.75,
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                color: isDark ? '#fff' : ASSET_COLOR,
                bgcolor: isDark ? alpha(ASSET_COLOR, 0.15) : alpha(ASSET_COLOR, 0.08),
                boxShadow: getNeumorphInset(isDark),
              },
              '&:hover:not(.Mui-selected)': {
                color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)',
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              },
            },
          }}
        >
          <Tab
            value="overview"
            label="Overview"
            icon={<DashboardIcon sx={{ fontSize: 16 }} />}
            iconPosition="start"
          />
          <Tab
            value="inventory"
            label="Inventory"
            icon={<InventoryIcon sx={{ fontSize: 16 }} />}
            iconPosition="start"
          />
          <Tab
            value="intune"
            label="Intune Devices"
            icon={<MonitorHeartIcon sx={{ fontSize: 16 }} />}
            iconPosition="start"
          />
          <Tab
            value="rollout"
            label="Rollout Planning"
            icon={<RocketLaunch sx={{ fontSize: 16 }} />}
            iconPosition="start"
          />
          <Tab
            value="swaps"
            label="Swap Management"
            icon={<SwapHoriz sx={{ fontSize: 16 }} />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box
        sx={{
          bgcolor: bgSurface,
          minHeight: 400,
        }}
      >
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'intune' && <IntuneDeviceDashboardPage embedded />}
        {activeTab === 'rollout' && <RolloutPlanningTab />}
        {activeTab === 'swaps' && <SwapManagementTab />}
      </Box>
    </Box>
  );
};

export default DashboardOverviewPage;
