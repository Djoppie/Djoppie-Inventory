import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
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
} from '@mui/material';
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableRestoreFocus>
      <DialogTitle>
        {isEditMode ? 'Planning Bewerken' : 'Nieuwe Planning Toevoegen'}
      </DialogTitle>
      <DialogContent>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Datum"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Selecteer de datum voor deze planning"
          />
          <FormControl fullWidth>
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
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#FF7700',
                    bgcolor: 'rgba(255, 119, 0, 0.06)',
                    borderBottom: '2px solid',
                    borderColor: 'rgba(255, 119, 0, 0.15)',
                    lineHeight: '36px',
                    mt: 0.5,
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
            helperText="Bijv. 'Week 1 - Maandag' of 'IT Afdeling'"
          />

          {!isEditMode && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={createBulk}
                    onChange={(e) => setCreateBulk(e.target.checked)}
                  />
                }
                label="Werkplekken automatisch aanmaken"
              />

              {createBulk && (
                <>
                  {!selectedServiceId && (
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Selecteer eerst een dienst om werkplekken aan te maken
                    </Alert>
                  )}

                  <TextField
                    type="number"
                    label="Aantal werkplekken"
                    value={workplaceCount}
                    onChange={(e) => setWorkplaceCount(Number(e.target.value))}
                    inputProps={{ min: 1, max: 50 }}
                    fullWidth
                    helperText="Aantal lege werkplekken om aan te maken (1-50)"
                    disabled={!selectedServiceId}
                  />

                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Monitors per werkplek: {monitorCount}
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
                    />
                  </Box>

                  <Alert severity="info">
                    Elke werkplek krijgt: 1x Laptop, 1x Docking Station, {monitorCount}x Monitor, 1x Toetsenbord, 1x Muis
                  </Alert>
                </>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Annuleren
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
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
