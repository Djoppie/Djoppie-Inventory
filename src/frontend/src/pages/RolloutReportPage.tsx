import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import DevicesIcon from '@mui/icons-material/Devices';
import TimelineIcon from '@mui/icons-material/Timeline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import { useRolloutSession, useRolloutDays, useRolloutProgress } from '../hooks/useRollout';
import type { RolloutDay } from '../types/rollout';
import { getStatusColor } from '../api/rollout.api';
import { ROUTES } from '../constants/routes';
import Loading from '../components/common/Loading';
import type { EquipmentType } from '../types/rollout';
import AssetStatusReportSection from '../components/rollout/AssetStatusReportSection';

/**
 * Convert status to translation key (handles camelCase properly)
 */
const getStatusTranslationKey = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Planning': 'planning',
    'Ready': 'ready',
    'InProgress': 'inProgress',
    'Completed': 'completed',
    'Cancelled': 'cancelled',
  };
  return statusMap[status] || status.toLowerCase();
};

/**
 * Rollout Report Page - Shows comprehensive rollout statistics and progress
 */
const RolloutReportPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionId = Number(id);

  const { data: session, isLoading: sessionLoading } = useRolloutSession(sessionId, {
    includeDays: true,
    includeWorkplaces: true,
  });
  const { data: days, isLoading: daysLoading } = useRolloutDays(sessionId, {
    includeWorkplaces: true,
  });
  const { isLoading: progressLoading } = useRolloutProgress(sessionId);

  const handleBack = () => {
    navigate(ROUTES.ROLLOUTS);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = () => {
    if (!session?.startedAt || !session?.completedAt) return '-';
    const start = new Date(session.startedAt);
    const end = new Date(session.completedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'dag' : 'dagen'}, ${diffHours} uur`;
    }
    return `${diffHours} uur`;
  };

  if (sessionLoading || daysLoading || progressLoading) {
    return <Loading />;
  }

  if (!session || !days) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Sessie niet gevonden</Alert>
      </Container>
    );
  }

  // Calculate equipment statistics
  const equipmentStats = calculateEquipmentStats(days);
  const totalWorkplaces = days.reduce((sum, day) => sum + day.totalWorkplaces, 0);
  const completedWorkplaces = days.reduce((sum, day) => sum + day.completedWorkplaces, 0);
  const overallProgress = totalWorkplaces > 0 ? (completedWorkplaces / totalWorkplaces) * 100 : 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1">
            Rollout Rapportage
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {session.sessionName}
          </Typography>
        </Box>
        <Chip
          label={t(`rollout.status.${getStatusTranslationKey(session.status)}`)}
          color={getStatusColor(session.status)}
        />
      </Box>

      {/* Statistics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 3,
        }}
      >
        <StatCard
          icon={<CalendarTodayIcon />}
          label="Totaal Dagen"
          value={days.length}
          color="primary.main"
        />
        <StatCard
          icon={<PeopleIcon />}
          label="Werkplekken"
          value={`${completedWorkplaces} / ${totalWorkplaces}`}
          color="success.main"
        />
        <StatCard
          icon={<DevicesIcon />}
          label="Totaal Assets"
          value={equipmentStats.total}
          color="info.main"
        />
        <StatCard
          icon={<TimelineIcon />}
          label="Voltooiing"
          value={`${Math.round(overallProgress)}%`}
          color="warning.main"
        />
      </Box>

      {/* Overall Progress */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Totale Voortgang
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Werkplekken voltooid
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {completedWorkplaces} / {totalWorkplaces}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={overallProgress}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        {session.status === 'Completed' && session.completedAt && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
            <Typography variant="body2" color="success.dark">
              ✓ Rollout voltooid op {formatDate(session.completedAt)}
              {session.startedAt && ` • Duur: ${formatDuration()}`}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Day-by-Day Breakdown */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dag Overzicht
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {days.map((day) => (
            <Accordion key={day.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography sx={{ fontWeight: 'medium', minWidth: 100 }}>
                    Dag {day.dayNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                    {formatDate(day.date)}
                  </Typography>
                  {day.name && (
                    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                      {day.name}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      size="small"
                      label={`${day.completedWorkplaces}/${day.totalWorkplaces}`}
                      color={day.completedWorkplaces === day.totalWorkplaces ? 'success' : 'default'}
                      icon={
                        day.completedWorkplaces === day.totalWorkplaces ? (
                          <CheckCircleIcon />
                        ) : (
                          <PendingIcon />
                        )
                      }
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Divider sx={{ mb: 2 }} />
                {day.workplaces && day.workplaces.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Gebruiker</TableCell>
                          <TableCell>Locatie</TableCell>
                          <TableCell align="center">Items</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {day.workplaces.map((workplace) => (
                          <TableRow key={workplace.id}>
                            <TableCell>
                              <Typography variant="body2">{workplace.userName}</Typography>
                              {workplace.userEmail && (
                                <Typography variant="caption" color="text.secondary">
                                  {workplace.userEmail}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{workplace.location || '-'}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              {workplace.completedItems} / {workplace.totalItems}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={workplace.status}
                                size="small"
                                color={workplace.status === 'Completed' ? 'success' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Geen werkplekken voor deze dag
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Paper>

      {/* Equipment Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Materiaal Overzicht
          </Typography>
          <IconButton size="small">
            <DownloadIcon />
          </IconButton>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(5, 1fr)',
            },
            gap: 2,
          }}
        >
          {Object.entries(equipmentStats.byType).map(([type, count]) => (
            <Card variant="outlined" key={type}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary">
                  {count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getEquipmentLabel(type as EquipmentType)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>

      {/* Asset Status Changes Section */}
      <AssetStatusReportSection sessionId={sessionId} sessionName={session.sessionName} />

      {/* Session Details */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sessie Details
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
          <DetailRow label="Aangemaakt door" value={session.createdBy} />
          <DetailRow label="Aangemaakt op" value={formatDate(session.plannedStartDate)} />
          {session.plannedEndDate && (
            <DetailRow label="Geplande einddatum" value={formatDate(session.plannedEndDate)} />
          )}
          {session.startedAt && (
            <DetailRow label="Gestart op" value={formatDate(session.startedAt)} />
          )}
          {session.completedAt && (
            <DetailRow label="Voltooid op" value={formatDate(session.completedAt)} />
          )}
          {session.description && (
            <DetailRow label="Beschrijving" value={session.description} />
          )}
        </Box>
      </Paper>
    </Container>
  );
};

/**
 * Stat Card Component - Shows a statistic with icon
 */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const StatCard = ({ icon, label, value, color }: StatCardProps) => (
  <Paper sx={{ p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: `${color}15`,
          color: color,
          mr: 2,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

/**
 * Detail Row Component - Shows a label-value pair
 */
interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow = ({ label, value }: DetailRowProps) => (
  <Box sx={{ display: 'flex', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight="medium">
      {value}
    </Typography>
  </Box>
);

/**
 * Calculate equipment statistics from days
 */
const calculateEquipmentStats = (days: RolloutDay[]) => {
  const byType: Record<string, number> = {
    laptop: 0,
    docking: 0,
    monitor: 0,
    keyboard: 0,
    mouse: 0,
  };

  let total = 0;

  days.forEach((day) => {
    if (day.workplaces) {
      day.workplaces.forEach((workplace) => {
        if (workplace.assetPlans) {
          workplace.assetPlans.forEach((plan) => {
            byType[plan.equipmentType] = (byType[plan.equipmentType] || 0) + 1;
            total++;
          });
        }
      });
    }
  });

  return { byType, total };
};

/**
 * Get equipment label in Dutch
 */
const getEquipmentLabel = (type: EquipmentType): string => {
  const labels: Record<EquipmentType, string> = {
    laptop: 'Laptops',
    desktop: 'Desktops',
    docking: 'Docking Stations',
    monitor: 'Monitors',
    keyboard: 'Toetsenborden',
    mouse: 'Muizen',
  };
  return labels[type] || type;
};

export default RolloutReportPage;
