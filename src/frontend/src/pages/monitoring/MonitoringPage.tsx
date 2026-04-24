/**
 * MonitoringPage
 *
 * Top-level page for continuous monitoring of tenant-wide Entra ID /
 * Microsoft 365 state. Two sub-tabs, kept in sync with the URL:
 *   - Applicaties: Entra ID app registration credentials (client secrets / certs)
 *   - Users: Microsoft 365 license assignments
 */

import { type ReactElement } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import RefreshIcon from '@mui/icons-material/Refresh';
import AppsIcon from '@mui/icons-material/Apps';
import BadgeIcon from '@mui/icons-material/Badge';
import { useQueryClient } from '@tanstack/react-query';

import { ROUTES } from '../../constants/routes';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import { getFadeInUpAnimation } from '../../utils/designSystem';
import { SECTOR_COLOR } from '../../constants/filterColors';
import ApplicationsMonitoring from '../../components/monitoring/ApplicationsMonitoring';
import { LicensesTab } from '../../components/reports';

type MonitoringTab = 'applications' | 'users';

interface TabConfig {
  id: MonitoringTab;
  label: string;
  icon: ReactElement;
  description: string;
  path: string;
}

const TABS: TabConfig[] = [
  {
    id: 'applications',
    label: 'Applicaties',
    icon: <AppsIcon />,
    description: 'Entra ID app registration secrets en certificaten',
    path: ROUTES.MONITORING_APPLICATIONS,
  },
  {
    id: 'users',
    label: 'Users',
    icon: <BadgeIcon />,
    description: 'Microsoft 365 licentie-toewijzingen',
    path: ROUTES.MONITORING_USERS,
  },
];

const tabFromPath = (pathname: string): MonitoringTab => {
  if (pathname.startsWith(ROUTES.MONITORING_USERS)) return 'users';
  return 'applications';
};

const MonitoringPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  const activeTab: MonitoringTab = tabFromPath(location.pathname);

  const handleTabChange = (_e: React.SyntheticEvent, value: MonitoringTab) => {
    const target = TABS.find((t) => t.id === value);
    if (target) {
      navigate(target.path);
    }
  };

  const currentTab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  const handleRefresh = () => {
    if (activeTab === 'applications') {
      queryClient.invalidateQueries({ queryKey: ['clientSecrets'] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['reports', 'licenses'] });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 0.75, px: { xs: 1, sm: 1.5 } }}>
      {/* Header */}
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
                  bgcolor: alpha(SECTOR_COLOR, 0.1),
                  transform: 'translateX(-1px)',
                },
              }}
            >
              <ArrowBackIcon sx={{ color: SECTOR_COLOR, fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1rem',
              fontWeight: 700,
              color: SECTOR_COLOR,
              lineHeight: 1,
              mr: 1,
            }}
          >
            Monitoring
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
                bgcolor: alpha(SECTOR_COLOR, 0.1),
                '& svg': { transform: 'rotate(180deg)' },
              },
            }}
          >
            <RefreshIcon
              sx={{
                color: SECTOR_COLOR,
                fontSize: 16,
                transition: 'transform 0.4s ease',
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs */}
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
              fontSize: '0.72rem',
              gap: 0.5,
              '&.Mui-selected': {
                color: SECTOR_COLOR,
                fontWeight: 700,
                bgcolor: alpha(SECTOR_COLOR, 0.1),
              },
              '& svg': { fontSize: 14 },
            },
            '& .MuiTabs-indicator': {
              height: 2,
              borderRadius: '2px 2px 0 0',
              backgroundColor: SECTOR_COLOR,
            },
          }}
        >
          {TABS.map((t) => (
            <Tab
              key={t.id}
              value={t.id}
              icon={t.icon}
              iconPosition="start"
              label={isMobile ? undefined : t.label}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Paper
        sx={{
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          borderRadius: 1.25,
          p: 1,
          minHeight: 400,
          border: '1px solid',
          borderColor: alpha(isDark ? '#fff' : '#000', 0.06),
          borderTop: `2px solid ${SECTOR_COLOR}`,
          ...getFadeInUpAnimation(0.06),
        }}
      >
        {activeTab === 'applications' && <ApplicationsMonitoring />}
        {activeTab === 'users' && <LicensesTab />}
      </Paper>
    </Container>
  );
};

export default MonitoringPage;
