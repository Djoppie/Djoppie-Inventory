import { useState, useEffect } from 'react';
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
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCreateRolloutDay, useUpdateRolloutDay, useBulkCreateWorkplaces } from '../../hooks/useRollout';
import type { RolloutDay, CreateRolloutDay, UpdateRolloutDay } from '../../types/rollout';

interface RolloutDayDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  day?: RolloutDay;
  dayNumber?: number;
}

const MOCK_SERVICES = [
  { id: 1, name: 'IT' },
  { id: 2, name: 'HR' },
  { id: 3, name: 'Finance' },
  { id: 4, name: 'Operations' },
  { id: 5, name: 'Sales' },
];

const RolloutDayDialog = ({ open, onClose, sessionId, day, dayNumber }: RolloutDayDialogProps) => {
  const { t } = useTranslation();
  const isEditMode = Boolean(day);

  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [createBulk, setCreateBulk] = useState(true);
  const [workplaceCount, setWorkplaceCount] = useState(10);
  const [monitorCount, setMonitorCount] = useState(2);

  const createMutation = useCreateRolloutDay();
  const updateMutation = useUpdateRolloutDay();
  const bulkCreateMutation = useBulkCreateWorkplaces();

  useEffect(() => {
    if (day) {
      setDate(day.date.split('T')[0]);
      setName(day.name || '');
      setSelectedServiceIds(day.scheduledServiceIds || []);
    } else {
      setDate('');
      setName('');
      setSelectedServiceIds([]);
      setCreateBulk(true);
      setWorkplaceCount(10);
      setMonitorCount(2);
    }
  }, [day, open]);

  const handleServiceChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    setSelectedServiceIds(typeof value === 'string' ? [] : value);
  };

  const handleSave = async () => {
    if (isEditMode && day) {
      const updateData: UpdateRolloutDay = {
        date,
        name: name || undefined,
        dayNumber: day.dayNumber,
        scheduledServiceIds: selectedServiceIds,
      };
      await updateMutation.mutateAsync({ dayId: day.id, data: updateData });
    } else {
      const createData: CreateRolloutDay = {
        rolloutSessionId: sessionId,
        date,
        name: name || undefined,
        dayNumber: dayNumber || 1,
        scheduledServiceIds: selectedServiceIds,
      };
      const createdDay = await createMutation.mutateAsync({ sessionId, data: createData });

      // Bulk create workplaces if enabled
      if (createBulk && workplaceCount > 0 && selectedServiceIds.length > 0 && createdDay) {
        await bulkCreateMutation.mutateAsync({
          dayId: createdDay.id,
          data: {
            count: workplaceCount,
            serviceId: selectedServiceIds[0], // Use first selected service as primary
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
  };

  const handleClose = () => {
    setDate('');
    setName('');
    setSelectedServiceIds([]);
    setCreateBulk(true);
    setWorkplaceCount(10);
    setMonitorCount(2);
    onClose();
  };

  const isFormValid = date.trim();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableRestoreFocus>
      <DialogTitle>
        {isEditMode ? 'Dag Bewerken' : 'Nieuwe Dag Toevoegen'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Datum"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Selecteer de datum voor deze rollout dag"
          />
          <TextField
            label="Naam (optioneel)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            helperText="Bijv. 'Week 1 - Maandag' of 'IT Afdeling'"
          />
          <FormControl fullWidth>
            <InputLabel id="services-label">Geplande Diensten</InputLabel>
            <Select
              labelId="services-label"
              multiple
              value={selectedServiceIds}
              onChange={handleServiceChange}
              input={<OutlinedInput label="Geplande Diensten" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((serviceId) => {
                    const service = MOCK_SERVICES.find(s => s.id === serviceId);
                    return service ? <Chip key={serviceId} label={service.name} size="small" /> : null;
                  })}
                </Box>
              )}
            >
              {MOCK_SERVICES.map((service) => (
                <MenuItem key={service.id} value={service.id}>
                  {service.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
                  {selectedServiceIds.length === 0 && (
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Selecteer eerst een of meerdere diensten om werkplekken aan te maken
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
                    disabled={selectedServiceIds.length === 0}
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
                      disabled={selectedServiceIds.length === 0}
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
