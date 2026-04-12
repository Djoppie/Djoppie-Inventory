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
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Business as BusinessIcon,
  CalendarMonth as CalendarIcon,
  Inventory as InventoryIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useBulkUpdateAssets } from '../../hooks/useAssets';
import { BulkUpdateAssetsDto, AssetStatus } from '../../types/asset.types';
import ServiceSelect from '../common/ServiceSelect';

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
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [installationDate, setInstallationDate] = useState<string>('');
  const [warrantyExpiry, setWarrantyExpiry] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [installationLocation, setInstallationLocation] = useState<string>('');

  // Update flags
  const [updateServiceId, setUpdateServiceId] = useState(false);
  const [updatePurchaseDate, setUpdatePurchaseDate] = useState(false);
  const [updateInstallationDate, setUpdateInstallationDate] = useState(false);
  const [updateWarrantyExpiry, setUpdateWarrantyExpiry] = useState(false);
  const [updateBrand, setUpdateBrand] = useState(false);
  const [updateModel, setUpdateModel] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(false);
  const [updateInstallationLocation, setUpdateInstallationLocation] = useState(false);

  // Result state
  const [result, setResult] = useState<{
    success: boolean;
    updatedCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);

  const hasSelectedFields = updateServiceId || updatePurchaseDate || updateInstallationDate ||
    updateWarrantyExpiry || updateBrand || updateModel || updateStatus || updateInstallationLocation;

  const handleSubmit = async () => {
    if (!hasSelectedFields) return;

    const dto: BulkUpdateAssetsDto = {
      assetIds: selectedAssetIds,
      serviceId: serviceId ?? undefined,
      updateServiceId,
      purchaseDate: purchaseDate || undefined,
      updatePurchaseDate,
      installationDate: installationDate || undefined,
      updateInstallationDate,
      warrantyExpiry: warrantyExpiry || undefined,
      updateWarrantyExpiry,
      brand: brand || undefined,
      updateBrand,
      model: model || undefined,
      updateModel,
      status: status || undefined,
      updateStatus,
      installationLocation: installationLocation || undefined,
      updateInstallationLocation,
    };

    try {
      const response = await bulkUpdateMutation.mutateAsync(dto);
      setResult({
        success: response.failedIds.length === 0,
        updatedCount: response.updatedCount,
        failedCount: response.failedIds.length,
        errors: response.errors,
      });

      if (response.failedIds.length === 0) {
        onSuccess?.();
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
    // Reset all fields
    setServiceId(null);
    setPurchaseDate('');
    setInstallationDate('');
    setWarrantyExpiry('');
    setBrand('');
    setModel('');
    setStatus('');
    setInstallationLocation('');
    // Reset all flags
    setUpdateServiceId(false);
    setUpdatePurchaseDate(false);
    setUpdateInstallationDate(false);
    setUpdateWarrantyExpiry(false);
    setUpdateBrand(false);
    setUpdateModel(false);
    setUpdateStatus(false);
    setUpdateInstallationLocation(false);
    onClose();
  };

  const statusOptions = Object.values(AssetStatus);

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
            <Alert
              severity={result.success ? 'success' : 'warning'}
              sx={{ mb: 2 }}
            >
              {result.success ? (
                t('bulkEdit.successMessage', {
                  count: result.updatedCount,
                  defaultValue: `Successfully updated ${result.updatedCount} assets`,
                })
              ) : (
                t('bulkEdit.partialSuccess', {
                  updated: result.updatedCount,
                  failed: result.failedCount,
                  defaultValue: `Updated ${result.updatedCount} assets, ${result.failedCount} failed`,
                })
              )}
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
                defaultValue: 'Check the fields you want to update. Only checked fields will be modified.',
              })}
            </Alert>

            {/* Service/Department */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: updateServiceId ? 'primary.main' : 'divider',
                bgcolor: updateServiceId ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BusinessIcon fontSize="small" sx={{ color: 'primary.main' }} />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={updateServiceId}
                      onChange={(e) => setUpdateServiceId(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="subtitle2" fontWeight={600}>
                      {t('bulkEdit.service', { defaultValue: 'Service / Department' })}
                    </Typography>
                  }
                />
              </Box>
              {updateServiceId && (
                <ServiceSelect
                  value={serviceId}
                  onChange={setServiceId}
                />
              )}
            </Box>

            {/* Dates Section */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: (updatePurchaseDate || updateInstallationDate || updateWarrantyExpiry)
                  ? 'primary.main' : 'divider',
                bgcolor: (updatePurchaseDate || updateInstallationDate || updateWarrantyExpiry)
                  ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
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
                {/* Purchase Date */}
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

                {/* Installation Date */}
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={updateInstallationDate}
                        onChange={(e) => setUpdateInstallationDate(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    }
                    label={t('bulkEdit.installationDate', { defaultValue: 'Installation Date' })}
                  />
                  {updateInstallationDate && (
                    <TextField
                      type="date"
                      value={installationDate}
                      onChange={(e) => setInstallationDate(e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                {/* Warranty Expiry */}
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
                borderColor: (updateBrand || updateModel) ? 'primary.main' : 'divider',
                bgcolor: (updateBrand || updateModel)
                  ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
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
                {/* Brand */}
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

                {/* Model */}
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

            {/* Status & Location */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: (updateStatus || updateInstallationLocation) ? 'primary.main' : 'divider',
                bgcolor: (updateStatus || updateInstallationLocation)
                  ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InventoryIcon fontSize="small" sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t('bulkEdit.statusLocation', { defaultValue: 'Status & Location' })}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Status */}
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    }
                    label={t('bulkEdit.status', { defaultValue: 'Status' })}
                  />
                  {updateStatus && (
                    <TextField
                      select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      {statusOptions.map((statusOption) => (
                        <MenuItem key={statusOption} value={statusOption}>
                          {t(`status.${statusOption}`, { defaultValue: statusOption })}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                </Box>

                {/* Installation Location */}
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={updateInstallationLocation}
                        onChange={(e) => setUpdateInstallationLocation(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    }
                    label={t('bulkEdit.installationLocation', { defaultValue: 'Installation Location' })}
                  />
                  {updateInstallationLocation && (
                    <TextField
                      value={installationLocation}
                      onChange={(e) => setInstallationLocation(e.target.value)}
                      placeholder={t('bulkEdit.locationPlaceholder', { defaultValue: 'e.g., Room 101, Floor 2' })}
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
          {result ? t('common.close', { defaultValue: 'Close' }) : t('common.cancel', { defaultValue: 'Cancel' })}
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
