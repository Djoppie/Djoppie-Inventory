import { useState, useRef } from 'react';
import {
  TextField,
  MenuItem,
  Button,
  Stack,
  Paper,
  Typography,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useCreatePhysicalWorkplace } from '../../../hooks/usePhysicalWorkplaces';
import { useBuildings } from '../../../hooks/useBuildings';
import { useServices } from '../../../hooks/useServices';
import { WorkplaceType } from '../../../types/physicalWorkplace.types';

interface WorkplacesQuickAddRowProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * Compact inline quick-add form for creating workplaces without opening a dialog.
 * Covers the most common fields: code, name, building, service. Submits on Enter.
 */
const WorkplacesQuickAddRow = ({ onSuccess, onError }: WorkplacesQuickAddRowProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [errors, setErrors] = useState<{ code?: string; name?: string; buildingId?: string }>({});

  const createMutation = useCreatePhysicalWorkplace();
  const { data: buildings = [] } = useBuildings();
  const { data: services = [] } = useServices();

  const nameRef = useRef<HTMLInputElement>(null);
  const buildingRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const e: typeof errors = {};
    if (!code.trim()) e.code = 'Verplicht';
    if (!name.trim()) e.name = 'Verplicht';
    if (!buildingId) e.buildingId = 'Verplicht';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await createMutation.mutateAsync({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        buildingId: Number(buildingId),
        serviceId: serviceId ? Number(serviceId) : undefined,
        type: WorkplaceType.Laptop,
      });
      onSuccess(`Werkplek ${code.toUpperCase()} aangemaakt`);
      setCode('');
      setName('');
      setBuildingId('');
      setServiceId('');
      setErrors({});
    } catch {
      onError('Fout bij aanmaken werkplek');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      fontSize: '0.8rem',
      height: 34,
      bgcolor: isDark ? alpha('#fff', 0.04) : '#fff',
      '& fieldset': { borderColor: alpha('#009688', 0.25) },
      '&:hover fieldset': { borderColor: alpha('#009688', 0.5) },
      '&.Mui-focused fieldset': { borderColor: '#009688' },
    },
    '& .MuiInputLabel-root': { fontSize: '0.75rem' },
    '& .MuiFormHelperText-root': { fontSize: '0.65rem', mx: 0 },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 1.5,
        borderRadius: 2,
        border: '1px dashed',
        borderColor: alpha('#009688', 0.35),
        bgcolor: isDark ? alpha('#009688', 0.04) : alpha('#009688', 0.02),
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: '#009688', display: 'block', mb: 1, fontSize: '0.7rem' }}
      >
        Snel toevoegen
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems="flex-start"
      >
        {/* Code */}
        <TextField
          label="Code *"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (errors.code) setErrors((p) => ({ ...p, code: undefined }));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && nameRef.current) nameRef.current.focus();
          }}
          error={!!errors.code}
          helperText={errors.code}
          size="small"
          inputProps={{ style: { textTransform: 'uppercase' } }}
          sx={{ ...inputSx, width: { xs: '100%', sm: 120 } }}
        />

        {/* Name */}
        <TextField
          inputRef={nameRef}
          label="Naam *"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && buildingRef.current) buildingRef.current.focus();
          }}
          error={!!errors.name}
          helperText={errors.name}
          size="small"
          sx={{ ...inputSx, flex: 1, minWidth: 140 }}
        />

        {/* Building */}
        <TextField
          inputRef={buildingRef}
          select
          label="Gebouw *"
          value={buildingId}
          onChange={(e) => {
            setBuildingId(e.target.value);
            if (errors.buildingId) setErrors((p) => ({ ...p, buildingId: undefined }));
          }}
          onKeyDown={handleKeyDown}
          error={!!errors.buildingId}
          helperText={errors.buildingId}
          size="small"
          sx={{ ...inputSx, width: { xs: '100%', sm: 150 } }}
          SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 200 } } } }}
        >
          <MenuItem value="">
            <em>Selecteer</em>
          </MenuItem>
          {buildings.map((b) => (
            <MenuItem key={b.id} value={String(b.id)} sx={{ fontSize: '0.8rem' }}>
              {b.code} - {b.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Service (optional) */}
        <TextField
          select
          label="Dienst"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          sx={{ ...inputSx, width: { xs: '100%', sm: 150 } }}
          SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 200 } } } }}
        >
          <MenuItem value="">
            <em>Geen</em>
          </MenuItem>
          {services.map((s) => (
            <MenuItem key={s.id} value={String(s.id)} sx={{ fontSize: '0.8rem' }}>
              {s.code} - {s.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Submit */}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          startIcon={
            createMutation.isPending ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <AddIcon sx={{ fontSize: 18 }} />
            )
          }
          onKeyDown={handleKeyDown}
          sx={{
            bgcolor: '#009688',
            height: 34,
            alignSelf: 'flex-start',
            mt: errors.code || errors.name || errors.buildingId ? 0 : 0,
            fontWeight: 700,
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            px: 2,
            '&:hover': { bgcolor: '#00796b' },
          }}
        >
          Aanmaken
        </Button>
      </Stack>
    </Paper>
  );
};

export default WorkplacesQuickAddRow;
