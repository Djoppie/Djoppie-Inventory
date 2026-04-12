import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Collapse,
  Divider,
  useTheme,
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
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import type { RolloutDay } from '../../../types/rollout';
import { ASSET_COLOR, SECTOR_COLOR } from '../../../constants/filterColors';

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
  /** Whether this is a virtual card showing rescheduled workplaces */
  isRescheduledCard?: boolean;
  /** Original date of the planning (for rescheduled cards) */
  originalDate?: string;
  onEdit: () => void;
  onDelete: () => void;
  onPrint: () => void;
  onImport?: () => void;
  onAddWorkplace?: () => void;
  onExecute?: () => void;
  onSetPlanning: () => void;
  children: React.ReactNode;
}

/**
 * Enhanced Planning Batch card with neumorphic design, clear status indicators, smooth animations,
 * and rescheduling capability visual cues
 */
const RolloutDayCard = React.memo(function RolloutDayCard({
  day,
  serviceColor,
  isEditable,
  isPending,
  readyCount = 0,
  rescheduledCount = 0,
  canExecute = false,
  isRescheduledCard = false,
  originalDate,
  onEdit,
  onDelete,
  onPrint,
  onImport,
  onAddWorkplace,
  onExecute,
  onSetPlanning,
  children,
}: RolloutDayCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState(isRescheduledCard); // Auto-expand rescheduled cards

  const handleToggleExpand = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // Compute counts from actual workplaces, excluding rescheduled ones
  const dayDateKey = day.date?.split('T')[0];
  const activeWorkplaces = day.workplaces?.filter(wp => {
    if (!wp.scheduledDate) return true; // No custom date = belongs to this day
    return wp.scheduledDate.split('T')[0] === dayDateKey;
  }) || [];
  const effectiveTotalWorkplaces = activeWorkplaces.length > 0 ? activeWorkplaces.length : day.totalWorkplaces;
  const effectiveCompletedWorkplaces = activeWorkplaces.length > 0
    ? activeWorkplaces.filter(wp => wp.status === 'Completed').length
    : day.completedWorkplaces;

  const completionPercentage = effectiveTotalWorkplaces > 0
    ? (effectiveCompletedWorkplaces / effectiveTotalWorkplaces) * 100
    : 0;

  const isComplete = day.status === 'Completed';
  const isReady = day.status === 'Ready';

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
      statusColor: ASSET_COLOR,
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
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      {/* Card Header - Compact version without redundant date */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          },
          transition: 'background-color 0.2s ease',
        }}
        onClick={handleToggleExpand}
      >
        {/* Planning Info */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {/* Title Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            {/* Service Color Indicator */}
            <Box
              sx={{
                width: 4,
                height: 24,
                borderRadius: 2,
                bgcolor: serviceColor.bg,
                flexShrink: 0,
              }}
            />

            {/* Planning Name */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
                color: 'text.primary',
                lineHeight: 1.2,
              }}
            >
              {day.name || `Planning ${day.dayNumber}`}
            </Typography>

            {/* Status Badge - shown for all cards including rescheduled */}
            <Chip
              label={statusStyles.statusLabel}
              size="small"
              sx={{
                height: 24,
                bgcolor: statusStyles.statusBg,
                color: statusStyles.statusColor,
                fontWeight: 600,
                fontSize: '0.7rem',
                border: `1px solid ${statusStyles.statusColor}40`,
              }}
            />

            {/* Rescheduled indicator - subtle badge showing original date */}
            {isRescheduledCard && originalDate && (
              <Chip
                icon={<CalendarTodayIcon sx={{ fontSize: '10px !important' }} />}
                label={`← ${new Date(originalDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`}
                size="small"
                sx={{
                  height: 20,
                  bgcolor: 'rgba(100, 100, 100, 0.08)',
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.65rem',
                  border: '1px solid rgba(100, 100, 100, 0.15)',
                  '& .MuiChip-icon': { color: 'text.secondary' },
                }}
              />
            )}
          </Box>

          {/* Stats Row - Compact horizontal layout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Workplace Count */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <GroupsIcon sx={{ fontSize: '0.95rem', color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                {effectiveTotalWorkplaces}
              </Typography>
            </Box>

            {/* Progress Indicator - Compact */}
            {effectiveTotalWorkplaces > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: completionPercentage === 100 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(0, 0, 0, 0.03)',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    color: completionPercentage === 100 ? '#16a34a' : 'text.secondary',
                  }}
                >
                  {effectiveCompletedWorkplaces}/{effectiveTotalWorkplaces}
                </Typography>
                <Box
                  sx={{
                    width: 40,
                    height: 5,
                    bgcolor: 'rgba(0, 0, 0, 0.08)',
                    borderRadius: 2.5,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${completionPercentage}%`,
                      height: '100%',
                      bgcolor: completionPercentage === 100 ? '#16a34a' : ASSET_COLOR,
                      transition: 'width 0.5s ease',
                      borderRadius: 2.5,
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Ready Workplaces Count */}
            {readyCount > 0 && (
              <Chip
                icon={<CheckCircleOutlineIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={`${readyCount} gereed`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: 'rgba(34, 197, 94, 0.1)',
                  color: '#22c55e',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  '& .MuiChip-icon': { color: '#22c55e' },
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            )}

            {/* Rescheduled Workplaces Count */}
            {rescheduledCount > 0 && (
              <Chip
                icon={<CalendarTodayIcon sx={{ fontSize: '0.75rem !important' }} />}
                label={`${rescheduledCount} uitgesteld`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: 'rgba(33, 150, 243, 0.08)',
                  color: SECTOR_COLOR,
                  border: '1px dashed rgba(33, 150, 243, 0.3)',
                  '& .MuiChip-icon': { color: SECTOR_COLOR },
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
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

          {/* Add Workplace - Hide for rescheduled cards */}
          {!isRescheduledCard && onAddWorkplace && (
            <Tooltip title="Werkplek toevoegen">
              <span>
                <IconButton
                  size="small"
                  onClick={onAddWorkplace}
                  disabled={!isEditable}
                  sx={{
                    color: 'rgba(255, 119, 0, 0.7)',
                    bgcolor: 'rgba(255, 119, 0, 0.1)',
                    border: '1px solid rgba(255, 119, 0, 0.3)',
                    '&:hover:not(:disabled)': {
                      color: ASSET_COLOR,
                      bgcolor: 'rgba(255, 119, 0, 0.15)',
                      transform: 'scale(1.1)',
                    },
                    '&:disabled': {
                      opacity: 0.5,
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <PersonAddIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}

          {/* Import from Azure AD - Hide for rescheduled cards */}
          {!isRescheduledCard && onImport && (
            <Tooltip title="Importeren uit Azure AD">
              <span>
                <IconButton
                  size="small"
                  onClick={onImport}
                  disabled={!isEditable}
                  sx={{
                    color: 'rgba(33, 150, 243, 0.6)',
                    '&:hover:not(:disabled)': {
                      color: '#2196F3',
                      bgcolor: 'rgba(33, 150, 243, 0.08)',
                      transform: 'scale(1.1)',
                    },
                    '&:disabled': {
                      opacity: 0.5,
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <CloudDownloadIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}

          {/* Edit - Hide for rescheduled cards */}
          {!isRescheduledCard && (
            <Tooltip title="Bewerken">
              <span>
                <IconButton
                  size="small"
                  onClick={onEdit}
                  disabled={!isEditable}
                  sx={{
                    color: 'rgba(255, 119, 0, 0.6)',
                    '&:hover:not(:disabled)': {
                      color: ASSET_COLOR,
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
          )}

          {/* Print - Hide for rescheduled cards */}
          {!isRescheduledCard && (
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
          )}

          {/* Delete - Hide for rescheduled cards */}
          {!isRescheduledCard && (
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
          )}

          {/* Expand Toggle */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand();
            }}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary',
              ml: 0.5,
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Expandable Content */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }} />
        <Box
          sx={{
            p: 2,
            bgcolor: isDark ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.02)',
            boxShadow: isDark
              ? 'inset 0 4px 8px rgba(0, 0, 0, 0.2)'
              : 'inset 0 4px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Card>
  );
});

export default RolloutDayCard;
