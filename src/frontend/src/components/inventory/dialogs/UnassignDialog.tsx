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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { Asset, AssetStatus } from '../../../types/asset.types';
import { useUnassignAsset } from '../../../hooks/useAssets';
import { getNeumorph, getNeumorphColors } from '../../../utils/neumorphicStyles';
import { STATUS_LABELS } from '../../../utils/assetStateMachine';

interface UnassignDialogProps {
  open: boolean;
  onClose: () => void;
  asset: Asset;
}

/** Statuses that make sense as the target when unassigning. */
const UNASSIGN_TARGET_STATUSES: AssetStatus[] = [
  AssetStatus.Stock,
  AssetStatus.Herstelling,
  AssetStatus.Defect,
  AssetStatus.UitDienst,
];

const UnassignDialog = ({ open, onClose, asset }: UnassignDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const [targetStatus, setTargetStatus] = useState<AssetStatus>(AssetStatus.Stock);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const unassignMutation = useUnassignAsset();

  const handleClose = () => {
    if (unassignMutation.isPending) return;
    setTargetStatus(AssetStatus.Stock);
    setReason('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError(t('assetDetail.assignment.reasonRequired', 'Geef een reden op voor de uittoewijzing.'));
      return;
    }
    setError(null);
    try {
      await unassignMutation.mutateAsync({
        assetId: asset.id,
        data: {
          targetStatus,
          reason: reason.trim(),
        },
      });
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('assetDetail.assignment.unassignFailed', 'Uittoewijzing mislukt. Probeer het opnieuw.');
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
            bgcolor: alpha('#FF7700', 0.1),
            border: `1px solid ${alpha('#FF7700', 0.2)}`,
            flexShrink: 0,
          }}
        >
          <LinkOffIcon sx={{ fontSize: 20, color: '#FF7700' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            {t('assetDetail.assignment.unassign', 'Uittoewijzen')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {asset.assetCode} — {asset.assetName}
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={handleClose}
          disabled={unassignMutation.isPending}
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

        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 1.5 }}>
          {t(
            'assetDetail.assignment.unassignWarning',
            'Dit verwijdert de koppeling met de huidige medewerker en/of werkplek. De activa krijgt de hieronder geselecteerde status.',
          )}
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Target status */}
          <FormControl fullWidth size="small">
            <InputLabel>
              {t('assetDetail.assignment.targetStatus', 'Nieuwe status na uittoewijzing')}
            </InputLabel>
            <Select
              value={targetStatus}
              label={t('assetDetail.assignment.targetStatus', 'Nieuwe status na uittoewijzing')}
              onChange={(e) => setTargetStatus(e.target.value as AssetStatus)}
            >
              {UNASSIGN_TARGET_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Required reason */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
              {t('assetDetail.assignment.reason', 'Reden')} *
            </Typography>
            <TextField
              multiline
              rows={3}
              size="small"
              fullWidth
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t(
                'assetDetail.assignment.reasonPlaceholder',
                'Bijv. medewerker verlaat de organisatie, apparaat terug naar stock...',
              )}
              error={!!error && !reason.trim()}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose} disabled={unassignMutation.isPending} color="inherit">
          {t('common.cancel', 'Annuleren')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={unassignMutation.isPending}
          startIcon={
            unassignMutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <LinkOffIcon />
            )
          }
          sx={{
            bgcolor: '#FF7700',
            color: '#fff',
            fontWeight: 600,
            borderRadius: 2,
            '&:hover': { bgcolor: '#E66A00' },
          }}
        >
          {unassignMutation.isPending
            ? t('common.saving', 'Opslaan...')
            : t('assetDetail.assignment.confirmUnassign', 'Uittoewijzen')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnassignDialog;
