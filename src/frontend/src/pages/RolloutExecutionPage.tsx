import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Paper,
  LinearProgress,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Collapse,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useRolloutSession, useRolloutDays, useRolloutWorkplaces } from '../hooks/useRollout';
import { ROUTES } from '../constants/routes';
import Loading from '../components/common/Loading';
import type { RolloutDay, RolloutWorkplace, AssetPlan } from '../types/rollout';

/**
 * Rollout Execution Page - Execute rollout for a specific session
 * Mobile-optimized interface for technicians
 */
const RolloutExecutionPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionId = Number(id);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [expandedWorkplace, setExpandedWorkplace] = useState<number | null>(null);

  // Fetch data
  const { data: session, isLoading: sessionLoading } = useRolloutSession(sessionId, {
    includeDays: true,
  });
  const { data: days, isLoading: daysLoading } = useRolloutDays(sessionId);

  const selectedDay = days?.[selectedDayIndex];
  const { data: workplaces, isLoading: workplacesLoading } = useRolloutWorkplaces(
    selectedDay?.id || 0
  );

  const handleBack = () => {
    navigate(ROUTES.ROLLOUTS);
  };

  const handleDayChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedDayIndex(newValue);
    setExpandedWorkplace(null);
  };

  const handleToggleWorkplace = (workplaceId: number) => {
    setExpandedWorkplace(expandedWorkplace === workplaceId ? null : workplaceId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  if (sessionLoading || daysLoading) {
    return <Loading />;
  }

  if (!session || !days) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Sessie niet gevonden</Alert>
      </Container>
    );
  }

  const totalWorkplaces = days.reduce((sum, day) => sum + day.totalWorkplaces, 0);
  const completedWorkplaces = days.reduce((sum, day) => sum + day.completedWorkplaces, 0);
  const overallProgress = totalWorkplaces > 0 ? (completedWorkplaces / totalWorkplaces) * 100 : 0;

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4, px: { xs: 1, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="h1">
            {session.sessionName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Uitvoering
          </Typography>
        </Box>
      </Box>

      {/* Overall Progress */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            Totale Voortgang
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {completedWorkplaces} / {totalWorkplaces} werkplekken
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={overallProgress}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {Math.round(overallProgress)}% voltooid
        </Typography>
      </Paper>

      {/* Day Tabs */}
      {days.length === 0 ? (
        <Alert severity="info">
          Geen dagen gevonden voor deze sessie. Ga naar de planning om dagen toe te voegen.
        </Alert>
      ) : (
        <>
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={selectedDayIndex}
              onChange={handleDayChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {days.map((day, index) => (
                <Tab
                  key={day.id}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Dag {day.dayNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(day.date)}
                      </Typography>
                    </Box>
                  }
                  icon={
                    day.completedWorkplaces === day.totalWorkplaces && day.totalWorkplaces > 0 ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : undefined
                  }
                  iconPosition="end"
                />
              ))}
            </Tabs>
          </Paper>

          {/* Workplace List */}
          {selectedDay && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedDay.name && `${selectedDay.name} - `}
                  {selectedDay.completedWorkplaces} van {selectedDay.totalWorkplaces} werkplekken voltooid
                </Typography>
              </Box>

              {workplacesLoading ? (
                <Loading />
              ) : !workplaces || workplaces.length === 0 ? (
                <Alert severity="info">
                  Geen werkplekken gevonden voor deze dag.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {workplaces.map((workplace) => (
                    <WorkplaceCard
                      key={workplace.id}
                      workplace={workplace}
                      expanded={expandedWorkplace === workplace.id}
                      onToggle={() => handleToggleWorkplace(workplace.id)}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

/**
 * Workplace Card Component - Shows workplace details and asset checklist
 */
interface WorkplaceCardProps {
  workplace: RolloutWorkplace;
  expanded: boolean;
  onToggle: () => void;
}

const WorkplaceCard = ({ workplace, expanded, onToggle }: WorkplaceCardProps) => {
  const isComplete = workplace.status === 'Completed';
  const progress = workplace.totalItems > 0
    ? (workplace.completedItems / workplace.totalItems) * 100
    : 0;

  return (
    <Card sx={{ border: isComplete ? '2px solid' : '1px solid', borderColor: isComplete ? 'success.main' : 'divider' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
              {workplace.userName}
            </Typography>
            {workplace.userEmail && (
              <Typography variant="body2" color="text.secondary">
                {workplace.userEmail}
              </Typography>
            )}
            {workplace.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <LocationOnIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {workplace.location}
                </Typography>
              </Box>
            )}
          </Box>
          <Chip
            label={workplace.status}
            size="small"
            color={isComplete ? 'success' : 'default'}
            icon={isComplete ? <CheckCircleIcon /> : undefined}
          />
        </Box>

        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Voortgang
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {workplace.completedItems} / {workplace.totalItems} items
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 6, borderRadius: 3 }}
            color={isComplete ? 'success' : 'primary'}
          />
        </Box>

        {/* Asset Checklist */}
        <Collapse in={expanded} timeout="auto">
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Asset Checklist
            </Typography>
            <List dense>
              {workplace.assetPlans.map((plan, index) => (
                <AssetChecklistItem key={index} plan={plan} />
              ))}
            </List>
          </Box>
        </Collapse>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={onToggle}
        >
          {expanded ? 'Verbergen' : 'Details tonen'}
        </Button>
        {!isComplete && (
          <Button
            variant="contained"
            size="small"
            startIcon={<PlayArrowIcon />}
          >
            Start
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

/**
 * Asset Checklist Item - Shows individual asset status
 */
interface AssetChecklistItemProps {
  plan: AssetPlan;
}

const AssetChecklistItem = ({ plan }: AssetChecklistItemProps) => {
  const isComplete = plan.status === 'installed';

  const getEquipmentLabel = (type: string) => {
    const labels: Record<string, string> = {
      laptop: 'Laptop',
      docking: 'Docking Station',
      monitor: 'Monitor',
      keyboard: 'Toetsenbord',
      mouse: 'Muis',
    };
    return labels[type] || type;
  };

  return (
    <ListItem
      sx={{
        bgcolor: isComplete ? 'success.50' : 'background.paper',
        borderRadius: 1,
        mb: 0.5,
        border: '1px solid',
        borderColor: isComplete ? 'success.main' : 'divider',
      }}
    >
      <ListItemIcon>
        {isComplete ? (
          <CheckCircleIcon color="success" />
        ) : (
          <RadioButtonUncheckedIcon color="disabled" />
        )}
      </ListItemIcon>
      <ListItemText
        primary={getEquipmentLabel(plan.equipmentType)}
        secondary={
          <Box component="span">
            {plan.brand && plan.model && `${plan.brand} ${plan.model}`}
            {plan.requiresSerialNumber && (
              <Chip label="S/N vereist" size="small" sx={{ ml: 1, height: 20 }} />
            )}
          </Box>
        }
      />
    </ListItem>
  );
};

export default RolloutExecutionPage;
