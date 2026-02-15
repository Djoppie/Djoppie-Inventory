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
  Card,
  CardContent,
  Zoom,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import BulkAssetCreationForm from '../components/assets/BulkAssetCreationForm';
import { useBulkCreateAssets } from '../hooks/useAssets';
import { BulkCreateAssetDto, BulkCreateAssetResultDto } from '../types/asset.types';

const BulkCreateAssetPage = () => {
  const navigate = useNavigate();
  const bulkCreate = useBulkCreateAssets();
  const [successMessage, setSuccessMessage] = useState('');
  const [result, setResult] = useState<BulkCreateAssetResultDto | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const handleSubmit = async (data: BulkCreateAssetDto) => {
    try {
      // Clean up empty strings — ASP.NET Core can't deserialize "" as DateTime?
      const cleanedData = {
        ...data,
        brand: data.brand || undefined,
        model: data.model || undefined,
        purchaseDate: data.purchaseDate || undefined,
        warrantyExpiry: data.warrantyExpiry || undefined,
        installationDate: data.installationDate || undefined,
      };
      const response = await bulkCreate.mutateAsync(cleanedData);
      setResult(response);
      setShowResultDialog(true);

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

  const handleCsvImportSuccess = () => {
    setSuccessMessage('Assets imported successfully from CSV!');
    setTimeout(() => navigate('/'), 1500);
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleCloseDialog = () => {
    setShowResultDialog(false);
    if (result?.isFullySuccessful) {
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
          <WarningIcon sx={{ fontSize: 80, color: 'warning.main' }} />
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
    <Box>
      {/* Header - Scanner style */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
                : '0 4px 20px rgba(253, 185, 49, 0.3)',
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <InventoryIcon
              sx={{
                fontSize: 40,
                color: 'primary.main',
                filter: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                    : 'none',
              }}
            />
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700}>
                Bulk Asset Creation
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Create multiple assets at once with sequential asset codes and shared properties.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {bulkCreate.isError && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'error.main',
            fontWeight: 600,
          }}
        >
          {bulkCreate.error instanceof Error
            ? bulkCreate.error.message
            : 'Failed to create assets. Please try again.'}
        </Alert>
      )}

      {/* Form */}
      <BulkAssetCreationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onCsvImportSuccess={handleCsvImportSuccess}
        isLoading={bulkCreate.isPending}
      />

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
            border: '1px solid',
            borderColor: 'success.main',
            fontWeight: 600,
            boxShadow: 3,
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Result Dialog */}
      <Dialog
        open={showResultDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
        TransitionProps={{ timeout: 400 }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
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
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <CardContent>
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
                        sx={{ height: 10, borderRadius: 5 }}
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
                </CardContent>
              </Card>

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
    </Box>
  );
};

export default BulkCreateAssetPage;
