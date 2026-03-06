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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCreateRolloutDay, useUpdateRolloutDay } from '../../hooks/useRollout';
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

  const createMutation = useCreateRolloutDay();
  const updateMutation = useUpdateRolloutDay();

  useEffect(() => {
    if (day) {
      setDate(day.date.split('T')[0]);
      setName(day.name || '');
      setSelectedServiceIds(day.scheduledServiceIds || []);
    } else {
      setDate('');
      setName('');
      setSelectedServiceIds([]);
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
      await createMutation.mutateAsync({ sessionId, data: createData });
    }

    handleClose();
  };

  const handleClose = () => {
    setDate('');
    setName('');
    setSelectedServiceIds([]);
    onClose();
  };

  const isFormValid = date.trim();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Annuleren
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolloutDayDialog;
