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
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  Alert,
  ListSubheader,
  Stack,
  useTheme,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useQuery } from '@tanstack/react-query';
import { useCreateRolloutDay, useUpdateRolloutDay, useBulkCreateWorkplaces } from '../../hooks/useRollout';
import { servicesApi } from '../../api/admin.api';
import type { Service } from '../../types/admin.types';
import type { RolloutDay, CreateRolloutDay, UpdateRolloutDay } from '../../types/rollout';

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
  const [createBulk, setCreateBulk] = useState(true);
  const [workplaceCount, setWorkplaceCount] = useState(10);
  const [monitorCount, setMonitorCount] = useState(2);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: services } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => servicesApi.getAll(false),
    enabled: open,
  });

  const createMutation = useCreateRolloutDay();
  const updateMutation = useUpdateRolloutDay();
  const bulkCreateMutation = useBulkCreateWorkplaces();

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
      setCreateBulk(true);
      setWorkplaceCount(10);
      setMonitorCount(2);
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
        const createdDay = await createMutation.mutateAsync({ sessionId, data: createData });

        // Bulk create workplaces if enabled
        if (createBulk && workplaceCount > 0 && selectedServiceId && createdDay) {
          await bulkCreateMutation.mutateAsync({
            dayId: createdDay.id,
            data: {
              count: workplaceCount,
              serviceId: selectedServiceId,
              isLaptopSetup: true,
              assetPlanConfig: {
                includeLaptop: true,
                includeDesktop: false,
                includeDocking: true,
                monitorCount,
                includeKeyboard: true,
                includeMouse: true,
              },
            },
          });
        }
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
    setCreateBulk(true);
    setWorkplaceCount(10);
    setMonitorCount(2);
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
              {isEditMode ? 'Pas de planning aan' : 'Configureer een nieuwe planning'}
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
            label="Datum"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            helperText="Selecteer de datum voor deze planning"
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
            label="Naam (optioneel)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            helperText="Bijv. 'Week 1 - Maandag' of 'IT Afdeling'"
          />

          {!isEditMode && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                pt: 2,
                mt: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={createBulk}
                    onChange={(e) => setCreateBulk(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    Werkplekken automatisch aanmaken
                  </Typography>
                }
              />

              {createBulk && (
                <>
                  {!selectedServiceId && (
                    <Alert severity="info" sx={{ py: 0.5 }}>
                      <Typography variant="body2">
                        Selecteer eerst een dienst om werkplekken aan te maken
                      </Typography>
                    </Alert>
                  )}

                  <TextField
                    type="number"
                    label="Aantal werkplekken"
                    value={workplaceCount}
                    onChange={(e) => setWorkplaceCount(Number(e.target.value))}
                    inputProps={{ min: 1, max: 50 }}
                    fullWidth
                    size="small"
                    helperText="Aantal lege werkplekken om aan te maken (1-50)"
                    disabled={!selectedServiceId}
                  />

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Monitors per werkplek: <strong>{monitorCount}</strong>
                    </Typography>
                    <Slider
                      value={monitorCount}
                      min={1}
                      max={3}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 2, label: '2' },
                        { value: 3, label: '3' },
                      ]}
                      step={1}
                      valueLabelDisplay="auto"
                      onChange={(_, value) => setMonitorCount(value as number)}
                      disabled={!selectedServiceId}
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  <Alert severity="info" sx={{ py: 0.5 }}>
                    <Typography variant="body2">
                      Elke werkplek krijgt: 1x Laptop, 1x Docking Station, {monitorCount}x Monitor, 1x Toetsenbord, 1x Muis
                    </Typography>
                  </Alert>
                </>
              )}
            </Box>
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
            updateMutation.isPending ||
            bulkCreateMutation.isPending
          }
        >
          {createMutation.isPending || updateMutation.isPending || bulkCreateMutation.isPending
            ? 'Opslaan...'
            : 'Opslaan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolloutDayDialog;
