import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import DeleteIcon from '@mui/icons-material/Delete';
import { Asset } from '../../types/asset.types';

interface BulkDeleteDialogProps {
  open: boolean;
  isDeleting: boolean;
  deleteError: string | null;
  selectedAssets: Asset[];
  onClose: () => void;
  onConfirm: () => void;
}

export default function BulkDeleteDialog({
  open,
  isDeleting,
  deleteError,
  selectedAssets,
  onClose,
  onConfirm,
}: BulkDeleteDialogProps) {
  const { t } = useTranslation();
  const selectedCount = selectedAssets.length;

  return (
    <Dialog
      open={open}
      onClose={() => !isDeleting && onClose()}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
        <DeleteIcon />
        {t('bulkDelete.confirmTitle', { defaultValue: 'Delete Assets' })}
      </DialogTitle>
      <DialogContent>
        {deleteError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {deleteError}
          </Alert>
        )}
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('bulkDelete.warning', {
            defaultValue: 'This action cannot be undone. All selected assets and their history will be permanently deleted.',
          })}
        </Alert>
        <Typography>
          {t('bulkDelete.confirmMessage', {
            count: selectedCount,
            defaultValue: `Are you sure you want to delete ${selectedCount} asset(s)?`,
          })}
        </Typography>
        {selectedCount > 0 && selectedCount <= 10 && (
          <Box sx={{ mt: 2, pl: 2 }}>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
              {t('bulkDelete.selectedAssets', { defaultValue: 'Selected assets:' })}
            </Typography>
            {selectedAssets.map((asset) => (
              <Typography key={asset.id} variant="body2" sx={{ color: 'text.secondary' }}>
                - {asset.assetCode} ({asset.assetName || 'Unnamed'})
              </Typography>
            ))}
          </Box>
        )}
        {selectedCount > 10 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            {t('bulkDelete.tooManyToList', {
              defaultValue: `${selectedCount} assets selected (too many to list)`,
            })}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isDeleting}>
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
        >
          {isDeleting
            ? t('bulkDelete.deleting', { defaultValue: 'Deleting...' })
            : t('bulkDelete.delete', { defaultValue: 'Delete' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
