import { logger } from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Snackbar, Card, CardContent, Button, Stack, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssetForm from '../components/assets/AssetForm';
import { useCreateAsset } from '../hooks/useAssets';
import { CreateAssetDto, UpdateAssetDto } from '../types/asset.types';
import { ROUTES } from '../constants/routes';

// Scanner-style card wrapper - consistent with ScanPage
const scannerCardSx = {
  mb: 3,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === 'dark'
        ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
        : '0 4px 20px rgba(253, 185, 49, 0.3)',
  },
};

// Consistent icon button style
const iconButtonSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === 'dark'
        ? '0 4px 16px rgba(255, 215, 0, 0.2)'
        : '0 2px 12px rgba(253, 185, 49, 0.3)',
  },
};

const AddAssetPage = () => {
  const navigate = useNavigate();
  const createAsset = useCreateAsset();
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (data: CreateAssetDto | UpdateAssetDto) => {
    try {
      // Clean up empty strings — ASP.NET Core can't deserialize "" as DateTime?
      const cleanedData = {
        ...data,
        brand: data.brand || undefined,
        model: data.model || undefined,
        serialNumber: (data as CreateAssetDto).serialNumber || undefined,
        purchaseDate: data.purchaseDate || undefined,
        warrantyExpiry: data.warrantyExpiry || undefined,
        installationDate: data.installationDate || undefined,
      };
      await createAsset.mutateAsync(cleanedData as CreateAssetDto);
      setSuccessMessage('Asset created successfully!');
      // Redirect to dashboard after short delay
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      logger.error('Error creating asset:', error);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <Box>
      {/* Back Button - Outside card */}
      <Tooltip title="Back to Dashboard">
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            ...iconButtonSx,
            mb: 2,
            color: 'text.secondary',
            '&:hover': {
              ...iconButtonSx['&:hover'],
              color: 'primary.main',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      {/* Header Card - Scanner style */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 215, 0, 0.08)'
                    : 'rgba(253, 185, 49, 0.08)',
                transition: 'all 0.3s ease',
              }}
            >
              <AddCircleOutlineIcon
                sx={{
                  fontSize: 28,
                  color: 'primary.main',
                  filter: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                      : 'none',
                }}
              />
            </Box>
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700}>
                Add New Asset
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Create a new asset record. Use templates for quick setup or enter details manually.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Bulk Creation Suggestion - orange themed */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 215, 0, 0.08)'
                    : 'rgba(253, 185, 49, 0.08)',
                flexShrink: 0,
              }}
            >
              <InfoIcon
                sx={{
                  fontSize: 24,
                  color: 'primary.main',
                  filter: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                      : 'none',
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Need to create multiple assets?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use bulk creation to save time when adding multiple similar assets with sequential codes.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<LibraryAddIcon />}
              onClick={() => navigate(ROUTES.ASSETS_BULK_NEW)}
              sx={{ whiteSpace: 'nowrap', minWidth: 160 }}
            >
              Bulk Create
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {createAsset.isError && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'error.main',
            fontWeight: 600,
          }}
        >
          {createAsset.error instanceof Error
            ? createAsset.error.message
            : 'Failed to create asset. Please check if the asset code already exists.'}
        </Alert>
      )}

      <AssetForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createAsset.isPending}
      />

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          sx={{
            width: '100%',
            border: '1px solid',
            borderColor: 'success.main',
            fontWeight: 600,
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddAssetPage;
