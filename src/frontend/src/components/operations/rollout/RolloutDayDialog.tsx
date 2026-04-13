import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  ListSubheader,
  Stack,
  useTheme,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useQuery } from '@tanstack/react-query';
import { useCreateRolloutDay, useUpdateRolloutDay } from '../../../hooks/useRollout';
import { servicesApi } from '../../../api/admin.api';
import type { Service } from '../../../types/admin.types';
import type { RolloutDay, CreateRolloutDay, UpdateRolloutDay } from '../../../types/rollout';
import { ASSET_COLOR } from '../../../constants/filterColors';

interface RolloutDayDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  day?: RolloutDay;
  dayNumber?: number;
  defaultDate?: string;
}

const RolloutDayDialog = ({ open, onClose, sessionId, day, dayNumber, defaultDate }: RolloutDayDialogProps) => {
  const isEditMode = Boolean(day);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: services } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => servicesApi.getAll(false),
    enabled: open,
  });

  const createMutation = useCreateRolloutDay();
  const updateMutation = useUpdateRolloutDay();

  // Group services by sector
  const servicesBySector = (services || []).reduce<Record<string, Service[]>>((acc, service) => {
    const sectorName = service.sector?.name || 'Overig';
    if (!acc[sectorName]) acc[sectorName] = [];
    acc[sectorName].push(service);
    return acc;
  }, {});

  // State-tracking pattern: sync form state from props during render
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const currentKey = day ? `day-${day.id}-${day.updatedAt}` : (open ? 'new' : null);

  if (open && currentKey && currentKey !== syncedKey) {
    setSyncedKey(currentKey);
    if (day) {
      setDate(day.date.split('T')[0]);
      setName(day.name || '');
      setSelectedServiceId(day.scheduledServiceIds?.[0] || '');
    } else {
      setDate(defaultDate || '');
      setName('');
      setSelectedServiceId('');
    }
  }

  if (!open && syncedKey !== null) {
    setSyncedKey(null);
  }

  const handleSave = async () => {
    setSaveError(null);
    try {
      const serviceIds = selectedServiceId ? [selectedServiceId] : [];

      if (isEditMode && day) {
        const updateData: UpdateRolloutDay = {
          date,
          name: name || undefined,
          dayNumber: day.dayNumber,
          scheduledServiceIds: serviceIds,
        };
        await updateMutation.mutateAsync({ dayId: day.id, data: updateData });
      } else {
        const createData: CreateRolloutDay = {
          rolloutSessionId: sessionId,
          date,
          name: name || undefined,
          dayNumber: dayNumber || 1,
          scheduledServiceIds: serviceIds,
        };
        await createMutation.mutateAsync({ sessionId, data: createData });
      }

      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Er is een fout opgetreden bij het opslaan';
      setSaveError(message);
    }
  };

  const handleClose = () => {
    setDate('');
    setName('');
    setSelectedServiceId('');
    setSaveError(null);
    onClose();
  };

  const isFormValid = date.trim();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* Clean header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              color: 'text.primary',
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {isEditMode ? 'Planning Bewerken' : 'Nieuwe Planning'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditMode ? 'Pas de planning aan (datum kan worden verzet)' : 'Configureer een nieuwe planning batch'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Geplande Datum"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            helperText="Selecteer de datum voor deze planning (kan later worden verzet)"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: ASSET_COLOR,
                },
                '&.Mui-focused fieldset': {
                  borderColor: ASSET_COLOR,
                },
              },
            }}
          />
          <FormControl fullWidth size="small">
            <InputLabel id="service-label">Dienst</InputLabel>
            <Select
              labelId="service-label"
              value={selectedServiceId}
              onChange={(e) => {
                const id = e.target.value as number | '';
                setSelectedServiceId(id);
                if (id) {
                  const svc = (services || []).find(s => s.id === id);
                  if (svc) {
                    const sectorLabel = svc.sector?.name ? ` (${svc.sector.name})` : '';
                    setName(`${svc.name}${sectorLabel}`);
                  }
                }
              }}
              label="Dienst"
            >
              <MenuItem value="">
                <em>Geen dienst</em>
              </MenuItem>
              {Object.entries(servicesBySector).map(([sectorName, sectorServices]) => [
                <ListSubheader
                  key={sectorName}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    lineHeight: '32px',
                  }}
                >
                  {sectorName}
                </ListSubheader>,
                ...sectorServices.map((service) => (
                  <MenuItem
                    key={service.id}
                    value={service.id}
                    sx={{ pl: 3, py: 1 }}
                  >
                    {service.name}
                  </MenuItem>
                )),
              ])}
            </Select>
          </FormControl>
          <TextField
            label="Planning Naam (optioneel)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            helperText="Bijv. 'Batch 1 - Week 12' of 'IT Afdeling Planning'"
          />

          {!isEditMode && (
            <Alert
              severity="info"
              icon={<CloudDownloadIcon />}
              sx={{
                mt: 2,
                '& .MuiAlert-icon': {
                  color: ASSET_COLOR,
                },
              }}
            >
              <Typography variant="body2">
                Na het aanmaken kun je werkplekken importeren uit <strong>Azure AD</strong> of handmatig toevoegen.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose} size="small">
          Annuleren
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          size="small"
          disabled={
            !isFormValid ||
            createMutation.isPending ||
            updateMutation.isPending
          }
        >
          {createMutation.isPending || updateMutation.isPending
            ? 'Opslaan...'
            : 'Opslaan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolloutDayDialog;
