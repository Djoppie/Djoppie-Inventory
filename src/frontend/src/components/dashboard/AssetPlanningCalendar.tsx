/**
 * AssetPlanningCalendar Component
 * Interactive calendar for on/offboarding planning with asset availability
 * Shows daily asset availability and allows creating new requests
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  format,
  addDays,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  CheckCircle,
  Warning,
  PersonAdd,
  PersonRemove,
  Close,
  Inventory2,
  CalendarToday,
} from '@mui/icons-material';
import { getNeumorphColors, getNeumorph } from '../../utils/neumorphicStyles';
import { useAssets } from '../../hooks/useAssets';
import { useRolloutSessions } from '../../hooks/rollout/useRolloutSessions';

interface DayData {
  date: Date;
  onboardingCount: number;
  offboardingCount: number;
  availableStock: number;
  isWeekend: boolean;
}

interface AssetRequestDialogProps {
  open: boolean;
  selectedDate: Date | null;
  availableStock: number;
  onClose: () => void;
}

const AssetRequestDialog = ({ open, selectedDate, availableStock, onClose }: AssetRequestDialogProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const [requestType, setRequestType] = useState<'onboarding' | 'offboarding'>('onboarding');
  const [employeeName, setEmployeeName] = useState('');
  const [assetType, setAssetType] = useState('laptop');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    // TODO: Implement actual API call to create asset request
    console.log('Creating request:', {
      date: selectedDate,
      type: requestType,
      employee: employeeName,
      assetType,
      notes,
    });
    handleClose();
  };

  const handleClose = () => {
    setEmployeeName('');
    setAssetType('laptop');
    setNotes('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'strong'),
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday sx={{ color: '#FF7700', fontSize: 24 }} />
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Nieuwe Asset Aanvraag
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: nl }) : ''}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Stock Availability Alert */}
        <Alert
          severity={availableStock > 5 ? 'success' : availableStock > 0 ? 'warning' : 'error'}
          sx={{ mb: 2 }}
          icon={<Inventory2 />}
        >
          <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {availableStock > 5
              ? `${availableStock} toestellen beschikbaar in stock`
              : availableStock > 0
              ? `Beperkte voorraad: ${availableStock} toestellen beschikbaar`
              : 'Geen toestellen beschikbaar - Aanvraag wordt op wachtlijst geplaatst'}
          </Typography>
        </Alert>

        {/* Request Type Selection */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            fullWidth
            variant={requestType === 'onboarding' ? 'contained' : 'outlined'}
            startIcon={<PersonAdd />}
            onClick={() => setRequestType('onboarding')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              ...(requestType === 'onboarding' && {
                bgcolor: '#10B981',
                '&:hover': { bgcolor: '#059669' },
              }),
            }}
          >
            Onboarding
          </Button>
          <Button
            fullWidth
            variant={requestType === 'offboarding' ? 'contained' : 'outlined'}
            startIcon={<PersonRemove />}
            onClick={() => setRequestType('offboarding')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              ...(requestType === 'offboarding' && {
                bgcolor: '#EF4444',
                '&:hover': { bgcolor: '#DC2626' },
              }),
            }}
          >
            Offboarding
          </Button>
        </Box>

        {/* Employee Name */}
        <TextField
          fullWidth
          label="Medewerker Naam"
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}
          sx={{ mb: 2 }}
          size="small"
        />

        {/* Asset Type */}
        <FormControl fullWidth sx={{ mb: 2 }} size="small">
          <InputLabel>Asset Type</InputLabel>
          <Select value={assetType} onChange={(e) => setAssetType(e.target.value)} label="Asset Type">
            <MenuItem value="laptop">Laptop</MenuItem>
            <MenuItem value="desktop">Desktop</MenuItem>
            <MenuItem value="monitor">Monitor</MenuItem>
            <MenuItem value="docking">Docking Station</MenuItem>
            <MenuItem value="keyboard">Toetsenbord</MenuItem>
            <MenuItem value="mouse">Muis</MenuItem>
          </Select>
        </FormControl>

        {/* Notes */}
        <TextField
          fullWidth
          label="Opmerkingen"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={3}
          size="small"
          placeholder="Extra informatie of specifieke wensen..."
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
          Annuleren
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!employeeName.trim()}
          sx={{
            bgcolor: '#FF7700',
            '&:hover': { bgcolor: '#E06600' },
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Aanvraag Indienen
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const AssetPlanningCalendar = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: assets } = useAssets();
  const { data: sessions } = useRolloutSessions();

  // Calculate stock availability
  const stockAssets = useMemo(() => {
    if (!assets) return 0;
    return assets.filter((a) => a.status === 'Stock').length;
  }, [assets]);

  // Get all rollout days from sessions
  const allRolloutDays = useMemo(() => {
    if (!sessions) return [];
    const days: any[] = [];
    sessions.forEach((session) => {
      if (session.days) {
        session.days.forEach((day) => {
          days.push({
            ...day,
            sessionName: session.sessionName,
            sessionId: session.id,
          });
        });
      }
    });
    return days;
  }, [sessions]);

  // Calculate 14 days of planning data
  const calendarDays = useMemo((): DayData[] => {
    const days: DayData[] = [];
    const today = startOfDay(new Date());

    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Count rollouts scheduled for this day
      const dayRollouts = allRolloutDays.filter((rd) => isSameDay(new Date(rd.scheduledDate), date));
      const onboardingCount = dayRollouts.reduce((sum, r) => sum + (r.workplaces?.length || 0), 0);

      // Mock offboarding count (TODO: Get from actual API)
      const offboardingCount = Math.floor(Math.random() * 3);

      // Calculate remaining stock after planned allocations
      const totalPlanned = onboardingCount + offboardingCount;
      const availableStock = Math.max(0, stockAssets - totalPlanned);

      days.push({
        date,
        onboardingCount,
        offboardingCount,
        availableStock,
        isWeekend,
      });
    }

    return days;
  }, [allRolloutDays, stockAssets]);

  const handleDayClick = (day: DayData) => {
    if (!isBefore(day.date, startOfDay(new Date()))) {
      setSelectedDate(day.date);
      setDialogOpen(true);
    }
  };

  const getDayStatusColor = (day: DayData): string => {
    if (day.availableStock === 0) return '#EF4444'; // Red - no stock
    if (day.availableStock < 5) return '#F59E0B'; // Orange - low stock
    return '#10B981'; // Green - good stock
  };

  return (
    <>
      <Paper
        sx={{
          p: 1.5,
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          borderRadius: 2,
          border: `2px solid ${alpha('#FF7700', 0.2)}`,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday sx={{ fontSize: 22, color: '#FF7700' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.2 }}>
                Asset Planning Kalender
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                On/Offboarding planning • 14 dagen overzicht
              </Typography>
            </Box>
          </Box>

          {/* Stock Indicator */}
          <Chip
            icon={<Inventory2 sx={{ fontSize: 16 }} />}
            label={`${stockAssets} in stock`}
            size="small"
            sx={{
              bgcolor: alpha('#10B981', 0.15),
              color: '#10B981',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonAdd sx={{ fontSize: 14, color: '#10B981' }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              Onboarding
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonRemove sx={{ fontSize: 14, color: '#EF4444' }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              Offboarding
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle sx={{ fontSize: 14, color: '#10B981' }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              Beschikbaar
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Warning sx={{ fontSize: 14, color: '#F59E0B' }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              Beperkt
            </Typography>
          </Box>
        </Box>

        {/* Calendar Grid - 7 days per row (2 weeks) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75 }}>
          {calendarDays.map((day, idx) => {
            const isPast = isBefore(day.date, startOfDay(new Date()));
            const statusColor = getDayStatusColor(day);
            const hasActivity = day.onboardingCount > 0 || day.offboardingCount > 0;

            return (
              <Tooltip
                key={idx}
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 700, display: 'block' }}>
                      {format(day.date, 'EEEE d MMMM', { locale: nl })}
                    </Typography>
                    {hasActivity && (
                      <>
                        {day.onboardingCount > 0 && (
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', color: '#10B981' }}>
                            ↑ {day.onboardingCount} onboarding
                          </Typography>
                        )}
                        {day.offboardingCount > 0 && (
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', color: '#EF4444' }}>
                            ↓ {day.offboardingCount} offboarding
                          </Typography>
                        )}
                      </>
                    )}
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', mt: 0.5 }}>
                      {day.availableStock} toestellen beschikbaar
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <Box
                  onClick={() => !isPast && handleDayClick(day)}
                  sx={{
                    position: 'relative',
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: day.isWeekend
                      ? alpha('#9CA3AF', 0.05)
                      : isPast
                      ? alpha('#6B7280', 0.05)
                      : alpha(statusColor, 0.08),
                    border: isToday(day.date)
                      ? `2px solid #FF7700`
                      : `1px solid ${alpha(statusColor, 0.2)}`,
                    cursor: isPast ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isPast ? 0.5 : 1,
                    minHeight: 70,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': !isPast
                      ? {
                          transform: 'translateY(-2px)',
                          bgcolor: alpha(statusColor, 0.15),
                          borderColor: statusColor,
                          boxShadow: `0 4px 12px ${alpha(statusColor, 0.25)}`,
                        }
                      : {},
                  }}
                >
                  {/* Day Label */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      color: 'text.secondary',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                    }}
                  >
                    {format(day.date, 'EEE', { locale: nl })}
                  </Typography>

                  {/* Day Number */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: isToday(day.date) ? '#FF7700' : 'text.primary',
                    }}
                  >
                    {format(day.date, 'd')}
                  </Typography>

                  {/* Activity Indicators */}
                  {hasActivity && (
                    <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
                      {day.onboardingCount > 0 && (
                        <Badge
                          badgeContent={day.onboardingCount}
                          sx={{
                            '& .MuiBadge-badge': {
                              bgcolor: '#10B981',
                              fontSize: '0.6rem',
                              height: 14,
                              minWidth: 14,
                            },
                          }}
                        >
                          <PersonAdd sx={{ fontSize: 12, color: '#10B981' }} />
                        </Badge>
                      )}
                      {day.offboardingCount > 0 && (
                        <Badge
                          badgeContent={day.offboardingCount}
                          sx={{
                            '& .MuiBadge-badge': {
                              bgcolor: '#EF4444',
                              fontSize: '0.6rem',
                              height: 14,
                              minWidth: 14,
                            },
                          }}
                        >
                          <PersonRemove sx={{ fontSize: 12, color: '#EF4444' }} />
                        </Badge>
                      )}
                    </Box>
                  )}

                  {/* Stock Status Indicator */}
                  {!isPast && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 3,
                        right: 3,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: statusColor,
                        boxShadow: `0 0 6px ${alpha(statusColor, 0.6)}`,
                      }}
                    />
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Footer Info */}
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${alpha('#fff', 0.05)}` }}>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', display: 'block' }}>
            💡 Klik op een dag om een nieuwe on/offboarding aanvraag in te dienen
          </Typography>
        </Box>
      </Paper>

      {/* Asset Request Dialog */}
      <AssetRequestDialog
        open={dialogOpen}
        selectedDate={selectedDate}
        availableStock={selectedDate ? calendarDays.find((d) => isSameDay(d.date, selectedDate))?.availableStock || 0 : 0}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};

export default AssetPlanningCalendar;
