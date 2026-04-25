import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  TextField,
  Divider,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { Asset } from '../../../types/asset.types';
import PhysicalWorkplaceSelect from '../../common/PhysicalWorkplaceSelect';
import { useAssignAssetToWorkplace } from '../../../hooks/useAssets';
import { getNeumorph, getNeumorphColors } from '../../../utils/neumorphicStyles';
import { WORKPLACE_COLOR } from '../../../constants/filterColors';

interface AssignWorkplaceDialogProps {
  open: boolean;
  onClose: () => void;
  asset: Asset;
}

const AssignWorkplaceDialog = ({ open, onClose, asset }: AssignWorkplaceDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const [workplaceId, setWorkplaceId] = useState<number | null>(null);
  const [installationDate, setInstallationDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [installationLocation, setInstallationLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const assignMutation = useAssignAssetToWorkplace();

  const handleClose = () => {
    if (assignMutation.isPending) return;
    setWorkplaceId(null);
    setInstallationDate(new Date().toISOString().split('T')[0]);
    setInstallationLocation('');
    setNotes('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!workplaceId) {
      setError(t('assetDetail.assignment.workplaceRequired', 'Selecteer een werkplek.'));
      return;
    }
    setError(null);
    try {
      await assignMutation.mutateAsync({
        assetId: asset.id,
        data: {
          physicalWorkplaceId: workplaceId,
          installationDate: installationDate || undefined,
          installationLocation: installationLocation || undefined,
          notes: notes || undefined,
        },
      });
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('assetDetail.assignment.assignFailed', 'Toewijzing mislukt. Probeer het opnieuw.');
      setError(message);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'strong'),
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(WORKPLACE_COLOR, 0.1),
            border: `1px solid ${alpha(WORKPLACE_COLOR, 0.2)}`,
            flexShrink: 0,
          }}
        >
          <PlaceIcon sx={{ fontSize: 20, color: WORKPLACE_COLOR }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            {t('assetDetail.assignment.assignToWorkplace', 'Toewijzen aan werkplek')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {asset.assetCode} — {asset.assetName}
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={handleClose}
          disabled={assignMutation.isPending}
          sx={{ minWidth: 'auto', p: 0.5, color: 'text.secondary' }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Workplace picker */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
              {t('assetDetail.assignment.workplace', 'Werkplek')} *
            </Typography>
            <PhysicalWorkplaceSelect
              value={workplaceId}
              onChange={(id) => {
                setWorkplaceId(id);
                setError(null);
              }}
              label={t('assetDetail.assignment.selectWorkplace', 'Selecteer werkplek')}
            />
          </Box>

          <Divider />

          {/* Installation date */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
              {t('assetDetail.assignment.installationDate', 'Installatiedatum')} ({t('common.optional', 'optioneel')})
            </Typography>
            <TextField
              type="date"
              size="small"
              fullWidth
              value={installationDate}
              onChange={(e) => setInstallationDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Location detail */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
              {t('assetDetail.assignment.installationLocation', 'Locatiedetail')} ({t('common.optional', 'optioneel')})
            </Typography>
            <TextField
              size="small"
              fullWidth
              value={installationLocation}
              onChange={(e) => setInstallationLocation(e.target.value)}
              placeholder={t('assetDetail.assignment.locationPlaceholder', 'Bijv. Bureau 3, rack B2...')}
            />
          </Box>

          {/* Notes */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
              {t('assetDetail.assignment.notes', 'Notities')} ({t('common.optional', 'optioneel')})
            </Typography>
            <TextField
              multiline
              rows={2}
              size="small"
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('assetDetail.assignment.notesPlaceholder', 'Bijv. tijdelijke toewijzing tijdens renovatie...')}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose} disabled={assignMutation.isPending} color="inherit">
          {t('common.cancel', 'Annuleren')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!workplaceId || assignMutation.isPending}
          startIcon={assignMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <PlaceIcon />}
          sx={{
            bgcolor: WORKPLACE_COLOR,
            color: '#fff',
            fontWeight: 600,
            borderRadius: 2,
            '&:hover': { bgcolor: alpha(WORKPLACE_COLOR, 0.85) },
            '&.Mui-disabled': { bgcolor: alpha(WORKPLACE_COLOR, 0.3), color: '#fff' },
          }}
        >
          {assignMutation.isPending
            ? t('common.saving', 'Opslaan...')
            : t('assetDetail.assignment.confirmAssign', 'Toewijzen')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignWorkplaceDialog;
