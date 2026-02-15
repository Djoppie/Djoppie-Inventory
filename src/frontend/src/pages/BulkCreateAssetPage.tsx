import { logger } from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  LinearProgress,
  Paper,
  Fade,
  Zoom,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import BulkAssetCreationForm from '../components/assets/BulkAssetCreationForm';
import CsvImportDialog from '../components/import/CsvImportDialog';
import { useBulkCreateAssets, useCreateAsset } from '../hooks/useAssets';
import { BulkCreateAssetDto, BulkCreateAssetResultDto, CreateAssetDto, Asset } from '../types/asset.types';

const BulkCreateAssetPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const bulkCreate = useBulkCreateAssets();
  const createAsset = useCreateAsset();
  const [successMessage, setSuccessMessage] = useState('');
  const [result, setResult] = useState<BulkCreateAssetResultDto | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [isCreatingMultiple, setIsCreatingMultiple] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  const handleSubmit = async (data: BulkCreateAssetDto) => {
    try {
      // Clean up empty strings — ASP.NET Core can't deserialize "" as DateTime?
      const cleanedData = {
        ...data,
        brand: data.brand || undefined,
        model: data.model || undefined,
        // serialNumberPrefix is required, don't clean it
        purchaseDate: data.purchaseDate || undefined,
        warrantyExpiry: data.warrantyExpiry || undefined,
        installationDate: data.installationDate || undefined,
      };
      const response = await bulkCreate.mutateAsync(cleanedData);
      setResult(response);
      setShowResultDialog(true);

      // Show success message if at least some assets were created
      if (response.successfullyCreated > 0) {
        setSuccessMessage(
          response.isFullySuccessful
            ? `Successfully created all ${response.successfullyCreated} assets!`
            : `Created ${response.successfullyCreated} of ${response.totalRequested} assets`
        );
      }
    } catch (error) {
      logger.error('Error creating assets:', error);
    }
  };

  // Helper to convert date string to ISO format for backend
  const formatDateForApi = (dateStr: string | undefined): string | undefined => {
    if (!dateStr) return undefined;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString();
    } catch {
      return undefined;
    }
  };

  // Handle CSV import - create assets one by one
  const handleSubmitMultiple = async (assets: CreateAssetDto[]) => {
    setIsCreatingMultiple(true);
    const createdAssets: Asset[] = [];
    const errors: string[] = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      try {
        // Build asset - required fields must be present, optional fields can be undefined
        // Note: Backend expects empty strings for string fields, not null/undefined
        const cleanedAsset: CreateAssetDto = {
          // Required fields
          serialNumber: asset.serialNumber,
          assetCodePrefix: asset.assetCodePrefix || 'IMP',
          category: asset.category,
          // Fields with defaults
          status: asset.status || 'Stock',
          assetName: asset.assetName || '',
          isDummy: asset.isDummy || false,
        };

        // Only add optional fields if they have actual values
        // Note: Service is now used as location - use assetTypeId, serviceId
        if (asset.assetTypeId) cleanedAsset.assetTypeId = asset.assetTypeId;
        if (asset.serviceId) cleanedAsset.serviceId = asset.serviceId;
        if (asset.installationLocation) cleanedAsset.installationLocation = asset.installationLocation;
        if (asset.owner) cleanedAsset.owner = asset.owner;
        if (asset.brand) cleanedAsset.brand = asset.brand;
        if (asset.model) cleanedAsset.model = asset.model;

        // Format dates to ISO format for backend
        const purchaseDate = formatDateForApi(asset.purchaseDate);
        const warrantyExpiry = formatDateForApi(asset.warrantyExpiry);
        const installationDate = formatDateForApi(asset.installationDate);

        if (purchaseDate) cleanedAsset.purchaseDate = purchaseDate;
        if (warrantyExpiry) cleanedAsset.warrantyExpiry = warrantyExpiry;
        if (installationDate) cleanedAsset.installationDate = installationDate;

        const created = await createAsset.mutateAsync(cleanedAsset);
        createdAssets.push(created);
      } catch (error: unknown) {
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        // Try to extract validation errors from axios error response
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { errors?: Record<string, string[]>; title?: string } } };
          if (axiosError.response?.data?.errors) {
            const validationErrors = Object.entries(axiosError.response.data.errors)
              .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
              .join('; ');
            errorMessage = validationErrors || axiosError.response.data.title || errorMessage;
          }
        }
        errors.push(`Row ${i + 1} (${asset.serialNumber}): ${errorMessage}`);
        logger.error(`Error creating asset ${asset.serialNumber}:`, error);
      }
    }

    // Build result similar to bulk create
    const csvResult: BulkCreateAssetResultDto = {
      totalRequested: assets.length,
      successfullyCreated: createdAssets.length,
      failed: errors.length,
      isFullySuccessful: errors.length === 0,
      createdAssets: createdAssets,
      errors: errors,
    };

    setResult(csvResult);
    setShowResultDialog(true);
    setIsCreatingMultiple(false);

    if (createdAssets.length > 0) {
      setSuccessMessage(
        csvResult.isFullySuccessful
          ? `Successfully imported all ${createdAssets.length} assets!`
          : `Imported ${createdAssets.length} of ${assets.length} assets`
      );
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleCloseDialog = () => {
    setShowResultDialog(false);
    if (result?.isFullySuccessful) {
      // Redirect to dashboard after successful creation
      setTimeout(() => navigate('/'), 500);
    }
  };

  const getDialogIcon = () => {
    if (!result) return null;

    if (result.isFullySuccessful) {
      return (
        <Zoom in={showResultDialog}>
          <CheckCircleIcon
            sx={{
              fontSize: 80,
              color: 'success.main',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
              },
            }}
          />
        </Zoom>
      );
    } else if (result.successfullyCreated > 0) {
      return (
        <Zoom in={showResultDialog}>
          <WarningIcon
            sx={{
              fontSize: 80,
              color: 'warning.main',
              animation: 'shake 0.5s',
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '25%': { transform: 'translateX(-10px)' },
                '75%': { transform: 'translateX(10px)' },
              },
            }}
          />
        </Zoom>
      );
    } else {
      return (
        <Zoom in={showResultDialog}>
          <ErrorIcon sx={{ fontSize: 80, color: 'error.main' }} />
        </Zoom>
      );
    }
  };

  return (
    <Fade in timeout={600}>
      <Box>
        {/* Header Section with Animation */}
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
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0.5 }}>
                  Bulk Asset Creation
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Create multiple assets at once with sequential asset codes and shared properties.
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label="Save Time"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label="Sequential Codes"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label="Template Support"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setCsvImportOpen(true)}
                sx={{
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    bgcolor: `${theme.palette.primary.main}15`,
                  },
                }}
              >
                Import from CSV
              </Button>
            </Box>
          </Paper>
        </Fade>

        {/* Error Alert */}
        {bulkCreate.isError && (
          <Fade in timeout={500}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {bulkCreate.error instanceof Error
                ? bulkCreate.error.message
                : 'Failed to create assets. Please try again.'}
            </Alert>
          </Fade>
        )}

        {/* Form */}
        <Fade in timeout={600}>
          <Box>
            <BulkAssetCreationForm
              onSubmit={handleSubmit}
              onSubmitMultiple={handleSubmitMultiple}
              onCancel={handleCancel}
              isLoading={bulkCreate.isPending || isCreatingMultiple}
            />
          </Box>
        </Fade>

        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="success"
            sx={{
              width: '100%',
              boxShadow: 3,
            }}
          >
            {successMessage}
          </Alert>
        </Snackbar>

        {/* Result Dialog with Animations */}
        <Dialog
          open={showResultDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          TransitionComponent={Zoom}
          TransitionProps={{ timeout: 400 }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: 'visible',
            },
          }}
        >
        <DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {getDialogIcon()}
            <Typography variant="h5" fontWeight={600}>
              {result?.isFullySuccessful
                ? 'Assets Created Successfully!'
                : result?.successfullyCreated === 0
                ? 'Creation Failed'
                : 'Partially Completed'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 3 }}>
          {result && (
            <Box>
              {/* Progress Summary */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Creation Progress
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {result.successfullyCreated} / {result.totalRequested}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(result.successfullyCreated / result.totalRequested) * 100}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: 'background.paper',
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={`${result.successfullyCreated} Created`}
                      color="success"
                      sx={{ fontWeight: 600 }}
                    />
                    {result.failed > 0 && (
                      <Chip
                        icon={<ErrorIcon />}
                        label={`${result.failed} Failed`}
                        color="error"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Box>
                </Stack>
              </Paper>

              {/* Successfully Created Assets */}
              {result.createdAssets.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom fontWeight={600}>
                    Successfully Created Assets:
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {result.createdAssets.slice(0, 10).map((asset) => (
                      <ListItem
                        key={asset.id}
                        sx={{
                          bgcolor: 'background.default',
                          mb: 0.5,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600}>
                              {asset.assetCode}
                            </Typography>
                          }
                          secondary={asset.assetName}
                        />
                        <Chip label={asset.category} size="small" />
                      </ListItem>
                    ))}
                    {result.createdAssets.length > 10 && (
                      <ListItem>
                        <ListItemText
                          secondary={`... and ${result.createdAssets.length - 10} more`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="error.main" gutterBottom fontWeight={600}>
                    Errors:
                  </Typography>
                  <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                    {result.errors.map((error, idx) => (
                      <ListItem
                        key={idx}
                        sx={{
                          bgcolor: 'error.light',
                          color: 'error.contrastText',
                          mb: 0.5,
                          borderRadius: 1,
                          opacity: 0.9,
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" color="inherit">
                              {error}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          {result?.isFullySuccessful ? (
            <Button
              onClick={handleCloseDialog}
              variant="contained"
              fullWidth
              size="large"
              sx={{ minHeight: 48 }}
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button onClick={handleCloseDialog} variant="outlined" size="large">
                Close
              </Button>
              {result && result.successfullyCreated > 0 && (
                <Button
                  onClick={() => navigate('/')}
                  variant="contained"
                  size="large"
                >
                  View Created Assets
                </Button>
              )}
            </>
          )}
        </DialogActions>
        </Dialog>

        {/* CSV Import Dialog */}
        <CsvImportDialog
          open={csvImportOpen}
          onClose={() => setCsvImportOpen(false)}
          onSuccess={() => {
            setSuccessMessage('Assets imported successfully from CSV!');
            setCsvImportOpen(false);
          }}
        />
      </Box>
    </Fade>
  );
};

export default BulkCreateAssetPage;
