import {
  Paper,
  TextField,
  Stack,
  Chip,
  alpha,
  Grid,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { getNeumorph } from '../../../utils/neumorphicStyles';

const ROLLOUT_COLOR = '#FF7700';
const SUCCESS_COLOR = '#4CAF50';
const WARNING_COLOR = '#FF9800';
const INFO_COLOR = '#2196F3';

interface RolloutSession {
  id: number;
  sessionName: string;
  status: string;
  plannedStartDate?: string;
}

interface RolloutSessionSelectorProps {
  reportableSessions: RolloutSession[];
  selectedSessionId: number | null;
  onSessionChange: (id: number) => void;
  isDark: boolean;
}

const RolloutSessionSelector: React.FC<RolloutSessionSelectorProps> = ({
  reportableSessions,
  selectedSessionId,
  onSessionChange,
  isDark,
}) => {
  const selectedSession = reportableSessions.find(s => s.id === selectedSessionId);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        mb: 1.5,
        bgcolor: isDark ? undefined : undefined,
        boxShadow: getNeumorph(isDark, 'soft'),
        borderRadius: 2,
        borderLeft: `3px solid ${ROLLOUT_COLOR}`,
      }}
    >
      <Grid container spacing={1} alignItems="center">
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            size="small"
            select
            label="Selecteer Rollout Sessie"
            value={selectedSessionId || ''}
            onChange={(e) => onSessionChange(Number(e.target.value))}
            SelectProps={{ native: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: isDark ? alpha('#fff', 0.05) : '#fff',
              },
            }}
          >
            <option value="">Kies een sessie...</option>
            {reportableSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName} ({session.status === 'Completed' ? 'Voltooid' : 'Bezig'})
              </option>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {selectedSession && (
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
              <Chip
                icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
                label={selectedSession.plannedStartDate
                  ? new Date(selectedSession.plannedStartDate).toLocaleDateString('nl-NL')
                  : '-'}
                size="small"
                sx={{
                  bgcolor: alpha(INFO_COLOR, 0.1),
                  color: INFO_COLOR,
                  fontWeight: 600,
                }}
              />
              <Chip
                icon={selectedSession.status === 'Completed' ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
                label={selectedSession.status === 'Completed' ? 'Voltooid' : 'Bezig'}
                size="small"
                sx={{
                  bgcolor: alpha(selectedSession.status === 'Completed' ? SUCCESS_COLOR : WARNING_COLOR, 0.1),
                  color: selectedSession.status === 'Completed' ? SUCCESS_COLOR : WARNING_COLOR,
                  fontWeight: 600,
                }}
              />
            </Stack>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RolloutSessionSelector;
