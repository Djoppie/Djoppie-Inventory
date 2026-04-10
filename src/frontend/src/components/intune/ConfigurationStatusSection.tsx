import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Collapse,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ErrorIcon from '@mui/icons-material/Error';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PersonIcon from '@mui/icons-material/Person';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { intuneApi } from '../../api/intune.api';
import type { ConfigurationProfileStatus } from '../../types/graph.types';

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

interface ConfigurationStatusSectionProps {
  serialNumber: string;
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'succeeded':
    case 'compliant':
      return <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />;
    case 'failed':
      return <CancelIcon sx={{ fontSize: 18, color: 'error.main' }} />;
    case 'error':
      return <ErrorIcon sx={{ fontSize: 18, color: 'error.main' }} />;
    case 'pending':
      return <CircularProgress size={16} />;
    case 'conflict':
      return <WarningAmberIcon sx={{ fontSize: 18, color: 'warning.main' }} />;
    case 'notapplicable':
      return <HelpOutlineIcon sx={{ fontSize: 18, color: 'text.disabled' }} />;
    default:
      return <HelpOutlineIcon sx={{ fontSize: 18, color: 'text.disabled' }} />;
  }
};

const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' | 'info' => {
  switch (status.toLowerCase()) {
    case 'succeeded':
    case 'compliant':
      return 'success';
    case 'failed':
    case 'error':
      return 'error';
    case 'conflict':
      return 'warning';
    case 'pending':
      return 'info';
    default:
      return 'default';
  }
};

const ConfigurationStatusSection = ({ serialNumber }: ConfigurationStatusSectionProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [showAllProfiles, setShowAllProfiles] = useState(false);

  const {
    data: configStatus,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['deviceConfigurationStatus', serialNumber],
    queryFn: () => intuneApi.getDeviceConfigurationStatusBySerial(serialNumber),
    enabled: !!serialNumber,
    staleTime: 60_000,
    retry: 1,
  });

  const certProfiles = configStatus?.configurationProfiles.filter(p => p.isCertificateRelated) ?? [];
  const otherProfiles = configStatus?.configurationProfiles.filter(p => !p.isCertificateRelated) ?? [];
  const displayProfiles = showAllProfiles
    ? configStatus?.configurationProfiles ?? []
    : certProfiles;

  const renderProfileRow = (profile: ConfigurationProfileStatus, index: number) => (
    <TableRow
      key={profile.profileId ?? index}
      sx={{
        bgcolor: profile.isCertificateRelated
          ? (theme) => theme.palette.mode === 'dark'
            ? 'rgba(255, 152, 0, 0.08)'
            : 'rgba(255, 152, 0, 0.04)'
          : undefined,
        '&:last-child td': { borderBottom: 0 },
      }}
    >
      <TableCell sx={{ py: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {profile.isCertificateRelated && (
            <VpnKeyIcon sx={{ fontSize: 16, color: 'warning.main' }} />
          )}
          <Typography variant="body2" fontWeight={profile.isCertificateRelated ? 600 : 400}>
            {profile.displayName}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell sx={{ py: 1.5 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {getStatusIcon(profile.status)}
          <Chip
            label={profile.status}
            size="small"
            color={getStatusColor(profile.status)}
            variant="outlined"
            sx={{ fontWeight: 500, fontSize: '0.75rem' }}
          />
        </Stack>
      </TableCell>
      <TableCell sx={{ py: 1.5 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" fontFamily="monospace" fontSize="0.8rem">
            {profile.userPrincipalName ?? '-'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell sx={{ py: 1.5 }}>
        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
          {profile.lastReportedDateTime
            ? format(new Date(profile.lastReportedDateTime), 'dd/MM/yyyy HH:mm')
            : '-'}
        </Typography>
      </TableCell>
    </TableRow>
  );

  return (
    <Card elevation={0} sx={scannerCardSx}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: (theme) =>
                  configStatus?.hasCertificateIssues
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(244, 67, 54, 0.15)'
                      : 'rgba(244, 67, 54, 0.1)'
                    : theme.palette.mode === 'dark'
                      ? 'rgba(76, 175, 80, 0.15)'
                      : 'rgba(76, 175, 80, 0.1)',
                color: configStatus?.hasCertificateIssues ? 'error.main' : 'success.main',
              }}
            >
              <SecurityIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {t('intune.configStatus', 'Configuration Profiles')}
              </Typography>
              {configStatus && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                  <Typography variant="caption" color="text.secondary">
                    Primary user:
                  </Typography>
                  <Typography variant="caption" fontWeight={600} fontFamily="monospace">
                    {configStatus.primaryUserUpn ?? 'N/A'}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {configStatus && (
              <>
                <Chip
                  label={`${configStatus.summary.succeeded} OK`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                {configStatus.summary.failed > 0 && (
                  <Chip
                    label={`${configStatus.summary.failed} Failed`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                )}
                {configStatus.summary.error > 0 && (
                  <Chip
                    label={`${configStatus.summary.error} Error`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                )}
              </>
            )}
            <Tooltip title={t('common.refresh', 'Refresh')}>
              <IconButton
                onClick={() => refetch()}
                disabled={isFetching}
                size="small"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                }}
              >
                <RefreshIcon sx={{ fontSize: 18, animation: isFetching ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Tooltip>
            <IconButton onClick={() => setExpanded(!expanded)} size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Stack>
        </Stack>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t('intune.configStatusError', 'Failed to load configuration profile statuses. Ensure the backend has DeviceManagementConfiguration.Read.All permission.')}
              </Alert>
            )}

            {configStatus && (
              <>
                {/* Certificate Issue Warning */}
                {configStatus.hasCertificateIssues && (
                  <Alert
                    severity="warning"
                    icon={<WarningAmberIcon />}
                    sx={{
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'warning.main',
                      '& .MuiAlert-message': { fontWeight: 500 },
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      {t('intune.certIssueTitle', 'Certificate Profile Issue Detected')}
                    </Typography>
                    <Typography variant="body2">
                      {t('intune.certIssueDesc', 'One or more certificate-related profiles have failed or are not applicable. This may cause network connectivity issues (802.1x). This typically happens when the primary user changes but the certificate profile is not re-deployed for the new user.')}
                    </Typography>
                  </Alert>
                )}

                {/* No cert profiles info */}
                {!configStatus.hasCertificateProfiles && configStatus.configurationProfiles.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t('intune.noCertProfiles', 'No certificate-related profiles detected on this device. Certificate profiles are identified by name patterns (SCEP, PKCS, Wi-Fi, 802.1x, etc.).')}
                  </Alert>
                )}

                {/* Certificate Profiles Table */}
                {certProfiles.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                      {t('intune.certProfiles', 'Certificate & Network Profiles')}
                      <Chip label={certProfiles.length} size="small" sx={{ ml: 1 }} />
                    </Typography>
                  </Box>
                )}

                {/* Profiles Table */}
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          {t('intune.profileName', 'Profile')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', width: 140 }}>
                          {t('common.status', 'Status')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', width: 220 }}>
                          {t('intune.targetUser', 'Target User')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', width: 150 }}>
                          {t('intune.lastReported', 'Last Reported')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayProfiles.map((profile, idx) => renderProfileRow(profile, idx))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Toggle all profiles */}
                {otherProfiles.length > 0 && (
                  <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
                    <Chip
                      label={showAllProfiles
                        ? t('intune.showCertOnly', 'Show certificate profiles only')
                        : t('intune.showAllProfiles', `Show all profiles (${configStatus.configurationProfiles.length})`)}
                      size="small"
                      variant="outlined"
                      onClick={() => setShowAllProfiles(!showAllProfiles)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>
                )}

                {/* Summary footer */}
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {t('intune.totalProfiles', 'Total')}: {configStatus.summary.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('intune.retrievedAt', 'Retrieved')}:{' '}
                    {format(new Date(configStatus.retrievedAt), 'HH:mm:ss')}
                  </Typography>
                  {configStatus.lastSyncDateTime && (
                    <Typography variant="caption" color="text.secondary">
                      {t('intune.lastSync', 'Last Intune sync')}:{' '}
                      {format(new Date(configStatus.lastSyncDateTime), 'dd/MM/yyyy HH:mm')}
                    </Typography>
                  )}
                </Stack>
              </>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ConfigurationStatusSection;
