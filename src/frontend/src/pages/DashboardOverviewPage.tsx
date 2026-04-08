/**
 * DashboardOverviewPage Component
 * Compact tabbed dashboard with Overview, Inventory, Rollout Planning, and Swap Management
 */

import { useState, useEffect } from 'react';
import { Box, Typography, useTheme, Tabs, Tab, alpha } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { getNeumorphColors, getNeumorph } from '../utils/neumorphicStyles';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  RocketLaunch,
  SwapHoriz,
} from '@mui/icons-material';
import {
  OverviewTab,
  InventoryTab,
  RolloutPlanningTab,
  SwapManagementTab,
} from '../components/dashboard-tabs';

type TabValue = 'overview' | 'inventory' | 'rollout' | 'swaps';

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
      {/* Page Header */}
      <Box
        sx={{
          px: { xs: 1.5, sm: 2 },
          pt: { xs: 1.5, sm: 2 },
          pb: 0,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)',
            mb: 0.35,
            letterSpacing: '-0.02em',
            fontSize: { xs: '1.35rem', sm: '1.6rem', md: '1.85rem' },
          }}
        >
          Business Dashboard
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            mb: 1.25,
            fontSize: '0.8rem',
          }}
        >
          Comprehensive asset management and rollout operations
        </Typography>

        {/* Tabs Navigation */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            minHeight: 36,
            '& .MuiTabs-indicator': {
              backgroundColor: '#FF7700',
              height: 2.5,
              borderRadius: '2.5px 2.5px 0 0',
            },
            '& .MuiTab-root': {
              minHeight: 36,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              px: { xs: 1.25, sm: 1.75 },
              py: 0.75,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                color: '#FF7700',
                bgcolor: alpha('#FF7700', 0.05),
              },
              '&:hover': {
                color: '#FF7700',
                bgcolor: alpha('#FF7700', 0.03),
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
        {activeTab === 'rollout' && <RolloutPlanningTab />}
        {activeTab === 'swaps' && <SwapManagementTab />}
      </Box>
    </Box>
  );
};

export default DashboardOverviewPage;
