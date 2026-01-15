import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { useState } from 'react';
import AssetForm from '../components/assets/AssetForm';
import { useCreateAsset } from '../hooks/useAssets';
import { CreateAssetDto, UpdateAssetDto } from '../types/asset.types';

const AddAssetPage = () => {
  const navigate = useNavigate();
  const createAsset = useCreateAsset();
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (data: CreateAssetDto | UpdateAssetDto) => {
    try {
      // In create mode, data will always be CreateAssetDto
      await createAsset.mutateAsync(data as CreateAssetDto);
      setSuccessMessage('Asset created successfully!');
      // Redirect to dashboard after short delay
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Asset
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a new asset record. Use templates for quick setup or enter details manually.
        </Typography>
      </Box>

      {createAsset.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
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
        <Alert severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddAssetPage;
