import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Snackbar, Paper, Button, Stack } from '@mui/material';
import { useState } from 'react';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import InfoIcon from '@mui/icons-material/Info';
import AssetForm from '../components/assets/AssetForm';
import { useCreateAsset } from '../hooks/useAssets';
import { CreateAssetDto, UpdateAssetDto } from '../types/asset.types';
import { ROUTES } from '../constants/routes';

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

      {/* Bulk Creation Suggestion */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2.5,
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.08))'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.12))',
          border: '2px solid',
          borderColor: 'info.main',
          borderRadius: 2,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <InfoIcon color="info" sx={{ fontSize: 40 }} />
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
            color="info"
            startIcon={<LibraryAddIcon />}
            onClick={() => navigate(ROUTES.ASSETS_BULK_NEW)}
            sx={{ whiteSpace: 'nowrap', minWidth: 160 }}
          >
            Bulk Create
          </Button>
        </Stack>
      </Paper>

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
