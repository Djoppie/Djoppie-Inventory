import { Box, Typography, Card, CardContent, Stack, Chip, alpha, useTheme } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import GroupIcon from '@mui/icons-material/Group';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { EMPLOYEE_COLOR } from '../../constants/filterColors';

const EmployeesTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const upcomingFeatures = [
    {
      title: 'User Management',
      description: 'Manage user accounts and profiles',
      icon: <PeopleIcon />,
    },
    {
      title: 'Role-Based Access Control',
      description: 'Configure roles and permissions',
      icon: <SecurityIcon />,
    },
    {
      title: 'Authentication Settings',
      description: 'Configure Entra ID and authentication policies',
      icon: <VpnKeyIcon />,
    },
    {
      title: 'Team Management',
      description: 'Organize users into teams and departments',
      icon: <GroupIcon />,
    },
    {
      title: 'Admin Permissions',
      description: 'Manage administrative privileges and audit logs',
      icon: <AdminPanelSettingsIcon />,
    },
  ];

  return (
    <Box>
      {/* Main Placeholder Card */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '2px dashed',
          borderColor: alpha(EMPLOYEE_COLOR, 0.3),
          bgcolor: alpha(EMPLOYEE_COLOR, 0.03),
          textAlign: 'center',
          mb: 4,
        }}
      >
        <CardContent sx={{ py: 6, px: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: alpha(EMPLOYEE_COLOR, 0.1),
              border: '3px solid',
              borderColor: alpha(EMPLOYEE_COLOR, 0.3),
              mb: 3,
            }}
          >
            <PeopleIcon
              sx={{
                fontSize: 48,
                color: EMPLOYEE_COLOR,
                filter: isDark ? `drop-shadow(0 0 8px ${alpha(EMPLOYEE_COLOR, 0.5)})` : 'none',
              }}
            />
          </Box>

          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              color: EMPLOYEE_COLOR,
              mb: 2,
            }}
          >
            Employee Management
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
            This section is currently under development. It will provide comprehensive employee and user
            management features including role-based access control, team organization, and permission
            management.
          </Typography>

          <Chip
            label="Coming Soon"
            sx={{
              bgcolor: alpha(EMPLOYEE_COLOR, 0.15),
              color: EMPLOYEE_COLOR,
              fontWeight: 700,
              fontSize: '0.875rem',
              px: 2,
              py: 2.5,
              height: 'auto',
              borderRadius: 2,
              border: '2px solid',
              borderColor: alpha(EMPLOYEE_COLOR, 0.3),
            }}
          />
        </CardContent>
      </Card>

      {/* Upcoming Features Grid */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
        Planned Features
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2,
        }}
      >
        {upcomingFeatures.map((feature, index) => (
          <Card
            key={index}
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: EMPLOYEE_COLOR,
                transform: 'translateY(-4px)',
                boxShadow: isDark
                  ? `0 8px 24px ${alpha(EMPLOYEE_COLOR, 0.2)}`
                  : `0 8px 24px ${alpha(EMPLOYEE_COLOR, 0.15)}`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    bgcolor: alpha(EMPLOYEE_COLOR, 0.1),
                    color: EMPLOYEE_COLOR,
                    '& > *': {
                      fontSize: 28,
                    },
                  }}
                >
                  {feature.icon}
                </Box>

                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Additional Info */}
      <Card
        elevation={0}
        sx={{
          mt: 4,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.info.main, 0.03),
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> Employee management features are being designed to integrate seamlessly
            with Microsoft Entra ID for authentication, role synchronization, and team structure. These
            features will provide IT administrators with fine-grained control over user permissions and
            access to inventory resources.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeesTab;
