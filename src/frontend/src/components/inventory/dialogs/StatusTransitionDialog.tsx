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
  FormControlLabel,
  Checkbox,
  CircularProgress,
  alpha,
  Tooltip,
  useTheme,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { Asset, AssetStatus } from '../../../types/asset.types';
import { useChangeAssetStatus } from '../../../hooks/useAssets';
import { getNeumorph, getNeumorphColors } from '../../../utils/neumorphicStyles';
import { getAllowedTransitions, STATUS_LABELS } from '../../../utils/assetStateMachine';

interface StatusTransitionDialogProps {
  open: boolean;
  onClose: () => void;
  asset: Asset;
}

const StatusTransitionDialog = ({ open, onClose, asset }: StatusTransitionDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const [adminOverride, setAdminOverride] = useState(false);
  const [newStatus, setNewStatus] = useState<AssetStatus | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const changeStatusMutation = useChangeAssetStatus();

  // Get the allowed target statuses based on the admin override toggle
  const allowedTargets = getAllowedTransitions(asset.status, adminOverride);

  // When toggling adminOverride, reset newStatus if it's no longer in the allowed list
  const handleAdminOverrideChange = (checked: boolean) => {
    setAdminOverride(checked);
    if (!checked && newStatus) {
      const regularTargets = getAllowedTransitions(asset.status, false);
      if (!regularTargets.includes(newStatus as AssetStatus)) {
        setNewStatus('');
      }
    }
  };

  const handleClose = () => {
    if (changeStatusMutation.isPending) return;
    setAdminOverride(false);
    setNewStatus('');
    setReason('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!newStatus) {
      setError(t('assetDetail.statusTransition.statusRequired', 'Selecteer een nieuwe status.'));
      return;
    }
    setError(null);
    try {
      await changeStatusMutation.mutateAsync({
        assetId: asset.id,
        data: {
          newStatus: newStatus as AssetStatus,
          adminOverride,
          reason: reason || undefined,
        },
      });
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('assetDetail.statusTransition.changeFailed', 'Statuswijziging mislukt. Probeer het opnieuw.');
      setError(message);
    }
  };

  const isTerminal = asset.status === AssetStatus.UitDienst && !adminOverride;

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
          <SwapHorizIcon sx={{ fontSize: 20, color: '#FF7700' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            {t('assetDetail.statusTransition.title', 'Status wijzigen')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {asset.assetCode} — {t('assetDetail.statusTransition.currentStatus', 'Huidige status')}:{' '}
            <strong>{STATUS_LABELS[asset.status]}</strong>
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={handleClose}
          disabled={changeStatusMutation.isPending}
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

        {isTerminal && (
          <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 1.5 }}>
            {t(
              'assetDetail.statusTransition.terminalWarning',
              'Status "Uit dienst" is definitief. Gebruik de admin-override om te reactiveren.',
            )}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Target status selector */}
          <FormControl fullWidth size="small" disabled={isTerminal}>
            <InputLabel>
              {t('assetDetail.statusTransition.newStatus', 'Nieuwe status')} *
            </InputLabel>
            <Select
              value={newStatus}
              label={`${t('assetDetail.statusTransition.newStatus', 'Nieuwe status')} *`}
              onChange={(e) => {
                setNewStatus(e.target.value as AssetStatus);
                setError(null);
              }}
            >
              {allowedTargets.length === 0 && (
                <MenuItem disabled>
                  <Typography variant="caption" color="text.secondary">
                    {t('assetDetail.statusTransition.noTransitions', 'Geen overgangen beschikbaar')}
                  </Typography>
                </MenuItem>
              )}
              {allowedTargets.map((s) => (
                <MenuItem key={s} value={s}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: STATUS_COLOR_MAP[s],
                        flexShrink: 0,
                      }}
                    />
                    {STATUS_LABELS[s]}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Optional reason */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
              {t('assetDetail.statusTransition.reason', 'Reden')} ({t('common.optional', 'optioneel')})
            </Typography>
            <TextField
              multiline
              rows={2}
              size="small"
              fullWidth
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                'assetDetail.statusTransition.reasonPlaceholder',
                'Bijv. defect gemeld door gebruiker, terug uit herstelling...',
              )}
            />
          </Box>

          {/* Admin override */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: adminOverride ? alpha('#FF7700', 0.4) : 'divider',
              bgcolor: adminOverride ? alpha('#FF7700', 0.04) : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={adminOverride}
                    onChange={(e) => handleAdminOverrideChange(e.target.checked)}
                    size="small"
                    sx={{ '&.Mui-checked': { color: '#FF7700' } }}
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={600}>
                    {t('assetDetail.statusTransition.adminOverride', 'Admin-override inschakelen')}
                  </Typography>
                }
                sx={{ mr: 0 }}
              />
              <Tooltip
                title={t(
                  'assetDetail.statusTransition.adminOverrideTooltip',
                  'Met de admin-override worden de normale statusovergangsregels omzeild. Gebruik dit alleen bij uitzondering, bijv. om een "Uit dienst"-asset te heractiveren.',
                )}
                arrow
                placement="right"
              >
                <InfoOutlinedIcon sx={{ fontSize: 18, color: 'text.disabled', cursor: 'help' }} />
              </Tooltip>
            </Box>
            {adminOverride && (
              <Typography variant="caption" color="warning.main" sx={{ pl: 4, display: 'block', mt: 0.25 }}>
                {t(
                  'assetDetail.statusTransition.adminOverrideActive',
                  'Alle statussen zijn nu selecteerbaar, inclusief reguliere overgangsregels.',
                )}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose} disabled={changeStatusMutation.isPending} color="inherit">
          {t('common.cancel', 'Annuleren')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!newStatus || changeStatusMutation.isPending}
          startIcon={
            changeStatusMutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SwapHorizIcon />
            )
          }
          sx={{
            bgcolor: '#FF7700',
            color: '#fff',
            fontWeight: 600,
            borderRadius: 2,
            '&:hover': { bgcolor: '#E66A00' },
            '&.Mui-disabled': { bgcolor: alpha('#FF7700', 0.3), color: '#fff' },
          }}
        >
          {changeStatusMutation.isPending
            ? t('common.saving', 'Opslaan...')
            : t('assetDetail.statusTransition.confirm', 'Status wijzigen')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/** Small colour dots for the status dropdown. */
const STATUS_COLOR_MAP: Record<AssetStatus, string> = {
  [AssetStatus.Nieuw]: '#00BCD4',
  [AssetStatus.InGebruik]: '#4CAF50',
  [AssetStatus.Stock]: '#2196F3',
  [AssetStatus.Herstelling]: '#FF9800',
  [AssetStatus.Defect]: '#f44336',
  [AssetStatus.UitDienst]: '#9E9E9E',
};

export default StatusTransitionDialog;
