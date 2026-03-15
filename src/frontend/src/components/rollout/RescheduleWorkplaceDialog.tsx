/**
 * RescheduleWorkplaceDialog - Neumorphic Djoppie Style
 *
 * Dedicated dialog for rescheduling postponed workplaces to new dates
 * Features: Visual date picker, original date display, bulk reschedule support
 * Design: Neumorphic soft UI with Djoppie orange accent (#FF7700)
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Stack,
  Chip,
  Alert,
  IconButton,
  useTheme,
  Divider,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useMoveRolloutWorkplace } from '../../hooks/useRollout';
import type { RolloutWorkplace } from '../../types/rollout';

interface RescheduleWorkplaceDialogProps {
  open: boolean;
  onClose: () => void;
  workplace: RolloutWorkplace | null;
  dayId: number; // The ID of the RolloutDay this workplace belongs to
  originalDate: string; // The date of the RolloutDay this workplace belongs to
}

const RescheduleWorkplaceDialog = ({
  open,
  onClose,
  workplace,
  dayId,
  originalDate,
}: RescheduleWorkplaceDialogProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const moveMutation = useMoveRolloutWorkplace();

  // Initialize state with current values
  const initialScheduledDate = workplace?.scheduledDate || originalDate;
  const [newScheduledDate, setNewScheduledDate] = useState(() => initialScheduledDate.split('T')[0]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [movedToDate, setMovedToDate] = useState<string | null>(null);

  if (!workplace) return null;

  const currentScheduledDate = workplace.scheduledDate || originalDate;
  const currentScheduledDateKey = currentScheduledDate.split('T')[0];
  const isDateChanged = newScheduledDate !== currentScheduledDateKey;
  const isPostponed = workplace.scheduledDate && workplace.scheduledDate.split('T')[0] !== originalDate.split('T')[0];

  // Format dates for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleReschedule = async () => {
    if (!isDateChanged) {
      onClose();
      return;
    }

    try {
      await moveMutation.mutateAsync({
        workplaceId: workplace.id,
        sourceDayId: dayId,
        data: {
          targetDate: newScheduledDate,
        },
      });
      setMovedToDate(newScheduledDate);
      setShowConfirmation(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to move workplace:', error);
    }
  };

  const handleResetToOriginal = async () => {
    setNewScheduledDate(originalDate.split('T')[0]);
  };

  const handleClose = () => {
    if (!moveMutation.isPending) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
      key={workplace?.id || 'new'}
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: 'none',
          bgcolor: isDark ? 'rgba(30, 35, 40, 0.95)' : 'rgba(232, 238, 243, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: isDark
            ? '0px 12px 40px rgba(0, 0, 0, 0.6), 0px 4px 12px rgba(0, 0, 0, 0.4)'
            : '0px 12px 40px rgba(150, 155, 160, 0.35), 0px 4px 12px rgba(180, 185, 190, 0.25)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header - Neumorphic */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          bgcolor: isDark ? '#1e2328' : '#e8eef3',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Icon Container */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isDark
                ? '8px 8px 16px #161a1d, -8px -8px 16px #262c33, inset 0 0 0 1px rgba(33, 150, 243, 0.3)'
                : '8px 8px 16px #c5cad0, -8px -8px 16px #ffffff, inset 0 0 0 1px rgba(33, 150, 243, 0.2)',
            }}
          >
            <EventRepeatIcon
              sx={{
                fontSize: '1.6rem',
                color: '#2196F3',
                filter: 'drop-shadow(0 2px 4px rgba(33, 150, 243, 0.3))',
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                color: '#2196F3',
                letterSpacing: '-0.02em',
                textShadow: isDark ? '0 2px 10px rgba(33, 150, 243, 0.3)' : 'none',
              }}
            >
              Werkplek Herplannen
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.5, color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }}
            >
              Verplaats naar een nieuwe datum
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            disabled={moveMutation.isPending}
            size="small"
            sx={{
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isDark
                ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff',
              '&:hover': {
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                  : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
              },
            }}
          >
            <CloseIcon sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }} />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent
        sx={{
          p: 3,
          bgcolor: isDark ? '#1e2328' : '#e8eef3',
        }}
      >
        {showConfirmation ? (
          // Success Confirmation - Neumorphic
          <Box
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isDark
                ? '8px 8px 16px #161a1d, -8px -8px 16px #262c33'
                : '8px 8px 16px #c5cad0, -8px -8px 16px #ffffff',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? '12px 12px 24px #161a1d, -12px -12px 24px #262c33, inset 0 0 0 2px rgba(76, 175, 80, 0.4)'
                  : '12px 12px 24px #c5cad0, -12px -12px 24px #ffffff, inset 0 0 0 2px rgba(76, 175, 80, 0.3)',
                mb: 2,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: '3rem', color: '#4CAF50' }} />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: '#4CAF50' }}>
              Werkplek Uitgesteld
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Werkplek blijft in dezelfde planning, maar wordt uitgevoerd op een andere datum
            </Typography>
            {movedToDate && (
              <Chip
                icon={<CalendarTodayIcon />}
                label={formatDate(movedToDate)}
                sx={{
                  bgcolor: isDark ? '#1e2328' : '#e8eef3',
                  color: '#2196F3',
                  fontWeight: 600,
                  boxShadow: isDark
                    ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                    : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff',
                }}
              />
            )}
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Workplace Info Card - Neumorphic */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 5px 5px 10px #161a1d, inset -5px -5px 10px #262c33'
                  : 'inset 5px 5px 10px #c5cad0, inset -5px -5px 10px #ffffff',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: isDark ? '#1e2328' : '#e8eef3',
                    boxShadow: isDark
                      ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                      : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff',
                  }}
                >
                  <PersonIcon sx={{ color: '#FF7700', fontSize: '1.2rem' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                    {workplace.userName}
                  </Typography>
                  {workplace.userEmail && (
                    <Typography variant="caption" color="text.secondary">
                      {workplace.userEmail}
                    </Typography>
                  )}
                </Box>
              </Stack>
              {workplace.serviceName && (
                <Chip
                  label={workplace.serviceName}
                  size="small"
                  sx={{
                    mt: 1,
                    bgcolor: isDark ? '#1e2328' : '#e8eef3',
                    color: '#FF7700',
                    fontWeight: 600,
                    boxShadow: isDark
                      ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
                      : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',
                  }}
                />
              )}
            </Box>

            {/* Current Status Alert */}
            {isPostponed && (
              <Alert
                severity="warning"
                icon={<WarningAmberIcon />}
                sx={{
                  borderRadius: 2,
                  bgcolor: isDark ? '#1e2328' : '#e8eef3',
                  boxShadow: isDark
                    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                  border: 'none',
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Deze werkplek is momenteel uitgesteld
                </Typography>
              </Alert>
            )}

            {/* Date Comparison - Neumorphic */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? '8px 8px 16px #161a1d, -8px -8px 16px #262c33'
                  : '8px 8px 16px #c5cad0, -8px -8px 16px #ffffff',
              }}
            >
              <Stack spacing={2}>
                {/* Original Date */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{
                      display: 'block',
                      mb: 1,
                      color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Originele Planning
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: isDark ? '#1e2328' : '#e8eef3',
                      boxShadow: isDark
                        ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                        : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <CalendarTodayIcon
                      sx={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {formatDate(originalDate)}
                    </Typography>
                  </Box>
                </Box>

                {/* Arrow Indicator */}
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: isDark ? '#1e2328' : '#e8eef3',
                      boxShadow: isDateChanged
                        ? (isDark
                          ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33, inset 0 0 0 2px rgba(33, 150, 243, 0.4)'
                          : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff, inset 0 0 0 2px rgba(33, 150, 243, 0.3)')
                        : (isDark
                          ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33'
                          : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff'),
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <SwapHorizIcon
                      sx={{
                        color: isDateChanged ? '#2196F3' : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                        fontSize: '1.5rem',
                        transition: 'color 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>

                {/* New Date Picker */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{
                      display: 'block',
                      mb: 1,
                      color: '#2196F3',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Nieuwe Datum
                  </Typography>
                  <TextField
                    type="date"
                    value={newScheduledDate}
                    onChange={(e) => setNewScheduledDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: isDark ? '#1e2328' : '#e8eef3',
                        borderRadius: 2,
                        boxShadow: isDark
                          ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33'
                          : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff',
                        '& fieldset': { border: 'none' },
                        '&:hover, &.Mui-focused': {
                          boxShadow: isDark
                            ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33, 0 0 0 2px rgba(33, 150, 243, 0.4)'
                            : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(33, 150, 243, 0.3)',
                        },
                      },
                      '& input': {
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#2196F3',
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {formatDate(newScheduledDate)}
                  </Typography>
                </Box>
              </Stack>

              {/* Reset Button - Show only if postponed */}
              {isPostponed && (
                <>
                  <Divider
                    sx={{
                      my: 2.5,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    }}
                  />
                  <Button
                    fullWidth
                    size="small"
                    onClick={handleResetToOriginal}
                    disabled={newScheduledDate === originalDate.split('T')[0]}
                    sx={{
                      py: 1,
                      borderRadius: 2,
                      bgcolor: isDark ? '#1e2328' : '#e8eef3',
                      color: '#FF7700',
                      fontWeight: 600,
                      boxShadow: isDark
                        ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                        : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff',
                      '&:hover': {
                        bgcolor: isDark ? '#1e2328' : '#e8eef3',
                        boxShadow: isDark
                          ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                          : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
                      },
                      '&.Mui-disabled': {
                        color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
                      },
                    }}
                  >
                    Terugzetten naar Originele Datum
                  </Button>
                </>
              )}
            </Box>

            {/* Change Summary */}
            {isDateChanged && (
              <Alert
                severity="info"
                icon={<EventRepeatIcon />}
                sx={{
                  borderRadius: 2,
                  bgcolor: isDark ? '#1e2328' : '#e8eef3',
                  boxShadow: isDark
                    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                  border: 'none',
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Werkplek wordt verplaatst naar {formatDate(newScheduledDate)}
                </Typography>
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>

      {!showConfirmation && (
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            borderTop: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            gap: 2,
          }}
        >
          <Button
            onClick={handleClose}
            disabled={moveMutation.isPending}
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
              boxShadow: isDark
                ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33'
                : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff',
              '&:hover': {
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                  : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
              },
            }}
          >
            Annuleren
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={!isDateChanged || moveMutation.isPending}
            sx={{
              fontWeight: 700,
              px: 4,
              py: 1,
              borderRadius: 2,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              color: '#2196F3',
              boxShadow: isDark
                ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, inset 0 0 0 2px rgba(33, 150, 243, 0.3)'
                : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, inset 0 0 0 2px rgba(33, 150, 243, 0.2)',
              '&:hover': {
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33, inset 0 0 0 2px rgba(33, 150, 243, 0.5)'
                  : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff, inset 0 0 0 2px rgba(33, 150, 243, 0.4)',
              },
              '&.Mui-disabled': {
                color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
                boxShadow: isDark
                  ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                  : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
              },
            }}
          >
            {moveMutation.isPending ? 'Verplaatsen...' : 'Verplaatsen'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default RescheduleWorkplaceDialog;
