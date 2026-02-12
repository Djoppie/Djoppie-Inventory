import { logger } from '../utils/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Snackbar, Paper, Fade, useTheme } from '@mui/material';
import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import AssetForm from '../components/assets/AssetForm';
import { useAsset, useUpdateAsset } from '../hooks/useAssets';
import { CreateAssetDto, UpdateAssetDto } from '../types/asset.types';
import Loading from '../components/common/Loading';

const EditAssetPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
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
        <Alert severity="error">
          {error instanceof Error ? error.message : 'Failed to load asset'}
        </Alert>
      </Box>
    );
  }

  return (
    <Fade in timeout={600}>
      <Box>
        {/* Header */}
        <Fade in timeout={400}>
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light}, ${theme.palette.secondary.main})`,
                borderRadius: '12px 12px 0 0',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <EditIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
              <Typography variant="h4" component="h1">
                Edit Asset
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Update asset information for <strong>{asset.assetCode}</strong>
            </Typography>
          </Paper>
        </Fade>

        {/* Error Alert */}
        {updateAsset.isError && (
          <Fade in timeout={500}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {updateAsset.error instanceof Error
                ? updateAsset.error.message
                : 'Failed to update asset. Please try again.'}
            </Alert>
          </Fade>
        )}

        {/* Asset Form */}
        <Fade in timeout={600}>
          <Box>
            <AssetForm
              initialData={asset}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={updateAsset.isPending}
              isEditMode={true}
            />
          </Box>
        </Fade>

        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" sx={{ width: '100%', boxShadow: 3 }}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default EditAssetPage;
