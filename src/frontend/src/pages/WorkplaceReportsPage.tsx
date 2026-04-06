import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Grid
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import DeskIcon from '@mui/icons-material/Desk';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import DevicesIcon from '@mui/icons-material/Devices';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  useWorkplaceStatistics,
  useWorkplaceStatisticsByBuilding,
  useWorkplaceStatisticsByService,
} from '../hooks/usePhysicalWorkplaces';
import { getNeumorph } from '../utils/neumorphicStyles';
import {
  getEnhancedStatCard,
  getEnhancedIconContainer,
  getEnhancedProgressBar,
  getFadeInUpAnimation,
  getEnhancedTypography,
} from '../utils/designSystem';
import { WORKPLACE_COLOR, BUILDING_COLOR, SERVICE_COLOR } from '../constants/filterColors';
import Loading from '../components/common/Loading';
import ApiErrorDisplay from '../components/common/ApiErrorDisplay';

// Report accent color
const reportAccent = WORKPLACE_COLOR;

const WorkplaceReportsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Fetch workplace statistics
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useWorkplaceStatistics();

  // Fetch building occupancy
  const {
    data: buildingOccupancy = [],
    isLoading: buildingLoading,
    refetch: refetchBuildings,
  } = useWorkplaceStatisticsByBuilding();

  // Fetch service occupancy
  const {
    data: serviceOccupancy = [],
    isLoading: serviceLoading,
    refetch: refetchServices,
  } = useWorkplaceStatisticsByService();

  // Handle data export (placeholder)
  const handleExport = () => {
    console.log('Export workplace reports');
    // TODO: Implement CSV/Excel export
    // - Export workplace statistics to CSV/Excel
    // - Include: occupancy data, equipment stats, building/service breakdowns
    // - Consider using: papaparse (CSV) or exceljs (Excel)
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    refetchBuildings();
    refetchServices();
  };

  const loading = isLoading || buildingLoading || serviceLoading;

  if (loading) {
    return <Loading />;
  }

  if (isError) {
    return <ApiErrorDisplay onRetry={refetch} />;
  }

  if (!stats) {
    return (
      <Box sx={{ p: { xs: 2, sm: 2, md: 2.5 }, pb: 10 }}>
        <Typography variant="body1" color="text.secondary">
          Geen werkplek statistieken beschikbaar
        </Typography>
      </Box>
    );
  }

  const occupancyPercentage = (stats.occupancyRate * 100).toFixed(1);
  const vacancyRate = ((stats.vacantWorkplaces / stats.totalWorkplaces) * 100).toFixed(1);

  return (
    <Box sx={{ p: { xs: 2, sm: 2, md: 3 }, pb: 10 }}>
      {/* Page Header with Gradient */}
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: isDark
              ? `linear-gradient(135deg, ${alpha(reportAccent, 0.15)} 0%, ${alpha(reportAccent, 0.05)} 100%)`
              : `linear-gradient(135deg, ${alpha(reportAccent, 0.08)} 0%, ${alpha(reportAccent, 0.02)} 100%)`,
            border: '1px solid',
            borderColor: alpha(reportAccent, 0.2),
            boxShadow: `0 4px 20px ${alpha(reportAccent, 0.1)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${reportAccent}, ${alpha(reportAccent, 0.6)})`,
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  background: `linear-gradient(135deg, ${reportAccent}, ${alpha(reportAccent, 0.7)})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                Werkplek Rapporten
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                Overzicht van werkplek bezetting en uitrusting statistieken
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Tooltip title="Gegevens vernieuwen" arrow>
                <IconButton
                  onClick={handleRefresh}
                  size="large"
                  sx={{
                    bgcolor: isDark ? alpha('#fff', 0.05) : '#fff',
                    boxShadow: getNeumorph(isDark, 'soft'),
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: alpha(reportAccent, 0.1),
                      boxShadow: `0 6px 20px ${alpha(reportAccent, 0.25)}`,
                      transform: 'translateY(-2px) scale(1.05)',
                    },
                    '&:active': {
                      transform: 'translateY(0) scale(0.98)',
                    },
                  }}
                >
                  <RefreshIcon sx={{ color: reportAccent, fontSize: 22 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Exporteer naar Excel" arrow>
                <IconButton
                  onClick={handleExport}
                  size="large"
                  sx={{
                    bgcolor: isDark ? alpha('#fff', 0.05) : '#fff',
                    boxShadow: getNeumorph(isDark, 'soft'),
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: alpha(reportAccent, 0.1),
                      boxShadow: `0 6px 20px ${alpha(reportAccent, 0.25)}`,
                      transform: 'translateY(-2px) scale(1.05)',
                    },
                    '&:active': {
                      transform: 'translateY(0) scale(0.98)',
                    },
                  }}
                >
                  <FileDownloadIcon sx={{ color: reportAccent, fontSize: 22 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Paper>
      </Fade>

      {/* Summary Statistics with Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            label: 'Totaal Werkplekken',
            value: stats.totalWorkplaces,
            subtitle: `${stats.activeWorkplaces} actief`,
            color: reportAccent,
            Icon: DeskIcon,
          },
          {
            label: 'Bezet',
            value: stats.occupiedWorkplaces,
            subtitle: `${occupancyPercentage}% bezetting`,
            color: '#43A047',
            Icon: PersonIcon,
          },
          {
            label: 'Leeg',
            value: stats.vacantWorkplaces,
            subtitle: `${vacancyRate}% beschikbaar`,
            color: '#FF9800',
            Icon: PersonOffIcon,
          },
          {
            label: 'Uitrusting',
            value: `${(stats.equipment.overallEquipmentRate * 100).toFixed(0)}%`,
            subtitle: 'Vul percentage',
            color: '#1976D2',
            Icon: DevicesIcon,
          },
        ].map((stat, index) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
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
                        fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                        fontWeight: 800,
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {stat.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      {/* Equipment Details */}
      <Fade in timeout={800} style={{ transitionDelay: '200ms' }}>
        <Card
          elevation={0}
          sx={{
            mb: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: `0 8px 32px ${alpha(isDark ? '#000' : reportAccent, isDark ? 0.3 : 0.08)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 12px 40px ${alpha(isDark ? '#000' : reportAccent, isDark ? 0.4 : 0.12)}`,
              transform: 'translateY(-2px)',
            },
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
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
                  bgcolor: reportAccent,
                  borderRadius: '2px',
                },
              }}
            >
              Uitrusting Details
            </Typography>

            <Grid container spacing={3}>
              {[
                {
                  label: 'Docking Stations',
                  filled: stats.equipment.filledDockingSlots,
                  total: stats.equipment.totalDockingSlots,
                  color: reportAccent,
                },
                {
                  label: 'Monitoren',
                  filled: stats.equipment.filledMonitorSlots,
                  total: stats.equipment.totalMonitorSlots,
                  color: '#1976D2',
                },
                {
                  label: 'Toetsenborden',
                  filled: stats.equipment.filledKeyboardSlots,
                  total: stats.equipment.totalKeyboardSlots,
                  color: '#43A047',
                },
                {
                  label: 'Muizen',
                  filled: stats.equipment.filledMouseSlots,
                  total: stats.equipment.totalMouseSlots,
                  color: '#FF9800',
                },
              ].map((equipment, index) => {
                const percentage = equipment.total > 0 ? (equipment.filled / equipment.total) * 100 : 0;
                return (
                  <Grid key={equipment.label} size={{ xs: 12, md: 6 }}>
                    <Zoom in timeout={600 + index * 100} style={{ transitionDelay: `${300 + index * 50}ms` }}>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" mb={1.5}>
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.9rem' }}>
                            {equipment.label}
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color={equipment.color}>
                            {equipment.filled} / {equipment.total}
                          </Typography>
                        </Stack>
                        <Box sx={{
                          ...getEnhancedProgressBar(isDark).container,
                          height: 8,
                          borderRadius: 1,
                        }}>
                          <Box sx={{
                            ...getEnhancedProgressBar(isDark).bar(equipment.color, percentage),
                            borderRadius: 1,
                            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {percentage.toFixed(1)}% voltooid
                        </Typography>
                      </Box>
                    </Zoom>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Fade>

      {/* Building and Service Occupancy */}
      <Grid container spacing={3}>
        {/* Building Occupancy */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Fade in timeout={1000} style={{ transitionDelay: '400ms' }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: `0 8px 32px ${alpha(BUILDING_COLOR, 0.08)}`,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 12px 40px ${alpha(BUILDING_COLOR, 0.15)}`,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                  <BusinessIcon sx={{ color: BUILDING_COLOR, fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700}>
                  Bezetting per Gebouw
                </Typography>
              </Stack>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Gebouw</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Totaal
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Bezet
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Bezetting
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {buildingOccupancy && buildingOccupancy.length > 0 ? (
                      buildingOccupancy.map((building) => (
                        <TableRow
                          key={building.buildingId}
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(BUILDING_COLOR, 0.05),
                            },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {building.buildingName}
                            </Typography>
                            {building.buildingCode && (
                              <Typography variant="caption" color="text.secondary">
                                {building.buildingCode}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{building.totalWorkplaces}</TableCell>
                          <TableCell align="right">{building.occupiedWorkplaces}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${(building.occupancyRate * 100).toFixed(0)}%`}
                              size="small"
                              sx={{
                                bgcolor: alpha(BUILDING_COLOR, 0.1),
                                color: BUILDING_COLOR,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Geen gebouw data beschikbaar
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Service Occupancy */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Fade in timeout={1000} style={{ transitionDelay: '500ms' }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: `0 8px 32px ${alpha(SERVICE_COLOR, 0.08)}`,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 12px 40px ${alpha(SERVICE_COLOR, 0.15)}`,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                  <BusinessIcon sx={{ color: SERVICE_COLOR, fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700}>
                  Bezetting per Dienst
                </Typography>
              </Stack>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Dienst</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Totaal
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Bezet
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Bezetting
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviceOccupancy && serviceOccupancy.length > 0 ? (
                      serviceOccupancy.map((service, index) => (
                        <TableRow
                          key={service.serviceId || `service-${index}`}
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(SERVICE_COLOR, 0.05),
                            },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {service.serviceName || 'Onbekend'}
                            </Typography>
                            {service.serviceCode && (
                              <Typography variant="caption" color="text.secondary">
                                {service.serviceCode}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{service.totalWorkplaces}</TableCell>
                          <TableCell align="right">{service.occupiedWorkplaces}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${(service.occupancyRate * 100).toFixed(0)}%`}
                              size="small"
                              sx={{
                                bgcolor: alpha(SERVICE_COLOR, 0.1),
                                color: SERVICE_COLOR,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Geen dienst data beschikbaar
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkplaceReportsPage;
