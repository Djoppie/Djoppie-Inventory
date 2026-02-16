import { logger } from '../utils/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Snackbar, Card, CardContent, Stack, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssetForm from '../components/assets/AssetForm';
import { useAsset, useUpdateAsset } from '../hooks/useAssets';
import { CreateAssetDto, UpdateAssetDto } from '../types/asset.types';
import Loading from '../components/common/Loading';

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

const EditAssetPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading, error } = useAsset(Number(id));
  const updateAsset = useUpdateAsset();
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (data: CreateAssetDto | UpdateAssetDto) => {
    try {
      // In edit mode, data will always be UpdateAssetDto
      await updateAsset.mutateAsync({ id: Number(id), data: data as UpdateAssetDto });
      setSuccessMessage('Asset updated successfully!');
      // Redirect to detail page after short delay
      setTimeout(() => navigate(`/assets/${id}`), 1500);
    } catch (error) {
      logger.error('Error updating asset:', error);
    }
  };

  const handleCancel = () => {
    navigate(`/assets/${id}`);
  };

  if (isLoading) return <Loading />;

  if (error || !asset) {
    return (
      <Box>
        <Alert
          severity="error"
          sx={{
            border: '1px solid',
            borderColor: 'error.main',
            fontWeight: 600,
          }}
        >
          {error instanceof Error ? error.message : 'Failed to load asset'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Back Button - Outside card */}
      <Tooltip title="Back to Asset Details">
        <IconButton
          onClick={() => navigate(`/assets/${id}`)}
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

      {/* Header - Scanner style */}
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
              <EditIcon
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
                Edit Asset
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Update asset information for <strong>{asset.assetCode}</strong>
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {updateAsset.isError && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'error.main',
            fontWeight: 600,
          }}
        >
          {updateAsset.error instanceof Error
            ? updateAsset.error.message
            : 'Failed to update asset. Please try again.'}
        </Alert>
      )}

      {/* Asset Form */}
      <AssetForm
        initialData={asset}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateAsset.isPending}
        isEditMode={true}
      />

      {/* Success Snackbar */}
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
            boxShadow: 3,
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditAssetPage;
