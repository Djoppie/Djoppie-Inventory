import { logger } from '../utils/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Paper,
  Fade,
  alpha,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScienceIcon from '@mui/icons-material/Science';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { QRCodeSVG } from 'qrcode.react';
import PrintIcon from '@mui/icons-material/Print';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAsset, useDeleteAsset } from '../hooks/useAssets';
import Loading from '../components/common/Loading';
import StatusBadge from '../components/common/StatusBadge';

// Helper: check if an asset code has a number >= 9000 (dummy/test asset)
const isDummyAsset = (assetCode: string): boolean => {
  const lastDash = assetCode.lastIndexOf('-');
  if (lastDash < 0) return false;
  const numStr = assetCode.substring(lastDash + 1);
  const num = parseInt(numStr, 10);
  return !isNaN(num) && num >= 9000;
};

// Section Header Component (matching AssetForm style)
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

const SectionHeader = ({ icon, title }: SectionHeaderProps) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 2,
          background: theme.palette.mode === 'light'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.2)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.3)}, ${alpha(theme.palette.primary.main, 0.2)})`,
          color: theme.palette.primary.main,
          boxShadow: theme.palette.mode === 'light'
            ? '2px 2px 4px rgba(0, 0, 0, 0.1), -2px -2px 4px rgba(255, 255, 255, 0.9)'
            : '3px 3px 6px rgba(0, 0, 0, 0.6), -2px -2px 4px rgba(255, 255, 255, 0.03)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'rotate(5deg) scale(1.05)',
          },
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

const AssetDetailPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading, error } = useAsset(Number(id));
  const deleteAsset = useDeleteAsset();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleEdit = () => {
    navigate(`/assets/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteAsset.mutateAsync(Number(id));
      navigate('/');
    } catch (error) {
      logger.error('Error deleting asset:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  if (isLoading) return <Loading />;

  if (error || !asset) {
    return (
      <Box>
        <Alert severity="error">
          {error instanceof Error ? error.message : 'Failed to load asset'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
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
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{ mb: 2 }}
            >
              Back to Dashboard
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {asset.assetName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography variant="h6" color="text.secondary">
                    {asset.assetCode}
                  </Typography>
                  <StatusBadge status={asset.status} />
                  {isDummyAsset(asset.assetCode) && (
                    <Chip
                      icon={<ScienceIcon />}
                      label={t('assetForm.dummyAsset')}
                      color="warning"
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  {t('common.delete')}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Fade>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Main Information */}
          <Box sx={{ flex: 1 }}>
            {/* Identification */}
            <Fade in timeout={500}>
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <SectionHeader
                    icon={<QrCodeIcon />}
                    title={t('assetForm.identificationSection')}
                  />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('assetDetail.assetCode')}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {asset.assetCode}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('assetDetail.category')}
                      </Typography>
                      <Typography variant="body1">{asset.category}</Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('assetForm.assetNameDevice')}
                      </Typography>
                      <Typography variant="body1">{asset.assetName}</Typography>
                    </Box>
                    {asset.alias && (
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="caption" color="text.secondary">
                          {t('assetForm.alias')}
                        </Typography>
                        <Typography variant="body1">{asset.alias}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Fade>

            {/* Assignment Details */}
            <Fade in timeout={600}>
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <SectionHeader
                    icon={<PersonIcon />}
                    title={t('assetForm.assignmentSection')}
                  />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('assetDetail.primaryUser')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {asset.owner}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('assetForm.installationLocation')}
                      </Typography>
                      <Typography variant="body1">{asset.building}</Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('assetDetail.department')}
                      </Typography>
                      <Typography variant="body1">{asset.department || '-'}</Typography>
                    </Box>
                    {asset.jobTitle && (
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="caption" color="text.secondary">
                          {t('assetDetail.jobTitle')}
                        </Typography>
                        <Typography variant="body1">{asset.jobTitle}</Typography>
                      </Box>
                    )}
                    {asset.officeLocation && (
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="caption" color="text.secondary">
                          {t('assetDetail.officeLocation')}
                        </Typography>
                        <Typography variant="body1">{asset.officeLocation}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Fade>

            {/* Technical Specifications */}
            <Fade in timeout={700}>
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <SectionHeader
                    icon={<ComputerIcon />}
                    title={t('assetForm.technicalSection')}
                  />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('assetDetail.brand')}
                      </Typography>
                      <Typography variant="body1">
                        {asset.brand || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('assetDetail.model')}
                      </Typography>
                      <Typography variant="body1">
                        {asset.model || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('assetDetail.serialNumber')}
                      </Typography>
                      <Typography variant="body1">
                        {asset.serialNumber || '-'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Fade>

            {/* Lifecycle Information */}
            <Fade in timeout={800}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <SectionHeader
                    icon={<CalendarMonthIcon />}
                    title={t('assetForm.lifecycleSection')}
                  />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('assetDetail.purchaseDate')}
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(asset.purchaseDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('assetDetail.warrantyExpiry')}
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(asset.warrantyExpiry)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('assetDetail.installationDate')}
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(asset.installationDate)}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(asset.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(asset.updatedAt)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Box>

          {/* QR Code Section */}
          <Box sx={{ width: { xs: '100%', md: '350px' } }}>
            <Fade in timeout={900}>
              <Card
                elevation={0}
                sx={{
                  position: { md: 'sticky' },
                  top: 16,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    QR Code
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Scan to quickly access this asset
                  </Typography>

                  <Box
                    id="qr-code-container"
                    sx={{
                      p: 3,
                      bgcolor: '#FFFFFF',
                      borderRadius: 2,
                      display: 'inline-block',
                      boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '0 4px 12px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.05)'
                          : '0 2px 8px rgba(0, 0, 0, 0.1)',
                      border: '3px solid',
                      borderColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 119, 0, 0.3)'
                          : 'rgba(255, 119, 0, 0.2)',
                    }}
                  >
                    <QRCodeSVG
                      id="asset-qr-code"
                      value={asset.assetCode}
                      size={200}
                      level="H"
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                  </Box>

                  <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
                    Asset Code: {asset.assetCode}
                  </Typography>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    sx={{ mt: 3 }}
                    onClick={() => {
                      const svg = document.querySelector('#asset-qr-code');
                      if (svg) {
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const printWindow = window.open('', '_blank', 'width=400,height=400');
                        if (printWindow) {
                          printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <title>Print QR Label - ${asset.assetCode}</title>
                                <style>
                                  * { margin: 0; padding: 0; box-sizing: border-box; }
                                  body { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Segoe UI', Roboto, Arial, sans-serif; background: #fff; }
                                  .label { display: flex; flex-direction: column; align-items: center; padding: 16px; gap: 8px; }
                                  .qr-code svg { width: 150px; height: 150px; }
                                  .asset-code { font-size: 18px; font-weight: 700; color: #000; text-align: center; }
                                  @media print { body { min-height: auto; } .label { padding: 8px; } .qr-code svg { width: 120px; height: 120px; } .asset-code { font-size: 14pt; } }
                                </style>
                              </head>
                              <body>
                                <div class="label">
                                  <div class="qr-code">${svgData}</div>
                                  <div class="asset-code">${asset.assetCode}</div>
                                </div>
                                <script>window.onload = function() { setTimeout(function() { window.print(); window.onafterprint = function() { window.close(); }; }, 250); };<\/script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }
                      }
                    }}
                  >
                    Print Label
                  </Button>
                </CardContent>
              </Card>
            </Fade>
          </Box>
        </Box>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Asset</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete <strong>{asset.assetName}</strong> ({asset.assetCode})?
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setDeleteDialogOpen(false);
                handleDelete();
              }}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default AssetDetailPage;
