import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { useState } from 'react';
import AssetForm from '../components/assets/AssetForm';
import { useAsset, useUpdateAsset } from '../hooks/useAssets';
import { CreateAssetDto, UpdateAssetDto } from '../types/asset.types';
import Loading from '../components/common/Loading';

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
      console.error('Error updating asset:', error);
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
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Asset
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Update asset information for <strong>{asset.assetCode}</strong>
        </Typography>
      </Box>

      {updateAsset.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {updateAsset.error instanceof Error
            ? updateAsset.error.message
            : 'Failed to update asset. Please try again.'}
        </Alert>
      )}

      <AssetForm
        initialData={asset}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateAsset.isPending}
        isEditMode={true}
      />

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditAssetPage;
