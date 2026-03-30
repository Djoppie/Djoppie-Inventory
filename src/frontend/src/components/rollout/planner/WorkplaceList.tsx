import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Chip, IconButton, Tooltip, useTheme, Button, Stack } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import BadgeIcon from '@mui/icons-material/Badge';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import PlaceIcon from '@mui/icons-material/Place';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import {
  useRolloutWorkplaces,
  useDeleteRolloutWorkplace,
  useUpdateWorkplaceStatus,
} from '../../../hooks/useRollout';
import { WORKPLACE_STATUS_SORT_ORDER } from '../../../constants/rollout.constants';
import type { RolloutWorkplace } from '../../../types/rollout';
import { ASSET_COLOR, SERVICE_COLOR, SECTOR_COLOR } from '../../../constants/filterColors';

interface WorkplaceListProps {
  dayId: number;
  sessionId: number;
  sessionStatus: string;
  dayDate: string;
  /** Optional: pre-loaded workplaces (for rescheduled cards) */
  workplaces?: RolloutWorkplace[];
  /** Show "herplanning" indicator on workplaces */
  showRescheduledIndicator?: boolean;
  /** Original day date (for rescheduled indicator) */
  originalDayDate?: string;
  onEditWorkplace: (workplace: RolloutWorkplace) => void;
  onPrintWorkplace: (workplace: RolloutWorkplace) => void;
  onRescheduleWorkplace: (workplace: RolloutWorkplace, dayId: number, originalDate: string) => void;
  /** Handler to add a new workplace manually */
  onAddWorkplace?: () => void;
  /** Handler to import workplaces from Azure AD */
  onImport?: () => void;
}

const getStatusChip = (status: string) => {
  switch (status) {
    case 'Ready':
      return (
        <Chip
          label="Gereed"
          size="small"
          sx={{
            bgcolor: 'transparent',
            border: '1px solid rgba(34, 197, 94, 0.5)',
            color: '#22c55e',
            fontWeight: 600,
            textShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
          }}
          component="span"
        />
      );
    case 'InProgress':
      return (
        <Chip
          label="Bezig"
          size="small"
          sx={{
            bgcolor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            color: '#f59e0b',
            fontWeight: 600,
          }}
          component="span"
        />
      );
    case 'Completed':
      return (
        <Chip
          label="Voltooid"
          size="small"
          sx={{
            bgcolor: 'transparent',
            border: '1px solid rgba(22, 163, 74, 0.5)',
            color: '#16a34a',
            fontWeight: 600,
          }}
          component="span"
        />
      );
    case 'Skipped':
      return (
        <Chip label="Overgeslagen" size="small" color="default" component="span" />
      );
    case 'Failed':
      return (
        <Chip label="Mislukt" size="small" color="error" component="span" />
      );
    default:
      return null;
  }
};

export default function WorkplaceList({
  dayId,
  sessionId,
  sessionStatus,
  dayDate,
  workplaces: providedWorkplaces,
  showRescheduledIndicator,
  originalDayDate,
  onEditWorkplace,
  onPrintWorkplace,
  onRescheduleWorkplace,
  onAddWorkplace,
  onImport,
}: WorkplaceListProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: fetchedWorkplaces, isLoading } = useRolloutWorkplaces(dayId);
  // Use provided workplaces if available, otherwise fetch
  const workplaces = providedWorkplaces || fetchedWorkplaces;
  const deleteMutation = useDeleteRolloutWorkplace();
  const workplaceStatusMutation = useUpdateWorkplaceStatus();

  const handleDelete = async (workplace: RolloutWorkplace) => {
    if (!window.confirm(`Werkplek "${workplace.userName}" verwijderen?`)) return;
    await deleteMutation.mutateAsync({ workplaceId: workplace.id, dayId });
  };

  const handleSetReady = async (workplace: RolloutWorkplace) => {
    await workplaceStatusMutation.mutateAsync({
      workplaceId: workplace.id,
      dayId,
      status: 'Ready',
    });
  };

  const handleSetPending = async (workplace: RolloutWorkplace) => {
    await workplaceStatusMutation.mutateAsync({
      workplaceId: workplace.id,
      dayId,
      status: 'Pending',
    });
  };

  // Sort workplaces: InProgress first, then Ready, then Pending, then Completed
  const sortedWorkplaces = useMemo(() => {
    if (!workplaces) return [];
    return [...workplaces].sort((a, b) => {
      const orderA = WORKPLACE_STATUS_SORT_ORDER[a.status] ?? 99;
      const orderB = WORKPLACE_STATUS_SORT_ORDER[b.status] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      // Secondary sort by name
      return a.userName.localeCompare(b.userName);
    });
  }, [workplaces]);

  if (isLoading) {
    return <Typography variant="body2" color="text.secondary">Laden...</Typography>;
  }

  const isEditable = sessionStatus !== 'Completed' && sessionStatus !== 'Cancelled';

  return (
    <Box>
      {!workplaces || workplaces.length === 0 ? (
        <Box sx={{
          py: 3,
          textAlign: 'center',
          color: 'text.secondary',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
        }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Nog geen werkplekken toegevoegd aan deze planning.
          </Typography>
          {isEditable && (onAddWorkplace || onImport) && (
            <Stack direction="row" spacing={1.5} justifyContent="center">
              {onAddWorkplace && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={onAddWorkplace}
                  sx={{
                    borderColor: ASSET_COLOR,
                    color: ASSET_COLOR,
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: ASSET_COLOR,
                      bgcolor: 'rgba(255, 119, 0, 0.08)',
                    },
                  }}
                >
                  Werkplek toevoegen
                </Button>
              )}
              {onImport && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CloudDownloadIcon />}
                  onClick={onImport}
                  sx={{
                    borderColor: '#2196F3',
                    color: '#2196F3',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#2196F3',
                      bgcolor: 'rgba(33, 150, 243, 0.08)',
                    },
                  }}
                >
                  Importeren uit Azure AD
                </Button>
              )}
            </Stack>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sortedWorkplaces.map((workplace) => {
            // Ghost = workplace has scheduledDate different from day's date (postponed)
            const isGhost = workplace.scheduledDate &&
              workplace.scheduledDate.split('T')[0] !== dayDate.split('T')[0];

            return (
              <Box
                key={workplace.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  border: '1px solid',
                  borderColor: isGhost
                    ? 'rgba(239, 68, 68, 0.3)'
                    : workplace.status === 'Ready'
                      ? 'rgba(34, 197, 94, 0.3)'
                      : 'divider',
                  borderRadius: 1,
                  bgcolor: isGhost
                    ? 'rgba(239, 68, 68, 0.04)'
                    : workplace.status === 'Ready'
                      ? 'rgba(34, 197, 94, 0.04)'
                      : isDark ? '#1e2328' : '#ffffff',
                  boxShadow: isGhost || workplace.status === 'Ready'
                    ? 'none'
                    : isDark
                      ? '2px 2px 4px #141719, -2px -2px 4px #282e33'
                      : '2px 2px 4px #e0e3e6, -2px -2px 4px #ffffff',
                  opacity: isGhost ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: isGhost
                      ? 'rgba(239, 68, 68, 0.5)'
                      : workplace.status === 'Ready'
                        ? 'rgba(34, 197, 94, 0.5)'
                        : 'rgba(255, 119, 0, 0.3)',
                  },
                }}
              >
                {/* User info - flexible width */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    {/* Role-based icon */}
                    {workplace.serviceName?.toLowerCase().includes('sector') ? (
                      <SupervisorAccountIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                    ) : workplace.serviceName?.toLowerCase().includes('team') ? (
                      <BadgeIcon sx={{ fontSize: 18, color: '#0ea5e9' }} />
                    ) : (
                      <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {workplace.userName}
                    </Typography>
                    {!isGhost && getStatusChip(workplace.status)}
                    {/* Ghost entry - show as "Uitgesteld" */}
                    {isGhost && (
                      <Chip
                        label="Uitgesteld"
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(239, 68, 68, 0.12)',
                          color: '#dc2626',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                        component="span"
                      />
                    )}
                    {/* Show new date for rescheduled workplaces */}
                    {isGhost && workplace.scheduledDate && (
                      <Tooltip title={`Verplaatst naar ${new Date(workplace.scheduledDate).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}`}>
                        <Chip
                          icon={<EventRepeatIcon sx={{ fontSize: '12px !important' }} />}
                          label={`→ ${new Date(workplace.scheduledDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 500,
                            bgcolor: 'rgba(100, 100, 100, 0.08)',
                            color: 'text.secondary',
                            border: '1px solid rgba(100, 100, 100, 0.15)',
                            '& .MuiChip-icon': { color: 'text.secondary' },
                          }}
                          component="span"
                        />
                      </Tooltip>
                    )}
                    {/* Rescheduled indicator - shown on target date */}
                    {showRescheduledIndicator && originalDayDate && (
                      <Tooltip title={`Herplanning van ${new Date(originalDayDate).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}`}>
                        <Chip
                          icon={<EventRepeatIcon sx={{ fontSize: '12px !important' }} />}
                          label={`← ${new Date(originalDayDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: 'rgba(33, 150, 243, 0.1)',
                            color: SECTOR_COLOR,
                            border: '1px solid rgba(33, 150, 243, 0.3)',
                            '& .MuiChip-icon': { color: SECTOR_COLOR },
                          }}
                          component="span"
                        />
                      </Tooltip>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {workplace.userEmail || workplace.location || '-'}
                    </Typography>
                    {/* Physical Workplace indicator */}
                    {workplace.physicalWorkplaceCode && (
                      <Tooltip title={`Fysieke werkplek: ${workplace.physicalWorkplaceName || workplace.physicalWorkplaceCode}`}>
                        <Chip
                          icon={<PlaceIcon sx={{ fontSize: '12px !important' }} />}
                          label={workplace.physicalWorkplaceCode}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: 'rgba(0, 150, 136, 0.12)',
                            color: SERVICE_COLOR,
                            border: '1px solid rgba(0, 150, 136, 0.3)',
                            '& .MuiChip-icon': {
                              color: SERVICE_COLOR,
                              marginLeft: '4px',
                            },
                            '& .MuiChip-label': {
                              paddingRight: '6px',
                            },
                          }}
                          component="span"
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Asset Progress indicator */}
                <Tooltip title={`${workplace.completedItems} van ${workplace.totalItems} assets`}>
                  <Chip
                    icon={<InventoryIcon sx={{ fontSize: 14 }} />}
                    label={`${workplace.completedItems}/${workplace.totalItems}`}
                    size="small"
                    sx={{
                      minWidth: 60,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      ...(workplace.totalItems === 0
                        ? { bgcolor: 'grey.200', color: 'grey.600', border: '1px solid rgba(100, 100, 100, 0.2)', '& .MuiChip-icon': { color: 'grey.500' } }
                        : workplace.completedItems === workplace.totalItems
                          ? { bgcolor: 'rgba(22, 163, 74, 0.15)', color: '#16a34a', border: '1px solid rgba(22, 163, 74, 0.3)', '& .MuiChip-icon': { color: '#16a34a' } }
                          : workplace.completedItems > 0
                            ? { bgcolor: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.3)', '& .MuiChip-icon': { color: '#ca8a04' } }
                            : { bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)', '& .MuiChip-icon': { color: '#dc2626' } }),
                    }}
                  />
                </Tooltip>

                {/* Action buttons - hidden for ghost entries */}
                {!isGhost && (
                  <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                    {/* Reschedule button */}
                    <Tooltip title="Herplannen">
                      <IconButton
                        size="small"
                        onClick={() => onRescheduleWorkplace(workplace, dayId, dayDate)}
                        disabled={!isEditable}
                        sx={{
                          color: '#2196F3',
                          bgcolor: 'rgba(33, 150, 243, 0.1)',
                          '&:hover': {
                            bgcolor: 'rgba(33, 150, 243, 0.2)',
                            color: '#2196F3',
                          },
                        }}
                      >
                        <EventRepeatIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {workplace.status === 'Pending' && (
                      <Tooltip title="Gereed">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleSetReady(workplace)}
                            disabled={workplaceStatusMutation.isPending}
                            sx={{ color: 'rgba(22, 163, 74, 0.7)', '&:hover': { color: '#16a34a' } }}
                          >
                            <CheckCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {workplace.status === 'Ready' && (
                      <Tooltip title="Terug">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleSetPending(workplace)}
                            disabled={workplaceStatusMutation.isPending}
                            sx={{ color: 'rgba(234, 179, 8, 0.7)', '&:hover': { color: '#eab308' } }}
                          >
                            <ChevronLeftIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {workplace.status === 'InProgress' && (
                      <Tooltip title="Ga naar uitvoering">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/rollouts/${sessionId}/execute?workplaceId=${workplace.id}`)}
                          sx={{
                            color: ASSET_COLOR,
                            bgcolor: 'rgba(255, 119, 0, 0.1)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 119, 0, 0.2)',
                              color: ASSET_COLOR,
                            },
                          }}
                        >
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Bewerken">
                      <span>
                        <IconButton size="small" onClick={() => onEditWorkplace(workplace)} disabled={!isEditable}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Print">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onPrintWorkplace(workplace)}
                          disabled={!workplace.assetPlans?.some(p => p.existingAssetId)}
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Verwijderen">
                      <span>
                        <IconButton size="small" onClick={() => handleDelete(workplace)} disabled={!isEditable}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
