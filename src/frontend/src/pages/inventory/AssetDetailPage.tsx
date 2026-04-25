import React, { useEffect, useState } from 'react';
import { logger } from '../../utils/logger';
import { useParams, useNavigate } from 'react-router-dom';
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
import AppsIcon from '@mui/icons-material/Apps';
import PlaceIcon from '@mui/icons-material/Place';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { QRCodeSVG } from 'qrcode.react';
import PrintIcon from '@mui/icons-material/Print';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAsset, useDeleteAsset } from '../../hooks/useAssets';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';
import PrintLabelDialog from '../../components/print/PrintLabelDialog';
import AssetEventHistory from '../../components/inventory/AssetEventHistory';
import DevicesIcon from '@mui/icons-material/Devices';
import { buildRoute } from '../../constants/routes';
import { AssetStatus, LocationChainKind } from '../../types/asset.types';
import AssetLocationChain from '../../components/inventory/AssetLocationChain';
import AssignEmployeeDialog from '../../components/inventory/dialogs/AssignEmployeeDialog';
import AssignWorkplaceDialog from '../../components/inventory/dialogs/AssignWorkplaceDialog';
import UnassignDialog from '../../components/inventory/dialogs/UnassignDialog';
import StatusTransitionDialog from '../../components/inventory/dialogs/StatusTransitionDialog';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isDummyAsset = (assetCode: string): boolean => {
  const lastDash = assetCode.lastIndexOf('-');
  if (lastDash < 0) return false;
  const numStr = assetCode.substring(lastDash + 1);
  const num = parseInt(numStr, 10);
  return !isNaN(num) && num >= 9000;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  color?: string;
}

const SectionHeader = ({ icon, title, color }: SectionHeaderProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accentColor = color || theme.palette.primary.main;

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
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
          borderColor: alpha(accentColor, 0.3),
          bgcolor: alpha(accentColor, isDark ? 0.1 : 0.07),
          color: accentColor,
          transition: 'all 0.3s ease',
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{ color: accentColor, letterSpacing: '0.02em' }}
      >
        {title}
      </Typography>
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const AssetDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const { data: asset, isLoading, error } = useAsset(Number(id));
  const deleteAsset = useDeleteAsset();

  // Dialog open state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [assignEmployeeOpen, setAssignEmployeeOpen] = useState(false);
  const [assignWorkplaceOpen, setAssignWorkplaceOpen] = useState(false);
  const [unassignOpen, setUnassignOpen] = useState(false);
  const [statusTransitionOpen, setStatusTransitionOpen] = useState(false);

  // Post-creation guided callout — read and clear sessionStorage on first render
  // Use a ref so we only consume the key once per mount regardless of re-renders.
  const calloutConsumedRef = React.useRef(false);
  const [showCreatedCallout, setShowCreatedCallout] = useState(false);
  const [createdCalloutCode, setCreatedCalloutCode] = useState('');

  // Consume the sessionStorage flag once the asset is loaded
  useEffect(() => {
    if (!id || !asset || calloutConsumedRef.current) return;
    calloutConsumedRef.current = true;

    const key = `asset-just-created-${id}`;
    const raw = sessionStorage.getItem(key);
    if (!raw || asset.status !== AssetStatus.Nieuw) return;

    sessionStorage.removeItem(key);

    let code = asset.assetCode;
    try {
      const parsed = JSON.parse(raw) as { at: string; assetCode: string };
      code = parsed.assetCode || asset.assetCode;
    } catch {
      // use default code
    }

    // Schedule in next microtask to satisfy the lint rule about
    // not calling setState synchronously inside an effect body.
    Promise.resolve().then(() => {
      setCreatedCalloutCode(code);
      setShowCreatedCallout(true);
    });
  }, [id, asset]);

  const handleEdit = () => navigate(`/inventory/assets/${id}/edit`);

  const handleDelete = async () => {
    try {
      await deleteAsset.mutateAsync(Number(id));
      navigate('/');
    } catch (err) {
      logger.error('Error deleting asset:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('common.none', 'Geen');
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  // Determine if asset is currently assigned (either employee or workplace)
  const isAssigned =
    asset &&
    (asset.effectiveLocation?.kind === LocationChainKind.Employee ||
      asset.effectiveLocation?.kind === LocationChainKind.Workplace ||
      asset.employee ||
      asset.physicalWorkplace);

  // Card shared styles
  const cardSx = {
    mb: 3,
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    overflow: 'hidden',
    bgcolor: bgSurface,
    boxShadow: getNeumorph(isDark, 'soft'),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      borderColor: alpha('#FF7700', 0.3),
      boxShadow: isDark
        ? `0 8px 32px ${alpha('#FF7700', 0.12)}, inset 0 0 24px ${alpha('#FF7700', 0.03)}`
        : `0 4px 20px ${alpha('#FF7700', 0.18)}`,
    },
  };

  const iconButtonSx = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      borderColor: 'primary.main',
      boxShadow: isDark
        ? '0 4px 16px rgba(255, 215, 0, 0.2)'
        : '0 2px 12px rgba(253, 185, 49, 0.3)',
    },
  };

  // ----- Loading / error states -----
  if (isLoading) return <Loading />;

  if (error || !asset) {
    return (
      <Box>
        <Alert severity="error" sx={{ border: '1px solid', borderColor: 'error.main', fontWeight: 600 }}>
          {error instanceof Error ? error.message : t('assetDetail.notFound', 'Activa niet gevonden')}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mt: 2 }}>
          {t('common.backToDashboard', 'Terug naar Dashboard')}
        </Button>
      </Box>
    );
  }

  // ----- Status-driven CTA helpers -----
  const renderLocationCTAs = () => {
    switch (asset.status) {
      case AssetStatus.Nieuw:
        return null; // Handled inside AssetLocationChain empty state

      case AssetStatus.InGebruik:
        return (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LinkOffIcon />}
              onClick={() => setUnassignOpen(true)}
              sx={{ borderColor: 'divider', color: 'text.secondary', fontWeight: 600,
                '&:hover': { borderColor: '#FF7700', color: '#FF7700' } }}
            >
              {t('assetDetail.cta.unassign', 'Uittoewijzen')}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SwapHorizIcon />}
              onClick={() => setStatusTransitionOpen(true)}
              sx={{ borderColor: 'divider', color: 'text.secondary', fontWeight: 600,
                '&:hover': { borderColor: '#FF7700', color: '#FF7700' } }}
            >
              {t('assetDetail.cta.changeStatus', 'Status wijzigen')}
            </Button>
          </Box>
        );

      case AssetStatus.Stock:
        return (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlaceIcon />}
              onClick={() => setAssignWorkplaceOpen(true)}
              sx={{ bgcolor: '#FF7700', color: '#fff', fontWeight: 600, '&:hover': { bgcolor: '#E66A00' } }}
            >
              {t('assetLocationChain.assignToWorkplace', 'Toewijzen aan werkplek')}
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonIcon />}
              onClick={() => setAssignEmployeeOpen(true)}
              sx={{ bgcolor: '#7b1fa2', color: '#fff', fontWeight: 600,
                '&:hover': { bgcolor: alpha('#7b1fa2', 0.85) } }}
            >
              {t('assetLocationChain.assignToEmployee', 'Toewijzen aan medewerker')}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SwapHorizIcon />}
              onClick={() => setStatusTransitionOpen(true)}
              sx={{ borderColor: 'divider', color: 'text.secondary', fontWeight: 600,
                '&:hover': { borderColor: '#FF7700', color: '#FF7700' } }}
            >
              {t('assetDetail.cta.changeStatus', 'Status wijzigen')}
            </Button>
          </Box>
        );

      case AssetStatus.Herstelling:
      case AssetStatus.Defect:
      case AssetStatus.UitDienst:
        return (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SwapHorizIcon />}
              onClick={() => setStatusTransitionOpen(true)}
              sx={{ borderColor: 'divider', color: 'text.secondary', fontWeight: 600,
                '&:hover': { borderColor: '#FF7700', color: '#FF7700' } }}
            >
              {t('assetDetail.cta.changeStatus', 'Status wijzigen')}
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Back button */}
      <Tooltip title={t('common.backToDashboard', 'Terug naar Dashboard')}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{ ...iconButtonSx, mb: 2, color: 'text.secondary', '&:hover': { ...iconButtonSx['&:hover'], color: 'primary.main' } }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      {/* Post-creation guided callout */}
      {showCreatedCallout && (
        <Alert
          severity="success"
          icon={<CheckCircleOutlineIcon />}
          onClose={() => setShowCreatedCallout(false)}
          sx={{
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha('#4CAF50', 0.4),
            bgcolor: alpha('#4CAF50', isDark ? 0.1 : 0.06),
            '& .MuiAlert-message': { width: '100%' },
          }}
        >
          <Typography variant="body2" fontWeight={700} mb={0.5}>
            {t('assetDetail.createdCallout.title', {
              code: createdCalloutCode,
              defaultValue: `Activa aangemaakt (${createdCalloutCode}).`,
            })}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            {t(
              'assetDetail.createdCallout.desc',
              'Volgende stap: koppel aan een werkplek of medewerker om in gebruik te nemen.',
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlaceIcon />}
              onClick={() => { setShowCreatedCallout(false); setAssignWorkplaceOpen(true); }}
              sx={{ bgcolor: '#FF7700', color: '#fff', fontWeight: 600, '&:hover': { bgcolor: '#E66A00' } }}
            >
              {t('assetLocationChain.assignToWorkplace', 'Toewijzen aan werkplek')}
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonIcon />}
              onClick={() => { setShowCreatedCallout(false); setAssignEmployeeOpen(true); }}
              sx={{ bgcolor: '#7b1fa2', color: '#fff', fontWeight: 600,
                '&:hover': { bgcolor: alpha('#7b1fa2', 0.85) } }}
            >
              {t('assetLocationChain.assignToEmployee', 'Toewijzen aan medewerker')}
            </Button>
          </Box>
        </Alert>
      )}

      {/* Header card */}
      <Card elevation={0} sx={cardSx}>
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
                  <Chip icon={<ScienceIcon />} label={t('assetForm.dummyAsset')} color="warning" variant="outlined" size="small" />
                )}
              </Box>
            </Box>

            {/* Header action icons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(asset.category === 'Laptop' || asset.category === 'Desktop') && (
                <Tooltip title={t('common.actions') + ' — Software'}>
                  <IconButton onClick={() => navigate(buildRoute.assetSoftware(asset.id))} sx={{ ...iconButtonSx, color: 'info.main' }}>
                    <AppsIcon />
                  </IconButton>
                </Tooltip>
              )}
              {(asset.category === 'Laptop' || asset.category === 'Desktop') && asset.serialNumber && (
                <Tooltip title={t('intune.pageTitle', 'Device Management')}>
                  <IconButton onClick={() => navigate(buildRoute.assetIntune(asset.id))} sx={{ ...iconButtonSx, color: 'success.main' }}>
                    <DevicesIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={t('common.edit')}>
                <IconButton onClick={handleEdit} sx={{ ...iconButtonSx, color: 'primary.main' }}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('common.delete')}>
                <IconButton onClick={() => setDeleteDialogOpen(true)} sx={{ ...iconButtonSx, color: 'error.main' }}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* ===== Left column: main content ===== */}
        <Box sx={{ flex: 1 }}>

          {/* Location & Assignment panel (status-adaptive) */}
          <Card elevation={0} sx={cardSx}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <SectionHeader
                icon={<PlaceIcon />}
                title={t('assetDetail.locationSection', 'Locatie & Toewijzing')}
                color="#FF7700"
              />
              <AssetLocationChain
                asset={asset}
                variant="full"
                onAssignWorkplace={
                  !isAssigned || asset.status === AssetStatus.Stock
                    ? () => setAssignWorkplaceOpen(true)
                    : undefined
                }
                onAssignEmployee={
                  !isAssigned || asset.status === AssetStatus.Stock
                    ? () => setAssignEmployeeOpen(true)
                    : undefined
                }
                onChangeAssignment={
                  isAssigned ? () => setUnassignOpen(true) : undefined
                }
              />
              {renderLocationCTAs()}
            </CardContent>
          </Card>

          {/* Identification */}
          <Card elevation={0} sx={cardSx}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <SectionHeader icon={<QrCodeIcon />} title={t('assetForm.identificationSection')} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="caption" color="text.secondary">{t('assetDetail.assetCode')}</Typography>
                  <Typography variant="body1" fontWeight="bold">{asset.assetCode}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="caption" color="text.secondary">{t('assetDetail.category')}</Typography>
                  <Typography variant="body1">{asset.category}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="caption" color="text.secondary">{t('assetForm.assetNameDevice')}</Typography>
                  <Typography variant="body1">{asset.assetName}</Typography>
                </Box>
                {asset.alias && (
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="caption" color="text.secondary">{t('assetForm.alias')}</Typography>
                    <Typography variant="body1">{asset.alias}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card elevation={0} sx={cardSx}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <SectionHeader icon={<ComputerIcon />} title={t('assetForm.technicalSection')} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">{t('assetDetail.brand')}</Typography>
                  <Typography variant="body1">{asset.brand || '-'}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">{t('assetDetail.model')}</Typography>
                  <Typography variant="body1">{asset.model || '-'}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">{t('assetDetail.serialNumber')}</Typography>
                  <Typography variant="body1">{asset.serialNumber || '-'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Lifecycle */}
          <Card elevation={0} sx={cardSx}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <SectionHeader icon={<CalendarMonthIcon />} title={t('assetForm.lifecycleSection')} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">{t('assetDetail.purchaseDate')}</Typography>
                  <Typography variant="body1">{formatDate(asset.purchaseDate)}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">{t('assetDetail.warrantyExpiry')}</Typography>
                  <Typography variant="body1">{formatDate(asset.warrantyExpiry)}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">{t('assetDetail.installationDate')}</Typography>
                  <Typography variant="body1">{formatDate(asset.installationDate)}</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('assetDetail.created', 'Aangemaakt')}
                  </Typography>
                  <Typography variant="body2">{formatDate(asset.createdAt)}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('assetDetail.lastUpdated', 'Laatste wijziging')}
                  </Typography>
                  <Typography variant="body2">{formatDate(asset.updatedAt)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Event history */}
          <Card elevation={0} sx={cardSx}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <AssetEventHistory assetId={asset.id} />
            </CardContent>
          </Card>
        </Box>

        {/* ===== Right column: QR code (sticky) ===== */}
        <Box sx={{ width: { xs: '100%', md: '320px' } }}>
          <Card elevation={0} sx={{ ...cardSx, position: { md: 'sticky' }, top: 16 }}>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <SectionHeader icon={<QrCodeIcon />} title="QR Code" />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('assetDetail.qrScanHint', 'Scan om dit asset snel op te zoeken')}
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
                    boxShadow: isDark ? '0 4px 16px rgba(255, 215, 0, 0.2)' : '0 2px 12px rgba(253, 185, 49, 0.3)',
                  },
                }}
              >
                <QRCodeSVG
                  id="asset-qr-code"
                  value={asset.assetCode}
                  size={180}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </Box>

              <Typography
                variant="caption"
                display="block"
                sx={{ mt: 2, fontFamily: 'monospace', fontWeight: 600, color: 'text.secondary' }}
              >
                {asset.assetCode}
              </Typography>

              <Tooltip title={t('printLabel.title')}>
                <IconButton
                  onClick={() => setPrintDialogOpen(true)}
                  sx={{ ...iconButtonSx, mt: 3, color: 'primary.main' }}
                >
                  <PrintIcon />
                </IconButton>
              </Tooltip>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* ===== Dialogs ===== */}

      {/* Delete */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} disableRestoreFocus>
        <DialogTitle>{t('assetDetail.deleteAsset')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('assetDetail.deleteConfirm', {
              name: asset.assetName,
              code: asset.assetCode,
              defaultValue: `Weet u zeker dat u ${asset.assetName} (${asset.assetCode}) wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={() => { setDeleteDialogOpen(false); handleDelete(); }} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print */}
      <PrintLabelDialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        assetCode={asset.assetCode}
        assetName={asset.assetName}
      />

      {/* Assign to employee */}
      <AssignEmployeeDialog
        open={assignEmployeeOpen}
        onClose={() => setAssignEmployeeOpen(false)}
        asset={asset}
      />

      {/* Assign to workplace */}
      <AssignWorkplaceDialog
        open={assignWorkplaceOpen}
        onClose={() => setAssignWorkplaceOpen(false)}
        asset={asset}
      />

      {/* Unassign */}
      <UnassignDialog
        open={unassignOpen}
        onClose={() => setUnassignOpen(false)}
        asset={asset}
      />

      {/* Status transition */}
      <StatusTransitionDialog
        open={statusTransitionOpen}
        onClose={() => setStatusTransitionOpen(false)}
        asset={asset}
      />
    </Box>
  );
};

export default AssetDetailPage;
