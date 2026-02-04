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
        serialNumberPrefix: data.serialNumberPrefix || undefined,
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
      console.error('Error creating assets:', error);
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
    <Box>
      {/* Header Section with Animation */}
      <Fade in={true} timeout={800}>
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 3,
            background: (theme) =>
              theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, rgba(255, 146, 51, 0.08), rgba(255, 119, 0, 0.12))'
                : 'linear-gradient(135deg, rgba(255, 146, 51, 0.12), rgba(255, 119, 0, 0.15))',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #FF9233, #FF7700, #CC0000)',
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
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
        </Paper>
      </Fade>

      {/* Error Alert */}
      {bulkCreate.isError && (
        <Fade in={true}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {bulkCreate.error instanceof Error
              ? bulkCreate.error.message
              : 'Failed to create assets. Please try again.'}
          </Alert>
        </Fade>
      )}

      {/* Form */}
      <Fade in={true} timeout={1000}>
        <Box>
          <BulkAssetCreationForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={bulkCreate.isPending}
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
    </Box>
  );
};

export default BulkCreateAssetPage;
