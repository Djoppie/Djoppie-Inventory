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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import type { RolloutDay } from '../../types/rollout';

interface RolloutDayCardProps {
  day: RolloutDay;
  serviceColor: { bg: string; text: string };
  isEditable: boolean;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPrint: () => void;
  onSetReady: () => void;
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
  onEdit,
  onDelete,
  onPrint,
  onSetReady,
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
        statusBg: 'transparent',
        statusLabel: 'Gereed',
        glow: '0 0 20px rgba(34, 197, 94, 0.3), 0 0 40px rgba(34, 197, 94, 0.1)',
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
        {/* Service Color Indicator */}
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: serviceColor.bg,
            flexShrink: 0,
            boxShadow: `0 0 0 3px ${serviceColor.bg}20`,
            transition: 'transform 0.2s ease',
            transform: expanded ? 'scale(1.2)' : 'scale(1)',
          }}
        />

        {/* Planning Info */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
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

            {/* Status Badge with Glow */}
            <Chip
              label={statusStyles.statusLabel}
              size="small"
              sx={{
                bgcolor: statusStyles.statusBg,
                color: statusStyles.statusColor,
                fontWeight: 700,
                fontSize: '0.75rem',
                border: `1px solid ${statusStyles.statusColor}${isReady ? '80' : '40'}`,
                boxShadow: statusStyles.glow,
                textShadow: isReady ? `0 0 10px ${statusStyles.statusColor}40` : 'none',
                animation: isReady ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                '@keyframes pulse-glow': {
                  '0%, 100%': {
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.3), 0 0 40px rgba(34, 197, 94, 0.1)',
                  },
                  '50%': {
                    boxShadow: '0 0 30px rgba(34, 197, 94, 0.5), 0 0 60px rgba(34, 197, 94, 0.2)',
                  },
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Date with Reschedule Visual Hint */}
            <Tooltip title="Datum kan aangepast worden via bewerken" placement="top">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: 'rgba(255, 119, 0, 0.08)',
                  border: '1px solid rgba(255, 119, 0, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 119, 0, 0.12)',
                    borderColor: 'rgba(255, 119, 0, 0.4)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(255, 119, 0, 0.15)',
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: '0.85rem', color: '#FF7700' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#FF7700', fontSize: '0.8rem' }}>
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
              <PeopleIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {day.totalWorkplaces} {day.totalWorkplaces === 1 ? 'werkplek' : 'werkplekken'}
              </Typography>
            </Box>

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
          {/* Status Toggle */}
          {isPlanning && day.totalWorkplaces > 0 && (
            <Tooltip title="Markeer als gereed voor uitvoering">
              <IconButton
                size="small"
                onClick={onSetReady}
                disabled={isPending}
                sx={{
                  color: 'rgba(22, 163, 74, 0.7)',
                  '&:hover': {
                    color: '#16a34a',
                    bgcolor: 'rgba(22, 163, 74, 0.08)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <CheckCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {isReady && (
            <Tooltip title="Terugzetten naar planning">
              <IconButton
                size="small"
                onClick={onSetPlanning}
                disabled={isPending}
                sx={{
                  color: 'rgba(234, 179, 8, 0.7)',
                  '&:hover': {
                    color: '#eab308',
                    bgcolor: 'rgba(234, 179, 8, 0.08)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Edit */}
          <Tooltip title="Bewerken">
            <IconButton
              size="small"
              onClick={onEdit}
              disabled={!isEditable}
              sx={{
                color: 'rgba(255, 119, 0, 0.6)',
                '&:hover': {
                  color: '#FF7700',
                  bgcolor: 'rgba(255, 119, 0, 0.08)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Print */}
          <Tooltip title="Print QR codes">
            <IconButton
              size="small"
              onClick={onPrint}
              disabled={!isEditable}
              sx={{
                color: 'rgba(59, 130, 246, 0.6)',
                '&:hover': {
                  color: '#3B82F6',
                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Delete */}
          <Tooltip title="Verwijderen">
            <IconButton
              size="small"
              onClick={onDelete}
              disabled={!isEditable}
              sx={{
                color: 'rgba(239, 68, 68, 0.6)',
                '&:hover': {
                  color: '#EF4444',
                  bgcolor: 'rgba(239, 68, 68, 0.08)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Expand Toggle */}
          <IconButton
            size="small"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              color: 'text.secondary',
              ml: 0.5,
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
