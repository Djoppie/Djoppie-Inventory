import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Chip, IconButton, Collapse } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlanningCalendar, { type RescheduledWorkplace } from '../PlanningCalendar';
import { buildRoute } from '../../../../constants/routes';
import type { RolloutSession, RolloutDay } from '../../../../types/rollout';
import { ASSET_COLOR } from '../../../../constants/filterColors';

interface CalendarOverviewProps {
  session: RolloutSession;
  days: RolloutDay[];
  rescheduledWorkplaces: RescheduledWorkplace[];
  expanded: boolean;
  onToggleExpand: () => void;
  /** @deprecated - Calendar now navigates to detail page directly */
  onDayClick?: (day: RolloutDay) => void;
  onDateClick: (date: string) => void;
  onRescheduledClick: (wp: RescheduledWorkplace) => void;
  /** If true, clicking a planning navigates to detail page. Default: true */
  navigateOnDayClick?: boolean;
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
  navigateOnDayClick = true,
}: CalendarOverviewProps) {
  const navigate = useNavigate();

  // Handle day click - navigate to detail page or use callback
  const handleDayClick = useCallback((day: RolloutDay) => {
    if (navigateOnDayClick) {
      navigate(buildRoute.rolloutDayDetail(session.id, day.id));
    } else if (onDayClick) {
      onDayClick(day);
    }
  }, [navigate, session.id, navigateOnDayClick, onDayClick]);

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
          <CalendarTodayIcon sx={{ color: ASSET_COLOR, fontSize: 24 }} />
          <Typography variant="h6" fontWeight={700}>
            Kalender Overzicht
          </Typography>
          <Chip
            label={`${days.length} planning${days.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{
              bgcolor: 'rgba(255, 119, 0, 0.1)',
              color: ASSET_COLOR,
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
            onDayClick={handleDayClick}
            onDateClick={onDateClick}
            onRescheduledClick={onRescheduledClick}
          />
        </Box>
      </Collapse>
    </Paper>
  );
}
