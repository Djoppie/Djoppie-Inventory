import { logger } from '../utils/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScienceIcon from '@mui/icons-material/Science';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DescriptionIcon from '@mui/icons-material/Description';
import { QRCodeSVG } from 'qrcode.react';
import PrintIcon from '@mui/icons-material/Print';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAsset, useDeleteAsset } from '../hooks/useAssets';
import Loading from '../components/common/Loading';
import StatusBadge from '../components/common/StatusBadge';
import PrintLabelDialog from '../components/print/PrintLabelDialog';
import AssetEventHistory from '../components/assets/AssetEventHistory';
import LeaseContractCard from '../components/assets/LeaseContractCard';
import LeaseContractDialog from '../components/assets/LeaseContractDialog';
import {
  getActiveLeaseContract,
  createLeaseContract,
  updateLeaseContract,
  LeaseContract,
  CreateLeaseContract,
  UpdateLeaseContract,
} from '../api/leaseContracts.api';

// Helper: check if an asset code has a number >= 9000 (dummy/test asset)
const isDummyAsset = (assetCode: string): boolean => {
  const lastDash = assetCode.lastIndexOf('-');
  if (lastDash < 0) return false;
  const numStr = assetCode.substring(lastDash + 1);
  const num = parseInt(numStr, 10);
  return !isNaN(num) && num >= 9000;
};

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

// Section Header Component - consistent with ScanPage tabs style
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

const SectionHeader = ({ icon, title }: SectionHeaderProps) => (
  <Stack
    direction="row"
    spacing={1.5}
    alignItems="center"
    sx={{
      mb: 2,
      pb: 2,
      borderBottom: '1px solid',
      borderColor: 'divider',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(255, 215, 0, 0.08)'
            : 'rgba(253, 185, 49, 0.08)',
        color: 'primary.main',
        transition: 'all 0.3s ease',
      }}
    >
      {icon}
    </Box>
    <Typography
      variant="h6"
      fontWeight={700}
      sx={{
        color: 'primary.main',
        letterSpacing: '0.02em',
      }}
    >
      {title}
    </Typography>
  </Stack>
);

const AssetDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading, error } = useAsset(Number(id));
  const deleteAsset = useDeleteAsset();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [leaseDialogOpen, setLeaseDialogOpen] = useState(false);
  const [activeLease, setActiveLease] = useState<LeaseContract | null>(null);
  const [isEditingLease, setIsEditingLease] = useState(false);
  const [isLoadingLease, setIsLoadingLease] = useState(false);

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

  // Fetch active lease contract
  useEffect(() => {
    const fetchLease = async () => {
      if (id) {
        setIsLoadingLease(true);
        try {
          const lease = await getActiveLeaseContract(Number(id));
          setActiveLease(lease); // null if no active lease (404)
        } catch (error) {
          // Only logs actual errors (404s are handled gracefully by the API)
          logger.error('Unexpected error fetching lease contract:', error);
          setActiveLease(null);
        } finally {
          setIsLoadingLease(false);
        }
      }
    };
    fetchLease();
  }, [id]);

  const handleAddLease = () => {
    setIsEditingLease(false);
    setLeaseDialogOpen(true);
  };

  const handleEditLease = () => {
    setIsEditingLease(true);
    setLeaseDialogOpen(true);
  };

  const handleSaveLease = async (data: CreateLeaseContract | UpdateLeaseContract) => {
    try {
      if (isEditingLease && activeLease) {
        const updated = await updateLeaseContract(activeLease.id, data as UpdateLeaseContract);
        setActiveLease(updated);
      } else {
        const created = await createLeaseContract(data as CreateLeaseContract);
        setActiveLease(created);
      }
    } catch (error) {
      logger.error('Error saving lease contract:', error);
      throw error;
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
    <Box>
      {/* Back Button - Outside card */}
      <Tooltip title={t('common.backToDashboard', { defaultValue: 'Back to Dashboard' })}>
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

      {/* Header - Scanner style */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
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
              <Tooltip title={t('common.edit')}>
                <IconButton
                  onClick={handleEdit}
                  sx={{
                    ...iconButtonSx,
                    color: 'primary.main',
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('common.delete')}>
                <IconButton
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{
                    ...iconButtonSx,
                    color: 'error.main',
                    '&:hover': {
                      borderColor: 'error.main',
                      boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '0 4px 16px rgba(244, 67, 54, 0.3)'
                          : '0 2px 12px rgba(244, 67, 54, 0.2)',
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Main Information */}
        <Box sx={{ flex: 1 }}>
          {/* Identification */}
          <Card elevation={0} sx={scannerCardSx}>
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

          {/* Assignment Details */}
          <Card elevation={0} sx={scannerCardSx}>
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
                    {t('assetForm.service')}
                  </Typography>
                  <Typography variant="body1">
                    {asset.service ? `${asset.service.code} - ${asset.service.name}` : '-'}
                  </Typography>
                </Box>
                {asset.installationLocation && (
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('assetForm.installationLocation')}
                    </Typography>
                    <Typography variant="body1">{asset.installationLocation}</Typography>
                  </Box>
                )}
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

          {/* Technical Specifications */}
          <Card elevation={0} sx={scannerCardSx}>
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

          {/* Lifecycle Information */}
          <Card elevation={0} sx={scannerCardSx}>
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

          {/* Lease Information */}
          <Card elevation={0} sx={scannerCardSx}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <SectionHeader
                icon={<DescriptionIcon />}
                title={t('lease.sectionTitle')}
              />
              {isLoadingLease ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('common.loading')}
                  </Typography>
                </Box>
              ) : (
                <LeaseContractCard
                  leaseContract={activeLease}
                  onEdit={handleEditLease}
                  onAdd={handleAddLease}
                />
              )}
            </CardContent>
          </Card>

          {/* Event History */}
          <Card elevation={0} sx={scannerCardSx}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <AssetEventHistory assetId={asset.id} />
            </CardContent>
          </Card>
        </Box>

        {/* QR Code Section */}
        <Box sx={{ width: { xs: '100%', md: '350px' } }}>
          <Card
            elevation={0}
            sx={{
              ...scannerCardSx,
              position: { md: 'sticky' },
              top: 16,
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                justifyContent="center"
                sx={{
                  mb: 2,
                  pb: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 215, 0, 0.08)'
                        : 'rgba(253, 185, 49, 0.08)',
                    color: 'primary.main',
                  }}
                >
                  <QrCodeIcon />
                </Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: 'primary.main', letterSpacing: '0.02em' }}
                >
                  QR Code
                </Typography>
              </Stack>

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
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: (theme) =>
                      theme.palette.mode === 'dark'
                        ? '0 4px 16px rgba(255, 215, 0, 0.2)'
                        : '0 2px 12px rgba(253, 185, 49, 0.3)',
                  },
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

              <Typography
                variant="caption"
                display="block"
                sx={{
                  mt: 2,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: 'text.secondary',
                }}
              >
                {asset.assetCode}
              </Typography>

              <Tooltip title={t('printLabel.title')}>
                <IconButton
                  onClick={() => setPrintDialogOpen(true)}
                  sx={{
                    ...iconButtonSx,
                    mt: 3,
                    color: 'primary.main',
                  }}
                >
                  <PrintIcon />
                </IconButton>
              </Tooltip>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        disableRestoreFocus
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

      {/* Print Label Dialog */}
      <PrintLabelDialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        assetCode={asset.assetCode}
        assetName={asset.assetName}
      />

      {/* Lease Contract Dialog */}
      <LeaseContractDialog
        open={leaseDialogOpen}
        onClose={() => setLeaseDialogOpen(false)}
        onSave={handleSaveLease}
        assetId={asset.id}
        leaseContract={activeLease}
        isEdit={isEditingLease}
      />
    </Box>
  );
};

export default AssetDetailPage;
