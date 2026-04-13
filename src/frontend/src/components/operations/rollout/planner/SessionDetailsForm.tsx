import { Box, TextField, Button, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import type { FormState } from '../../../../hooks/rollout-planner';

interface SessionDetailsFormProps {
  form: FormState;
  isEditMode: boolean;
  isFormValid: boolean;
  isPending: boolean;
  onSessionNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPlannedStartDateChange: (value: string) => void;
  onPlannedEndDateChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function SessionDetailsForm({
  form,
  isEditMode,
  isFormValid,
  isPending,
  onSessionNameChange,
  onDescriptionChange,
  onPlannedStartDateChange,
  onPlannedEndDateChange,
  onSave,
  onCancel,
}: SessionDetailsFormProps) {
  return (
    <Accordion defaultExpanded={!isEditMode} sx={{ mb: 3 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">
          Sessie Details
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Sessienaam"
            value={form.sessionName}
            onChange={(e) => onSessionNameChange(e.target.value)}
            required
            fullWidth
            helperText="Geef een duidelijke naam voor deze rollout sessie"
          />
          <TextField
            label="Beschrijving"
            value={form.description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            multiline
            rows={3}
            fullWidth
            helperText="Optionele beschrijving van de rollout"
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Geplande Startdatum"
              type="date"
              value={form.plannedStartDate}
              onChange={(e) => onPlannedStartDateChange(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Geplande Einddatum"
              type="date"
              value={form.plannedEndDate}
              onChange={(e) => onPlannedEndDateChange(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Optioneel"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button onClick={onCancel}>
            Annuleren
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={!isFormValid || isPending}
          >
            {isPending ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
