import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Chip,
  Alert,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { PhysicalWorkplace, WorkplaceType, WorkplaceTypeLabels } from '../../../types/physicalWorkplace.types';
import { useBulkUpdateWorkplaces } from '../../../hooks/usePhysicalWorkplaces';
import { useBuildings } from '../../../hooks/useBuildings';
import { useServices } from '../../../hooks/useServices';

interface BulkEditWorkplacesDialogProps {
  open: boolean;
  onClose: () => void;
  selectedWorkplaces: PhysicalWorkplace[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// Sentinel value for "keep existing / do not change"
const NO_CHANGE = '__no_change__';

interface PatchForm {
  buildingId: string;
  serviceId: string;
  type: string;
  isActive: string; // 'true' | 'false' | NO_CHANGE
  floor: string;
}

const initialForm: PatchForm = {
  buildingId: NO_CHANGE,
  serviceId: NO_CHANGE,
  type: NO_CHANGE,
  isActive: NO_CHANGE,
  floor: NO_CHANGE,
};

const BulkEditWorkplacesDialog = ({
  open,
  onClose,
  selectedWorkplaces,
  onSuccess,
  onError,
}: BulkEditWorkplacesDialogProps) => {
  const [form, setForm] = useState<PatchForm>(initialForm);
  const [floorInputEnabled, setFloorInputEnabled] = useState(false);

  const bulkUpdateMutation = useBulkUpdateWorkplaces();
  const { data: buildings = [] } = useBuildings();
  const { data: services = [] } = useServices();

  const handleClose = () => {
    setForm(initialForm);
    setFloorInputEnabled(false);
    onClose();
  };

  const changesCount = [
    form.buildingId !== NO_CHANGE,
    form.serviceId !== NO_CHANGE,
    form.type !== NO_CHANGE,
    form.isActive !== NO_CHANGE,
    floorInputEnabled,
  ].filter(Boolean).length;

  const handleSubmit = async () => {
    if (changesCount === 0) {
      onError('Selecteer minstens 1 veld om te wijzigen');
      return;
    }

    const dto: Parameters<typeof bulkUpdateMutation.mutateAsync>[0] = {
      ids: selectedWorkplaces.map((w) => w.id),
    };

    if (form.buildingId !== NO_CHANGE) dto.buildingId = Number(form.buildingId);
    if (form.serviceId !== NO_CHANGE) dto.serviceId = Number(form.serviceId);
    if (form.type !== NO_CHANGE) dto.type = form.type;
    if (form.isActive !== NO_CHANGE) dto.isActive = form.isActive === 'true';
    if (floorInputEnabled) dto.floor = form.floor;

    try {
      const result = await bulkUpdateMutation.mutateAsync(dto);
      const msg =
        result.errors.length > 0
          ? `${result.updated} werkplekken bijgewerkt, ${result.skipped} overgeslagen`
          : `${result.updated} werkplekken bijgewerkt`;
      onSuccess(msg);
      handleClose();
    } catch {
      onError('Fout bij bulk bewerken');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          border: '2px solid',
          borderColor: '#009688',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.1)' : 'rgba(0, 150, 136, 0.05)',
          color: '#009688',
          fontWeight: 700,
          borderBottom: '1px solid',
          borderColor: 'rgba(0, 150, 136, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <EditIcon />
        Werkplekken Bulk Bewerken
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* Summary chips */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
          <Chip
            label={`${selectedWorkplaces.length} werkplekken geselecteerd`}
            size="small"
            sx={{
              bgcolor: 'rgba(0, 150, 136, 0.12)',
              color: '#009688',
              fontWeight: 700,
              border: '1px solid rgba(0, 150, 136, 0.3)',
            }}
          />
          {changesCount > 0 && (
            <Chip
              label={`${changesCount} veld${changesCount === 1 ? '' : 'en'} te wijzigen`}
              size="small"
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>

        <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
          Lege velden (Geen wijziging) worden niet aangepast. Vul alleen de velden in die je wil wijzigen.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Building */}
          <TextField
            select
            label="Gebouw"
            value={form.buildingId}
            onChange={(e) => setForm((p) => ({ ...p, buildingId: e.target.value }))}
            fullWidth
            size="small"
          >
            <MenuItem value={NO_CHANGE}>
              <em>Geen wijziging</em>
            </MenuItem>
            {buildings.map((b) => (
              <MenuItem key={b.id} value={String(b.id)}>
                {b.code} - {b.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Service */}
          <TextField
            select
            label="Dienst"
            value={form.serviceId}
            onChange={(e) => setForm((p) => ({ ...p, serviceId: e.target.value }))}
            fullWidth
            size="small"
          >
            <MenuItem value={NO_CHANGE}>
              <em>Geen wijziging</em>
            </MenuItem>
            {services.map((s) => (
              <MenuItem key={s.id} value={String(s.id)}>
                {s.code} - {s.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Type */}
          <TextField
            select
            label="Type"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            fullWidth
            size="small"
          >
            <MenuItem value={NO_CHANGE}>
              <em>Geen wijziging</em>
            </MenuItem>
            {Object.entries(WorkplaceTypeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value as WorkplaceType}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          {/* Status (active/inactive) */}
          <TextField
            select
            label="Status"
            value={form.isActive}
            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value }))}
            fullWidth
            size="small"
          >
            <MenuItem value={NO_CHANGE}>
              <em>Geen wijziging</em>
            </MenuItem>
            <MenuItem value="true">Actief</MenuItem>
            <MenuItem value="false">Inactief</MenuItem>
          </TextField>

          {/* Floor — only enabled when user opts in */}
          <Divider />
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={floorInputEnabled}
                  onChange={(e) => {
                    setFloorInputEnabled(e.target.checked);
                    if (!e.target.checked) setForm((p) => ({ ...p, floor: NO_CHANGE }));
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={
                <Typography variant="body2" fontWeight={600}>
                  Verdieping wijzigen
                </Typography>
              }
            />
            {floorInputEnabled && (
              <TextField
                label="Verdieping"
                value={form.floor === NO_CHANGE ? '' : form.floor}
                onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))}
                helperText="Laat leeg om verdieping te wissen"
                fullWidth
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Box>

        {/* Preview */}
        {selectedWorkplaces.length > 0 && selectedWorkplaces.length <= 5 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Geselecteerde werkplekken:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
              {selectedWorkplaces.map((w) => (
                <Chip
                  key={w.id}
                  label={`${w.code} - ${w.name}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              ))}
            </Stack>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button onClick={handleClose} color="inherit">
          Annuleren
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={bulkUpdateMutation.isPending || changesCount === 0}
          sx={{
            bgcolor: '#009688',
            '&:hover': { bgcolor: '#00796b' },
          }}
        >
          {bulkUpdateMutation.isPending
            ? 'Opslaan...'
            : `Wijzig ${selectedWorkplaces.length} werkplekken`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkEditWorkplacesDialog;
