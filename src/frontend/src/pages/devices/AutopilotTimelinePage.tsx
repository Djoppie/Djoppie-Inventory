import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Stack,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useTranslation } from 'react-i18next';
import ProvisioningTimeline from '../../components/devices/intune/ProvisioningTimeline';
import { ROUTES } from '../../constants/routes';

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

const AutopilotTimelinePage = () => {
  const { t } = useTranslation();
  const { serialNumber } = useParams<{ serialNumber: string }>();
  const navigate = useNavigate();

  if (!serialNumber) {
    return (
      <Box>
        <Typography color="error">
          {t('autopilot.noSerialNumber', 'No serial number provided')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Back Button */}
      <Tooltip title={t('autopilot.backToList', 'Back to Autopilot Devices')}>
        <IconButton
          onClick={() => navigate(ROUTES.AUTOPILOT_DEVICES)}
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
              <TimelineIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={700}>
                {t('autopilot.timelineTitle', 'Provisioning Timeline')}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('autopilot.serialNumber', 'Serial Number')}:
                </Typography>
                <Chip
                  label={serialNumber}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                />
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Provisioning Timeline Component */}
      <ProvisioningTimeline serialNumber={serialNumber} />
    </Box>
  );
};

export default AutopilotTimelinePage;
