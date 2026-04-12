import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DevicesIcon from '@mui/icons-material/Devices';
import { useTranslation } from 'react-i18next';
import { useAsset } from '../../hooks/useAssets';
import Loading from '../../components/common/Loading';
import LiveStatusSection from '../../components/intune/LiveStatusSection';
import ConfigurationStatusSection from '../../components/intune/ConfigurationStatusSection';
import ProvisioningTimeline from '../../components/intune/ProvisioningTimeline';
import DeviceTerminal from '../../components/intune/DeviceTerminal';
import { buildRoute } from '../../constants/routes';

// Scanner-style card wrapper - consistent with other pages
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

const AssetIntunePage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading, error } = useAsset(Number(id));

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
          {error instanceof Error ? error.message : t('common.error', 'Failed to load asset')}
        </Alert>
        <IconButton
          onClick={() => navigate('/')}
          sx={{ ...iconButtonSx, mt: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>
    );
  }

  // Check if asset is compatible (Laptop/Desktop with serial number)
  const isCompatible = (asset.category === 'Laptop' || asset.category === 'Desktop') && asset.serialNumber;

  if (!isCompatible) {
    return (
      <Box>
        <Tooltip title={t('common.backToAsset', 'Back to Asset')}>
          <IconButton
            onClick={() => navigate(buildRoute.assetDetail(asset.id))}
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
        <Alert severity="info">
          {t('intune.notCompatible', 'Intune management is only available for Laptops and Desktops with a serial number.')}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Back Button */}
      <Tooltip title={t('common.backToAsset', 'Back to Asset')}>
        <IconButton
          onClick={() => navigate(buildRoute.assetDetail(asset.id))}
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

      {/* Header Card */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(33, 150, 243, 0.15)'
                    : 'rgba(33, 150, 243, 0.1)',
                color: 'info.main',
              }}
            >
              <DevicesIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={700}>
                {t('intune.pageTitle', 'Device Management')}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {asset.assetName}
                </Typography>
                <Typography variant="body2" color="text.disabled">•</Typography>
                <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                  {asset.serialNumber}
                </Typography>
                <Chip
                  label={asset.category}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Live Status Section */}
      <LiveStatusSection
        serialNumber={asset.serialNumber!}
        assetId={asset.id}
      />

      {/* Configuration Profile Status (Certificate/Network diagnostics) */}
      <ConfigurationStatusSection serialNumber={asset.serialNumber!} />

      {/* Provisioning Timeline */}
      <ProvisioningTimeline serialNumber={asset.serialNumber!} />

      {/* Device Terminal */}
      <DeviceTerminal
        serialNumber={asset.serialNumber!}
        deviceName={asset.assetName}
      />
    </Box>
  );
};

export default AssetIntunePage;
