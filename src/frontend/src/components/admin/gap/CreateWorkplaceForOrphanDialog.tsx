import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Box,
  Divider,
  alpha,
} from '@mui/material';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreatePhysicalWorkplace,
  useUpdateOccupant,
  workplaceGapAnalysisKeys,
} from '../../../hooks/usePhysicalWorkplaces';
import { useBuildings } from '../../../hooks/useBuildings';
import { useServices } from '../../../hooks/useServices';
import {
  OrphanDeviceOwner,
  WorkplaceType,
  WorkplaceTypeLabels,
} from '../../../types/physicalWorkplace.types';

/**
 * Derive a suggested workplace code from the owner's name / email.
 * Strategy: WP-{email-localpart} normalised to uppercase alphanumerics and hyphens.
 * This is unique per orphan (email is unique) and readable.
 */
function suggestCode(orphan: OrphanDeviceOwner): string {
  const local = orphan.ownerEmail.split('@')[0] ?? 'unknown';
  const normalised = local
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);
  return `WP-${normalised.toUpperCase()}`;
}

function suggestName(orphan: OrphanDeviceOwner): string {
  if (orphan.ownerName) return `Werkplek ${orphan.ownerName}`;
  return `Werkplek ${orphan.ownerEmail.split('@')[0]}`;
}

interface CreateWorkplaceForOrphanDialogProps {
  orphan: OrphanDeviceOwner | null;
  open: boolean;
  defaultBuildingId: number | null;
  onDefaultBuildingChange: (id: number) => void;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateWorkplaceForOrphanDialog = ({
  orphan,
  open,
  defaultBuildingId,
  onDefaultBuildingChange,
  onClose,
  onSuccess,
}: CreateWorkplaceForOrphanDialogProps) => {
  const queryClient = useQueryClient();
  const { data: buildings = [] } = useBuildings();
  const { data: services = [] } = useServices();
  const createMutation = useCreatePhysicalWorkplace();
  const updateOccupantMutation = useUpdateOccupant();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [buildingId, setBuildingId] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [type, setType] = useState<WorkplaceType>(WorkplaceType.Laptop);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form when orphan changes
  useEffect(() => {
    if (orphan && open) {
      setCode(suggestCode(orphan));
      setName(suggestName(orphan));
      setServiceId(orphan.serviceId ? String(orphan.serviceId) : '');
      setType(orphan.deviceType === 'desktop' ? WorkplaceType.Desktop : WorkplaceType.Laptop);
      setErrorMsg(null);
      // Restore last-used building if available
      if (defaultBuildingId) {
        setBuildingId(String(defaultBuildingId));
      } else {
        setBuildingId('');
      }
    }
  }, [orphan, open, defaultBuildingId]);

  const handleSubmit = async () => {
    if (!orphan) return;
    if (!buildingId) {
      setErrorMsg('Selecteer een gebouw.');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Geef een werkplek-code in.');
      return;
    }

    setErrorMsg(null);
    let createdId: number | undefined;
    try {
      const created = await createMutation.mutateAsync({
        code: code.trim(),
        name: name.trim(),
        buildingId: Number(buildingId),
        serviceId: serviceId ? Number(serviceId) : undefined,
        type,
        monitorCount: type === WorkplaceType.Desktop ? 2 : 1,
        hasDockingStation: type === WorkplaceType.Laptop || type === WorkplaceType.Desktop,
      });
      createdId = created.id;

      // Persist the building choice for the next row
      onDefaultBuildingChange(Number(buildingId));

      try {
        // Set occupant on the freshly created workplace
        await updateOccupantMutation.mutateAsync({
          id: created.id,
          data: {
            occupantEmail: orphan.ownerEmail,
            occupantName: orphan.ownerName ?? undefined,
          },
        });
      } catch {
        // Workplace exists but occupant link failed — let the user know they can fix it manually
        setErrorMsg(
          `Werkplek aangemaakt (${code.trim()}) maar bewoner instellen mislukt. ` +
            `Open de werkplek in het overzicht om de bewoner handmatig te koppelen.`
        );
        queryClient.invalidateQueries({ queryKey: workplaceGapAnalysisKeys.all });
        return;
      }

      // Both steps succeeded — invalidate gap analysis so the row disappears
      queryClient.invalidateQueries({ queryKey: workplaceGapAnalysisKeys.all });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const base =
        err instanceof Error ? err.message : 'Onbekende fout.';
      const hint = createdId === undefined ? ' Controleer of de code al bestaat.' : '';
      setErrorMsg(base + hint);
    }
  };

  const isPending = createMutation.isPending || updateOccupantMutation.isPending;

  if (!orphan) return null;

  const isDesktop = orphan.deviceType === 'desktop';

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: alpha('#009688', 0.1),
            }}
          >
            <AddBusinessIcon sx={{ color: '#009688', fontSize: '1.1rem' }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              Werkplek aanmaken
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {orphan.ownerName ?? orphan.ownerEmail}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {/* Orphan context row */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
          {isDesktop ? (
            <DesktopWindowsIcon fontSize="small" sx={{ color: '#009688' }} />
          ) : (
            <LaptopIcon fontSize="small" sx={{ color: '#009688' }} />
          )}
          <Typography
            variant="body2"
            fontFamily="monospace"
            sx={{ color: '#009688', fontWeight: 600, fontSize: '0.8rem' }}
          >
            {orphan.deviceAssetCode}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            {orphan.deviceBrand} {orphan.deviceModel}
          </Typography>
          {orphan.serviceName && (
            <Chip label={orphan.serviceName} size="small" sx={{ height: 20, fontSize: '0.68rem' }} />
          )}
        </Stack>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              fullWidth
              size="small"
              required
              inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
              helperText="Unieke identifier, automatisch gegenereerd"
            />
            <TextField
              select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as WorkplaceType)}
              fullWidth
              size="small"
            >
              {[WorkplaceType.Laptop, WorkplaceType.Desktop, WorkplaceType.HotDesk].map((t) => (
                <MenuItem key={t} value={t}>
                  {WorkplaceTypeLabels[t]}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            label="Naam"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            required
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Gebouw"
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              fullWidth
              size="small"
              required
              error={!buildingId && !!errorMsg}
              helperText="Wordt onthouden voor volgende rijen"
            >
              <MenuItem value="">
                <em>Selecteer gebouw</em>
              </MenuItem>
              {buildings.map((b) => (
                <MenuItem key={b.id} value={String(b.id)}>
                  {b.code} – {b.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Dienst"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              fullWidth
              size="small"
              helperText="Optioneel, vooringevuld"
            >
              <MenuItem value="">
                <em>Geen</em>
              </MenuItem>
              {services.map((s) => (
                <MenuItem key={s.id} value={String(s.id)}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2, pt: 1 }}>
        <Button onClick={onClose} disabled={isPending} color="inherit" size="small">
          Annuleren
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isPending || !buildingId || !code.trim()}
          startIcon={
            isPending ? <CircularProgress size={14} color="inherit" /> : <AddBusinessIcon />
          }
          size="small"
          sx={{
            bgcolor: '#009688',
            '&:hover': { bgcolor: '#00796b' },
            '&.Mui-disabled': { opacity: 0.6 },
          }}
        >
          {isPending ? 'Aanmaken...' : 'Werkplek aanmaken'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateWorkplaceForOrphanDialog;
