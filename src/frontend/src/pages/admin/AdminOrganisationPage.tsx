import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Tabs, Tab, Paper, alpha, useTheme, Fade, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

// Components
import SectorsTab from '../../components/admin/SectorsTab';
import ServicesTab from '../../components/admin/ServicesTab';
import EmployeesTab from '../../components/admin/EmployeesTab';

// Icons
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import PeopleIcon from '@mui/icons-material/People';

// API
import { sectorsApi, servicesApi } from '../../api/admin.api';
import { getNeumorphColors } from '../../utils/neumorphicStyles';
import { ADMIN_ORGANIZATION_COLOR } from '../../constants/filterColors';

type AdminOrganisationTab = 'sectors' | 'services' | 'employees';

const AdminOrganisationPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  // Get active tab from URL or default to 'sectors'
  const tabParam = searchParams.get('tab') as AdminOrganisationTab | null;
  const [activeTab, setActiveTab] = useState<AdminOrganisationTab>(
    tabParam && ['sectors', 'services', 'employees'].includes(tabParam)
      ? tabParam
      : 'sectors'
  );

  // Sync URL with active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  // Fetch data for badges
  const { data: sectors = [], isError: sectorsError } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => sectorsApi.getAll(true),
  });

  const { data: services = [], isError: servicesError } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(true),
  });

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: AdminOrganisationTab) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 2, md: 3 }, pb: 10 }}>
      {/* Enhanced Page Header with Gradient */}
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: isDark
              ? `linear-gradient(135deg, ${alpha(ADMIN_ORGANIZATION_COLOR, 0.15)} 0%, ${alpha(ADMIN_ORGANIZATION_COLOR, 0.05)} 100%)`
              : `linear-gradient(135deg, ${alpha(ADMIN_ORGANIZATION_COLOR, 0.08)} 0%, ${alpha(ADMIN_ORGANIZATION_COLOR, 0.02)} 100%)`,
            border: '1px solid',
            borderColor: alpha(ADMIN_ORGANIZATION_COLOR, 0.2),
            boxShadow: `0 4px 20px ${alpha(ADMIN_ORGANIZATION_COLOR, 0.1)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${ADMIN_ORGANIZATION_COLOR}, ${alpha(ADMIN_ORGANIZATION_COLOR, 0.6)})`,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(ADMIN_ORGANIZATION_COLOR, isDark ? 0.2 : 0.1),
                boxShadow: `inset 0 2px 8px ${alpha(ADMIN_ORGANIZATION_COLOR, 0.2)}`,
              }}
            >
              <AccountTreeIcon sx={{ color: ADMIN_ORGANIZATION_COLOR, fontSize: 32 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  background: `linear-gradient(135deg, ${ADMIN_ORGANIZATION_COLOR}, ${alpha(ADMIN_ORGANIZATION_COLOR, 0.7)})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                Organisatie Beheer
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                Sectoren, diensten en medewerkers
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* Enhanced Tabs Navigation */}
      <Fade in timeout={800} style={{ transitionDelay: '200ms' }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: bgSurface,
            boxShadow: `0 8px 32px ${alpha(isDark ? '#000' : ADMIN_ORGANIZATION_COLOR, isDark ? 0.3 : 0.08)}`,
            borderRadius: 3,
            mb: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 12px 40px ${alpha(isDark ? '#000' : ADMIN_ORGANIZATION_COLOR, isDark ? 0.4 : 0.12)}`,
            },
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              minHeight: 60,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 60,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                gap: 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  color: ADMIN_ORGANIZATION_COLOR,
                  fontWeight: 700,
                  transform: 'translateY(-2px)',
                },
                '&:hover': {
                  bgcolor: alpha(ADMIN_ORGANIZATION_COLOR, 0.05),
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: `linear-gradient(90deg, ${ADMIN_ORGANIZATION_COLOR}, ${alpha(ADMIN_ORGANIZATION_COLOR, 0.7)})`,
                boxShadow: `0 0 8px ${alpha(ADMIN_ORGANIZATION_COLOR, 0.5)}`,
              },
            }}
          >
          <Tab
            value="sectors"
            label={`Sectoren (${sectorsError ? '?' : sectors.filter((s) => s.isActive).length})`}
            icon={<AccountTreeIcon />}
            iconPosition="start"
          />
          <Tab
            value="services"
            label={`Diensten (${servicesError ? '?' : services.filter((s) => s.isActive).length})`}
            icon={<MiscellaneousServicesIcon />}
            iconPosition="start"
          />
          <Tab
            value="employees"
            label="Medewerkers"
            icon={<PeopleIcon />}
            iconPosition="start"
          />
          </Tabs>
        </Paper>
      </Fade>

      {/* Tab Content */}
      <Box>
        {activeTab === 'sectors' && <SectorsTab />}
        {activeTab === 'services' && <ServicesTab />}
        {activeTab === 'employees' && <EmployeesTab />}
      </Box>
    </Box>
  );
};

export default AdminOrganisationPage;
