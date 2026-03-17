import { Box, Paper, Typography, Chip, IconButton, Collapse } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlanningCalendar, { type RescheduledWorkplace } from '../PlanningCalendar';
import type { RolloutSession, RolloutDay, RolloutWorkplace } from '../../../types/rollout';

interface CalendarOverviewProps {
  session: RolloutSession;
  days: RolloutDay[];
  rescheduledWorkplaces: RescheduledWorkplace[];
  expanded: boolean;
  onToggleExpand: () => void;
  onDayClick: (day: RolloutDay) => void;
  onDateClick: (date: string) => void;
  onRescheduledClick: (wp: RescheduledWorkplace) => void;
}

export default function CalendarOverview({
  session,
  days,
  rescheduledWorkplaces,
  expanded,
  onToggleExpand,
  onDayClick,
  onDateClick,
  onRescheduledClick,
}: CalendarOverviewProps) {
  if (!days || days.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'var(--dark-bg-elevated)' : 'background.paper',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark' ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
      }}
    >
      {/* Collapsible Header */}
      <Box
        onClick={onToggleExpand}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: 'divider',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CalendarTodayIcon sx={{ color: '#FF7700', fontSize: 24 }} />
          <Typography variant="h6" fontWeight={700}>
            Kalender Overzicht
          </Typography>
          <Chip
            label={`${days.length} planning${days.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{
              bgcolor: 'rgba(255, 119, 0, 0.1)',
              color: '#FF7700',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>
        <IconButton
          size="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ p: 0 }}>
          <PlanningCalendar
            days={days}
            plannedStartDate={session?.plannedStartDate?.split('T')[0]}
            plannedEndDate={session?.plannedEndDate?.split('T')[0]}
            rescheduledWorkplaces={rescheduledWorkplaces}
            onDayClick={onDayClick}
            onDateClick={onDateClick}
            onRescheduledClick={onRescheduledClick}
          />
        </Box>
      </Collapse>
    </Paper>
  );
}
