import { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Collapse,
  LinearProgress,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupsIcon from '@mui/icons-material/Groups';
import EventNoteIcon from '@mui/icons-material/EventNote';
import type { RolloutDay } from '../../types/rollout';

interface RolloutDayCardProps {
  day: RolloutDay;
  serviceColor: { bg: string; text: string };
  isEditable: boolean;
  isPending: boolean;
  /** Count of workplaces with status 'Ready' */
  readyCount?: number;
  /** Count of workplaces with custom scheduledDate different from day.date */
  rescheduledCount?: number;
  /** Whether this planning can be executed (has ready workplaces) */
  canExecute?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPrint: () => void;
  onExecute?: () => void;
  onSetPlanning: () => void;
  children: React.ReactNode;
}

/**
 * Enhanced Planning Batch card with modern design, clear status indicators, smooth animations,
 * and rescheduling capability visual cues
 */
const RolloutDayCard = ({
  day,
  serviceColor,
  isEditable,
  isPending,
  readyCount = 0,
  rescheduledCount = 0,
  canExecute = false,
  onEdit,
  onDelete,
  onPrint,
  onExecute,
  onSetPlanning,
  children,
}: RolloutDayCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const completionPercentage = day.totalWorkplaces > 0
    ? (day.completedWorkplaces / day.totalWorkplaces) * 100
    : 0;

  const isComplete = day.status === 'Completed';
  const isReady = day.status === 'Ready';
  const isPlanning = day.status === 'Planning';

  // Status-based styling
  const getStatusStyles = () => {
    if (isComplete) {
      return {
        borderColor: '#16a34a',
        bgGradient: 'linear-gradient(135deg, rgba(22, 163, 74, 0.03) 0%, rgba(22, 163, 74, 0.01) 100%)',
        statusColor: '#16a34a',
        statusBg: 'rgba(22, 163, 74, 0.12)',
        statusLabel: 'Voltooid',
        glow: 'none',
      };
    }
    if (isReady) {
      return {
        borderColor: '#22c55e',
        bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.01) 100%)',
        statusColor: '#22c55e',
        statusBg: 'rgba(34, 197, 94, 0.1)',
        statusLabel: 'Gereed',
        glow: 'none',
      };
    }
    // Planning
    return {
      borderColor: 'rgba(255, 119, 0, 0.2)',
      bgGradient: 'linear-gradient(135deg, rgba(255, 119, 0, 0.02) 0%, transparent 100%)',
      statusColor: '#FF7700',
      statusBg: 'rgba(255, 119, 0, 0.08)',
      statusLabel: 'Planning',
      glow: 'none',
    };
  };

  const statusStyles = getStatusStyles();

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        background: statusStyles.bgGradient,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          borderColor: statusStyles.borderColor,
        },
        // Left border accent
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: statusStyles.borderColor,
          transition: 'width 0.3s ease',
        },
        '&:hover::before': {
          width: 6,
        },
      }}
    >
      {/* Card Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.02)',
          },
          transition: 'background-color 0.2s ease',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Planning Info */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            {/* Planning Icon */}
            <EventNoteIcon sx={{ fontSize: 22, color: serviceColor.bg }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'text.primary',
              }}
            >
              {day.name || `Planning ${day.dayNumber}`}
            </Typography>

            {/* Status Badge */}
            <Chip
              label={statusStyles.statusLabel}
              size="small"
              sx={{
                bgcolor: statusStyles.statusBg,
                color: statusStyles.statusColor,
                fontWeight: 700,
                fontSize: '0.75rem',
                border: `1px solid ${statusStyles.statusColor}40`,
                transition: 'all 0.3s ease',
                animation: 'subtle-pulse 3s ease-in-out infinite',
                '@keyframes subtle-pulse': {
                  '0%, 100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                  '50%': {
                    transform: 'scale(1.02)',
                    opacity: 0.9,
                  },
                },
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Date Chip with Service Color */}
            <Tooltip title="Datum kan aangepast worden via bewerken" placement="top">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: `${serviceColor.bg}15`,
                  border: `1px solid ${serviceColor.bg}40`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: `${serviceColor.bg}25`,
                    borderColor: `${serviceColor.bg}60`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 2px 8px ${serviceColor.bg}20`,
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: '0.85rem', color: serviceColor.bg }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: serviceColor.text, fontSize: '0.8rem' }}>
                  {new Date(day.date).toLocaleDateString('nl-NL', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Typography>
              </Box>
            </Tooltip>

            {/* Workplace Count */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <GroupsIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {day.totalWorkplaces} {day.totalWorkplaces === 1 ? 'werkplek' : 'werkplekken'}
              </Typography>
            </Box>

            {/* Ready Workplaces Count */}
            {readyCount > 0 && (
              <Chip
                icon={<CheckCircleOutlineIcon sx={{ fontSize: '0.9rem !important' }} />}
                label={`${readyCount} gereed`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: 'rgba(34, 197, 94, 0.1)',
                  color: '#22c55e',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  '& .MuiChip-icon': { color: '#22c55e' },
                }}
              />
            )}

            {/* Rescheduled Workplaces Count */}
            {rescheduledCount > 0 && (
              <Chip
                icon={<CalendarTodayIcon sx={{ fontSize: '0.8rem !important' }} />}
                label={`${rescheduledCount} uitgesteld`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: 'rgba(33, 150, 243, 0.1)',
                  color: '#1976d2',
                  border: '1px dashed rgba(33, 150, 243, 0.4)',
                  '& .MuiChip-icon': { color: '#1976d2' },
                }}
              />
            )}

            {/* Progress Indicator */}
            {day.totalWorkplaces > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: completionPercentage === 100 ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                  border: '1px solid',
                  borderColor: completionPercentage === 100 ? 'rgba(22, 163, 74, 0.3)' : 'transparent',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: completionPercentage === 100 ? '#16a34a' : 'text.secondary',
                  }}
                >
                  {day.completedWorkplaces}/{day.totalWorkplaces}
                </Typography>
                <Box
                  sx={{
                    width: 60,
                    height: 6,
                    bgcolor: 'rgba(0, 0, 0, 0.08)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${completionPercentage}%`,
                      height: '100%',
                      bgcolor: completionPercentage === 100 ? '#16a34a' : '#FF7700',
                      transition: 'width 0.5s ease',
                      borderRadius: 3,
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            ml: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Execute Button - Show when planning can be executed */}
          {canExecute && onExecute && (
            <Tooltip title="Start uitvoering">
              <span>
                <IconButton
                  size="small"
                  onClick={onExecute}
                  disabled={isPending}
                  sx={{
                    color: '#16a34a',
                    bgcolor: 'rgba(22, 163, 74, 0.1)',
                    border: '1px solid rgba(22, 163, 74, 0.3)',
                    '&:hover:not(:disabled)': {
                      color: '#fff',
                      bgcolor: '#16a34a',
                      transform: 'scale(1.1)',
                    },
                    '&:disabled': {
                      opacity: 0.5,
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}

          {isReady && (
            <Tooltip title="Terugzetten naar planning">
              <span>
                <IconButton
                  size="small"
                  onClick={onSetPlanning}
                  disabled={isPending}
                  sx={{
                    color: 'rgba(234, 179, 8, 0.7)',
                    '&:hover:not(:disabled)': {
                      color: '#eab308',
                      bgcolor: 'rgba(234, 179, 8, 0.08)',
                      transform: 'scale(1.1)',
                    },
                    '&:disabled': {
                      opacity: 0.5,
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}

          {/* Edit */}
          <Tooltip title="Bewerken">
            <span>
              <IconButton
                size="small"
                onClick={onEdit}
                disabled={!isEditable}
                sx={{
                  color: 'rgba(255, 119, 0, 0.6)',
                  '&:hover:not(:disabled)': {
                    color: '#FF7700',
                    bgcolor: 'rgba(255, 119, 0, 0.08)',
                    transform: 'scale(1.1)',
                  },
                  '&:disabled': {
                    opacity: 0.5,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {/* Print */}
          <Tooltip title="Print QR codes">
            <span>
              <IconButton
                size="small"
                onClick={onPrint}
                disabled={!isEditable}
                sx={{
                  color: 'rgba(59, 130, 246, 0.6)',
                  '&:hover:not(:disabled)': {
                    color: '#3B82F6',
                    bgcolor: 'rgba(59, 130, 246, 0.08)',
                    transform: 'scale(1.1)',
                  },
                  '&:disabled': {
                    opacity: 0.5,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <PrintIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {/* Delete */}
          <Tooltip title="Verwijderen">
            <span>
              <IconButton
                size="small"
                onClick={onDelete}
                disabled={!isEditable}
                sx={{
                  color: 'rgba(239, 68, 68, 0.6)',
                  '&:hover:not(:disabled)': {
                    color: '#EF4444',
                    bgcolor: 'rgba(239, 68, 68, 0.08)',
                    transform: 'scale(1.1)',
                  },
                  '&:disabled': {
                    opacity: 0.5,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {/* Expand Toggle */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              color: 'text.secondary',
              ml: 0.5,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.08)',
              },
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Progress Bar */}
      {day.totalWorkplaces > 0 && (
        <LinearProgress
          variant="determinate"
          value={completionPercentage}
          sx={{
            height: 3,
            bgcolor: 'rgba(0, 0, 0, 0.05)',
            '& .MuiLinearProgress-bar': {
              bgcolor: completionPercentage === 100 ? '#16a34a' : '#FF7700',
              transition: 'transform 0.5s ease, background-color 0.3s ease',
            },
          }}
        />
      )}

      {/* Expandable Content */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <Box sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
          {children}
        </Box>
      </Collapse>
    </Card>
  );
};

export default RolloutDayCard;
