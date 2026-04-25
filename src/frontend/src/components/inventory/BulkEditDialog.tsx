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
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useBulkUpdateAssets } from '../../hooks/useAssets';
import { BulkUpdateAssetsDto } from '../../types/asset.types';

/**
 * BulkEditDialog only handles intrinsic asset properties: brand, model,
 * purchase date, warranty expiry. Status, owner, employee, building,
 * physical workplace and installation date are mutated via the
 * dedicated assignment endpoints — bulk-assign affordances (PR5) call
 * those per-asset.
 */
interface BulkEditDialogProps {
  open: boolean;
  onClose: () => void;
  selectedAssetIds: number[];
  onSuccess?: () => void;
}

const BulkEditDialog = ({ open, onClose, selectedAssetIds, onSuccess }: BulkEditDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const bulkUpdateMutation = useBulkUpdateAssets();

  // Field values
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [warrantyExpiry, setWarrantyExpiry] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');

  // Update flags
  const [updatePurchaseDate, setUpdatePurchaseDate] = useState(false);
  const [updateWarrantyExpiry, setUpdateWarrantyExpiry] = useState(false);
  const [updateBrand, setUpdateBrand] = useState(false);
  const [updateModel, setUpdateModel] = useState(false);

  // Result state
  const [result, setResult] = useState<{
    success: boolean;
    updatedCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);

  const hasSelectedFields =
    updatePurchaseDate || updateWarrantyExpiry || updateBrand || updateModel;

  const handleSubmit = async () => {
    if (!hasSelectedFields) return;

    const dto: BulkUpdateAssetsDto = {
      assetIds: selectedAssetIds,
      purchaseDate: purchaseDate || undefined,
      updatePurchaseDate,
      warrantyExpiry: warrantyExpiry || undefined,
      updateWarrantyExpiry,
      brand: brand || undefined,
      updateBrand,
      model: model || undefined,
      updateModel,
    };

    try {
      const response = await bulkUpdateMutation.mutateAsync(dto);
      setResult({
        success: response.failedIds.length === 0,
        updatedCount: response.updatedCount,
        failedCount: response.failedIds.length,
        errors: response.errors,
      });
      if (response.failedIds.length === 0 && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setResult({
        success: false,
        updatedCount: 0,
        failedCount: selectedAssetIds.length,
        errors: [error instanceof Error ? error.message : 'An unexpected error occurred'],
      });
    }
  };

  const handleClose = () => {
    setResult(null);
    setPurchaseDate('');
    setWarrantyExpiry('');
    setBrand('');
    setModel('');
    setUpdatePurchaseDate(false);
    setUpdateWarrantyExpiry(false);
    setUpdateBrand(false);
    setUpdateModel(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <EditIcon sx={{ color: 'primary.main' }} />
        <Box>
          <Typography variant="h6" component="span" fontWeight={700}>
            {t('bulkEdit.title', { defaultValue: 'Bulk Edit Assets' })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('bulkEdit.selectedCount', {
              count: selectedAssetIds.length,
              defaultValue: `${selectedAssetIds.length} assets selected`,
            })}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {result ? (
          <Box sx={{ py: 2 }}>
            <Alert severity={result.success ? 'success' : 'warning'} sx={{ mb: 2 }}>
              {result.success
                ? t('bulkEdit.successMessage', {
                    count: result.updatedCount,
                    defaultValue: `Successfully updated ${result.updatedCount} assets`,
                  })
                : t('bulkEdit.partialSuccess', {
                    updated: result.updatedCount,
                    failed: result.failedCount,
                    defaultValue: `Updated ${result.updatedCount} assets, ${result.failedCount} failed`,
                  })}
            </Alert>
            {result.errors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  {t('bulkEdit.errors', { defaultValue: 'Errors:' })}
                </Typography>
                {result.errors.map((error, index) => (
                  <Typography key={index} variant="body2" color="error.main">
                    {error}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              {t('bulkEdit.instructions', {
                defaultValue:
                  'Check the fields you want to update. Only checked fields will be modified.',
              })}
            </Alert>

            <Alert severity="warning" sx={{ mb: 1 }}>
              {t('bulkEdit.workflowHint', {
                defaultValue:
                  'Status, eigenaar en locatie wijzigen niet via deze dialog. Gebruik daarvoor de toewijzings-knoppen op de asset of de bulk-toewijzing in de lijst.',
              })}
            </Alert>

            {/* Dates Section */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: updatePurchaseDate || updateWarrantyExpiry ? 'primary.main' : 'divider',
                bgcolor:
                  updatePurchaseDate || updateWarrantyExpiry
                    ? alpha(theme.palette.primary.main, 0.05)
                    : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarIcon fontSize="small" sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t('bulkEdit.dates', { defaultValue: 'Dates' })}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={updatePurchaseDate}
                        onChange={(e) => setUpdatePurchaseDate(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    }
                    label={t('bulkEdit.purchaseDate', { defaultValue: 'Purchase Date' })}
                  />
                  {updatePurchaseDate && (
                    <TextField
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={updateWarrantyExpiry}
                        onChange={(e) => setUpdateWarrantyExpiry(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    }
                    label={t('bulkEdit.warrantyExpiry', { defaultValue: 'Warranty Expiry' })}
                  />
                  {updateWarrantyExpiry && (
                    <TextField
                      type="date"
                      value={warrantyExpiry}
                      onChange={(e) => setWarrantyExpiry(e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Brand & Model */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: updateBrand || updateModel ? 'primary.main' : 'divider',
                bgcolor:
                  updateBrand || updateModel ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LabelIcon fontSize="small" sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t('bulkEdit.brandModel', { defaultValue: 'Brand & Model' })}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={updateBrand}
                        onChange={(e) => setUpdateBrand(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    }
                    label={t('bulkEdit.brand', { defaultValue: 'Brand' })}
                  />
                  {updateBrand && (
                    <TextField
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder={t('bulkEdit.brandPlaceholder', { defaultValue: 'Enter brand' })}
                      size="small"
                      fullWidth
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={updateModel}
                        onChange={(e) => setUpdateModel(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    }
                    label={t('bulkEdit.model', { defaultValue: 'Model' })}
                  />
                  {updateModel && (
                    <TextField
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={t('bulkEdit.modelPlaceholder', { defaultValue: 'Enter model' })}
                      size="small"
                      fullWidth
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {result
            ? t('common.close', { defaultValue: 'Close' })
            : t('common.cancel', { defaultValue: 'Cancel' })}
        </Button>
        {!result && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!hasSelectedFields || bulkUpdateMutation.isPending}
            startIcon={bulkUpdateMutation.isPending ? <CircularProgress size={16} /> : <EditIcon />}
            sx={{
              background: 'linear-gradient(135deg, #FF7700 0%, #FF9933 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #E66A00 0%, #E68A2E 100%)',
              },
            }}
          >
            {bulkUpdateMutation.isPending
              ? t('bulkEdit.updating', { defaultValue: 'Updating...' })
              : t('bulkEdit.update', { defaultValue: 'Update Assets' })}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkEditDialog;
