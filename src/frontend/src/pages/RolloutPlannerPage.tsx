import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import {
  useRolloutSession,
  useCreateRolloutSession,
  useUpdateRolloutSession,
  useRolloutDays,
  useRolloutWorkplaces,
} from '../hooks/useRollout';
import { getStatusColor } from '../api/rollout.api';
import { ROUTES } from '../constants/routes';
import Loading from '../components/common/Loading';
import RolloutDayDialog from '../components/rollout/RolloutDayDialog';
import RolloutWorkplaceDialog from '../components/rollout/RolloutWorkplaceDialog';
import type { CreateRolloutSession, UpdateRolloutSession, RolloutDay, RolloutWorkplace } from '../types/rollout';

/**
 * Workplace List Component - Shows workplaces for a specific day
 */
interface WorkplaceListProps {
  dayId: number;
  sessionStatus: string;
  onAddWorkplace: () => void;
  onEditWorkplace: (workplace: RolloutWorkplace) => void;
}

const WorkplaceList = ({ dayId, sessionStatus, onAddWorkplace, onEditWorkplace }: WorkplaceListProps) => {
  const { data: workplaces, isLoading } = useRolloutWorkplaces(dayId);

  if (isLoading) {
    return <Typography variant="body2" color="text.secondary">Laden...</Typography>;
  }

  const isEditable = sessionStatus !== 'Completed' && sessionStatus !== 'Cancelled';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2">
          Werkplekken ({workplaces?.length || 0})
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onAddWorkplace}
          disabled={!isEditable}
        >
          Werkplek Toevoegen
        </Button>
      </Box>

      {!workplaces || workplaces.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Nog geen werkplekken toegevoegd. Klik op "Werkplek Toevoegen" om te beginnen.
        </Alert>
      ) : (
        <List>
          {workplaces.map((workplace) => (
            <ListItem
              key={workplace.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
              }}
              secondaryAction={
                <IconButton edge="end" onClick={() => onEditWorkplace(workplace)} disabled={!isEditable}>
                  <EditIcon />
                </IconButton>
              }
            >
              <PersonIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <ListItemText
                primary={workplace.userName}
                secondary={
                  <Box component="span">
                    {workplace.userEmail && <>{workplace.userEmail} • </>}
                    {workplace.location && <>{workplace.location} • </>}
                    <Chip
                      label={`${workplace.completedItems}/${workplace.totalItems} items`}
                      size="small"
                      sx={{ ml: 1 }}
                      color={workplace.status === 'Completed' ? 'success' : 'default'}
                    />
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

/**
 * Rollout Planner Page - Create/edit rollout sessions with days and workplaces
 */
const RolloutPlannerPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Form state
  const [sessionName, setSessionName] = useState('');
  const [description, setDescription] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');

  // Dialog state
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<RolloutDay | undefined>();
  const [workplaceDialogOpen, setWorkplaceDialogOpen] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState<RolloutWorkplace | undefined>();
  const [activeWorkplaceDayId, setActiveWorkplaceDayId] = useState<number | undefined>();

  // Fetch session data if editing
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useRolloutSession(
    isEditMode ? Number(id) : 0,
    { includeDays: true, includeWorkplaces: true }
  );

  const {
    data: days,
    isLoading: daysLoading,
  } = useRolloutDays(
    isEditMode ? Number(id) : 0,
    undefined
  );

  // Mutations
  const createMutation = useCreateRolloutSession();
  const updateMutation = useUpdateRolloutSession();

  // Load session data into form
  useEffect(() => {
    if (session) {
      setSessionName(session.sessionName);
      setDescription(session.description || '');
      setPlannedStartDate(session.plannedStartDate.split('T')[0]);
      setPlannedEndDate(session.plannedEndDate?.split('T')[0] || '');
    }
  }, [session]);

  const handleSave = async () => {
    const sessionData: CreateRolloutSession | UpdateRolloutSession = {
      sessionName,
      description: description || undefined,
      plannedStartDate,
      plannedEndDate: plannedEndDate || undefined,
      status: isEditMode ? session?.status : 'Planning',
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: Number(id),
          data: sessionData as UpdateRolloutSession,
        });
      } else {
        const newSession = await createMutation.mutateAsync(sessionData as CreateRolloutSession);
        navigate(`/rollouts/${newSession.id}`);
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const handleBack = () => {
    navigate(ROUTES.ROLLOUTS);
  };

  const handleOpenDayDialog = (day?: RolloutDay) => {
    setSelectedDay(day);
    setDayDialogOpen(true);
  };

  const handleCloseDayDialog = () => {
    setSelectedDay(undefined);
    setDayDialogOpen(false);
  };

  const handleOpenWorkplaceDialog = (dayId: number, workplace?: RolloutWorkplace) => {
    setActiveWorkplaceDayId(dayId);
    setSelectedWorkplace(workplace);
    setWorkplaceDialogOpen(true);
  };

  const handleCloseWorkplaceDialog = () => {
    setActiveWorkplaceDayId(undefined);
    setSelectedWorkplace(undefined);
    setWorkplaceDialogOpen(false);
  };

  if (sessionLoading || daysLoading) {
    return <Loading />;
  }

  if (sessionError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Fout bij laden van sessie: {sessionError.message}
        </Alert>
      </Container>
    );
  }

  const isFormValid = sessionName.trim() && plannedStartDate;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {isEditMode ? 'Rollout Bewerken' : 'Nieuwe Rollout'}
        </Typography>
        {isEditMode && session && (
          <Chip
            label={t(`rollout.status.${session.status.toLowerCase()}`)}
            color={getStatusColor(session.status)}
            sx={{ ml: 2 }}
          />
        )}
      </Box>

      {/* Session Details Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sessie Details
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Sessienaam"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            required
            fullWidth
            helperText="Geef een duidelijke naam voor deze rollout sessie"
          />
          <TextField
            label="Beschrijving"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
            helperText="Optionele beschrijving van de rollout"
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Geplande Startdatum"
              type="date"
              value={plannedStartDate}
              onChange={(e) => setPlannedStartDate(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Geplande Einddatum"
              type="date"
              value={plannedEndDate}
              onChange={(e) => setPlannedEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Optioneel"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button onClick={handleBack}>
            Annuleren
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </Box>
      </Paper>

      {/* Days Management - Only show in edit mode */}
      {isEditMode && session && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Dagen ({days?.length || 0})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              disabled={session.status === 'Completed' || session.status === 'Cancelled'}
              onClick={() => handleOpenDayDialog()}
            >
              Dag Toevoegen
            </Button>
          </Box>

          {!days || days.length === 0 ? (
            <Alert severity="info">
              Nog geen dagen toegevoegd. Klik op "Dag Toevoegen" om te beginnen met plannen.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {days.map((day, index) => (
                <Accordion key={day.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography sx={{ fontWeight: 'medium' }}>
                        Dag {day.dayNumber}: {new Date(day.date).toLocaleDateString('nl-NL')}
                      </Typography>
                      {day.name && (
                        <Typography variant="body2" color="text.secondary">
                          - {day.name}
                        </Typography>
                      )}
                      <Box sx={{ flexGrow: 1 }} />
                      <Chip
                        label={`${day.completedWorkplaces}/${day.totalWorkplaces} werkplekken`}
                        size="small"
                        color={day.completedWorkplaces === day.totalWorkplaces ? 'success' : 'default'}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Divider sx={{ mb: 2 }} />
                    <WorkplaceList
                      dayId={day.id}
                      sessionStatus={session.status}
                      onAddWorkplace={() => handleOpenWorkplaceDialog(day.id)}
                      onEditWorkplace={(workplace) => handleOpenWorkplaceDialog(day.id, workplace)}
                    />
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </>
      )}

      {/* Dialogs */}
      <RolloutDayDialog
        open={dayDialogOpen}
        onClose={handleCloseDayDialog}
        sessionId={Number(id)}
        day={selectedDay}
        dayNumber={(days?.length || 0) + 1}
      />
      <RolloutWorkplaceDialog
        open={workplaceDialogOpen}
        onClose={handleCloseWorkplaceDialog}
        dayId={activeWorkplaceDayId || 0}
        workplace={selectedWorkplace}
      />
    </Container>
  );
};

export default RolloutPlannerPage;
