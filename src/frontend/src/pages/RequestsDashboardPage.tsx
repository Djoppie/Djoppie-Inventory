import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Paper,
  alpha,
  useTheme,
  Fade,
  Zoom,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Icons
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import { ROUTES } from '../constants/routes';
import { getNeumorph } from '../utils/neumorphicStyles';
import {
  getEnhancedStatCard,
  getEnhancedIconContainer,
  getEnhancedTypography,
  getFadeInUpAnimation,
} from '../utils/designSystem';

// Requests accent color
const REQUESTS_COLOR = '#1976D2'; // Blue

const RequestsDashboardPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Quick action cards
  // TODO: Implement onboarding/offboarding workflows
  // - Create dedicated pages for REQUESTS_ONBOARDING and REQUESTS_OFFBOARDING
  // - Implement asset assignment workflow for new employees
  // - Implement asset return workflow for departing employees
  // - Connect to HR system for employee lifecycle events
  const quickActions = [
    {
      title: 'Onboarding',
      description: 'Nieuwe medewerker instroomproces en asset toewijzing',
      icon: <PersonAddIcon sx={{ fontSize: 32 }} />,
      color: '#43A047',
      path: ROUTES.REQUESTS_ONBOARDING,
      comingSoon: true,
    },
    {
      title: 'Offboarding',
      description: 'Medewerker uitstroomproces en asset retournering',
      icon: <PersonRemoveIcon sx={{ fontSize: 32 }} />,
      color: '#E53935',
      path: ROUTES.REQUESTS_OFFBOARDING,
      comingSoon: true,
    },
    {
      title: 'Historiek',
      description: 'Overzicht van alle onboarding en offboarding aanvragen',
      icon: <HistoryIcon sx={{ fontSize: 32 }} />,
      color: '#FF9800',
      path: ROUTES.REQUESTS_REPORTS,
    },
  ];

  // Stats (placeholder data - will be dynamic in future)
  // TODO: Connect to backend API
  // - GET /api/requests/statistics
  // - Fetch: activeRequests, monthlyRequests, inProgressRequests
  // - Update values dynamically based on API response
  const stats = [
    {
      label: 'Actieve Aanvragen',
      value: '0',
      color: '#1976D2',
      Icon: AssignmentIcon,
    },
    {
      label: 'Deze Maand',
      value: '0',
      color: '#43A047',
      Icon: CalendarMonthIcon,
    },
    {
      label: 'In Behandeling',
      value: '0',
      color: '#FF9800',
      Icon: HourglassEmptyIcon,
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 2, md: 2.5 }, pb: 10 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2.5,
            py: 1.5,
            borderRadius: 2,
            bgcolor: alpha(REQUESTS_COLOR, 0.1),
            border: '1px solid',
            borderColor: alpha(REQUESTS_COLOR, 0.2),
          }}
        >
          <AddIcon sx={{ color: REQUESTS_COLOR, fontSize: 28 }} />
          <Box>
            <Box
              sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: REQUESTS_COLOR,
                lineHeight: 1.2,
              }}
            >
              Aanvragen Dashboard
            </Box>
            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.25 }}>
              Beheer medewerker lifecycle en asset toewijzingen
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Stats Overview with Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
            <Zoom in timeout={400 + index * 100} style={{ transitionDelay: `${index * 50}ms` }}>
              <Paper
                elevation={0}
                sx={{
                  ...getEnhancedStatCard(isDark, stat.color),
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${stat.color}, transparent)`,
                    transition: 'height 0.3s ease',
                  },
                  '&:hover::after': {
                    height: '4px',
                  },
                }}
              >
                <Stack direction="row" spacing={2.5} alignItems="center">
                  <Box sx={{
                    ...getEnhancedIconContainer(isDark, stat.color),
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '.MuiPaper-root:hover &': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                  }}>
                    <stat.Icon sx={{ fontSize: 32, color: stat.color }} />
                  </Box>
                  <Box flex={1}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                      }}
                    >
                      {stat.label}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        ...getEnhancedTypography().metricValue,
                        color: stat.color,
                        mt: 0.5,
                        fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                        fontWeight: 800,
                      }}
                    >
                      {stat.value}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions with Grid */}
      <Box mb={4}>
        <Typography
          variant="h6"
          fontWeight={800}
          mb={3}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            '&::before': {
              content: '""',
              width: '4px',
              height: '24px',
              bgcolor: REQUESTS_COLOR,
              borderRadius: '2px',
            },
          }}
        >
          Snelle Acties
        </Typography>

        <Grid container spacing={3}>
          {quickActions.map((action, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
              <Zoom in timeout={600 + index * 100} style={{ transitionDelay: `${300 + index * 50}ms` }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: `0 8px 32px ${alpha(action.color, 0.08)}`,
                    height: '100%',
                    cursor: action.comingSoon ? 'not-allowed' : 'pointer',
                    opacity: action.comingSoon ? 0.65 : 1,
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    '&:hover': action.comingSoon
                      ? {}
                      : {
                          borderColor: action.color,
                          boxShadow: `0 12px 40px ${alpha(action.color, 0.25)}`,
                          transform: 'translateY(-8px) scale(1.02)',
                        },
                  }}
                  onClick={() => !action.comingSoon && navigate(action.path)}
                >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 3,
                      bgcolor: alpha(action.color, isDark ? 0.15 : 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      color: action.color,
                      boxShadow: `inset 0 2px 8px ${alpha(action.color, 0.2)}`,
                      transition: 'all 0.3s ease',
                      ...((!action.comingSoon) && {
                        '&:hover': {
                          transform: 'rotate(-5deg) scale(1.1)',
                          boxShadow: `0 0 20px ${alpha(action.color, 0.4)}`,
                        },
                      }),
                    }}
                  >
                    {action.icon}
                  </Box>

                  <Typography variant="h6" fontWeight={700} mb={1}>
                    {action.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {action.description}
                  </Typography>

                  {action.comingSoon && (
                    <Box
                      sx={{
                        mt: 2,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: alpha(action.color, 0.1),
                        display: 'inline-flex',
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Typography variant="caption" fontWeight={600} color={action.color}>
                        Binnenkort beschikbaar
                      </Typography>
                    </Box>
                  )}
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Future Features Section */}
      <Fade in timeout={1000} style={{ transitionDelay: '600ms' }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: `0 8px 32px ${alpha(REQUESTS_COLOR, 0.08)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 12px 40px ${alpha(REQUESTS_COLOR, 0.15)}`,
              transform: 'translateY(-2px)',
            },
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
              <TrendingUpIcon sx={{ color: REQUESTS_COLOR, fontSize: 28 }} />
              <Typography variant="h6" fontWeight={800}>
                Toekomstige Functionaliteit
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" mb={3} sx={{ fontSize: '0.9rem' }}>
              Deze module wordt uitgebreid met geautomatiseerde workflows voor:
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: alpha('#43A047', 0.05),
                    border: '1px solid',
                    borderColor: alpha('#43A047', 0.2),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: alpha('#43A047', 0.08),
                      borderColor: alpha('#43A047', 0.3),
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <PersonAddIcon sx={{ color: '#43A047', fontSize: 24, mt: 0.25 }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                        Onboarding Workflow
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Automatische asset toewijzing bij nieuwe medewerkers, gekoppeld aan HR systeem
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: alpha('#E53935', 0.05),
                    border: '1px solid',
                    borderColor: alpha('#E53935', 0.2),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: alpha('#E53935', 0.08),
                      borderColor: alpha('#E53935', 0.3),
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <PersonRemoveIcon sx={{ color: '#E53935', fontSize: 24, mt: 0.25 }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                        Offboarding Workflow
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Geautomatiseerd retourproces voor assets bij uitdiensttreding
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default RequestsDashboardPage;
