import { Box, Typography, useTheme, CircularProgress, Chip, IconButton, Tooltip } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { getNeumorphColors } from '../../utils/neumorphicStyles';
import { DANGER_COLOR } from '../../constants/filterColors';
import type { DeviceConfigurationStatus, ConfigurationProfileStatus } from '../../types/graph.types';

const AMBER_COLOR = '#FF9800';

interface DeviceCertificatesTabProps {
  data: DeviceConfigurationStatus | undefined;
  loading: boolean;
}

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('nl-BE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const getStatusColor = (status: string): string | undefined => {
  const s = status.toLowerCase();
  if (s === 'failed' || s === 'error') return DANGER_COLOR;
  if (s === 'pending' || s === 'inprogress') return AMBER_COLOR;
  return undefined; // succeeded = no color
};

interface ProfileRowProps {
  profile: ConfigurationProfileStatus;
  isDark: boolean;
  showCertDetails: boolean;
}

const ProfileRow = ({ profile, isDark, showCertDetails }: ProfileRowProps) => {
  const statusColor = getStatusColor(profile.status);

  const handleCopyThumbprint = () => {
    if (profile.thumbprint) {
      navigator.clipboard.writeText(profile.thumbprint);
    }
  };

  return (
    <Box sx={{ py: 0.75, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.76rem',
            color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
            flex: 1,
            minWidth: 120,
          }}
        >
          {profile.displayName}
        </Typography>
        {showCertDetails && profile.certificateStorePath && (
          <Chip
            label={profile.certificateStorePath.toLowerCase().includes('user') ? 'User' : 'Machine'}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 500,
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
            }}
          />
        )}
        <Chip
          label={profile.status}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.62rem',
            fontWeight: 600,
            bgcolor: statusColor ? `${statusColor}18` : 'transparent',
            color: statusColor ?? (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)'),
            border: statusColor ? `1px solid ${statusColor}30` : 'none',
          }}
        />
      </Box>
      {showCertDetails && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25, pl: 0 }}>
          {profile.certificateExpiryDate && (
            <Typography
              variant="caption"
              sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.65rem' }}
            >
              Expires: {formatDate(profile.certificateExpiryDate)}
            </Typography>
          )}
          {profile.thumbprint && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                  fontSize: '0.6rem',
                  fontFamily: 'monospace',
                }}
              >
                {profile.thumbprint.substring(0, 16)}...
              </Typography>
              <Tooltip title="Copy thumbprint">
                <IconButton size="small" onClick={handleCopyThumbprint} sx={{ p: 0.25 }}>
                  <CopyIcon sx={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const DeviceCertificatesTab = ({ data, loading }: DeviceCertificatesTabProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  getNeumorphColors(isDark);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }} />
      </Box>
    );
  }

  if (!data) {
    return (
      <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', py: 2, textAlign: 'center' }}>
        No configuration data available.
      </Typography>
    );
  }

  const certProfiles = data.configurationProfiles.filter((p) => p.isCertificateRelated);
  const allProfiles = data.configurationProfiles;

  return (
    <Box>
      {/* Certificate Profiles */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              fontSize: '0.78rem',
              color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)',
            }}
          >
            Certificate Profiles
          </Typography>
          <Chip
            label={certProfiles.length}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 700,
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
            }}
          />
        </Box>
        {certProfiles.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.75rem', pl: 1 }}
          >
            No certificate profiles found.
          </Typography>
        ) : (
          certProfiles.map((p, i) => (
            <ProfileRow key={p.profileId ?? i} profile={p} isDark={isDark} showCertDetails />
          ))
        )}
      </Box>

      {/* All Configuration Profiles */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              fontSize: '0.78rem',
              color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)',
            }}
          >
            All Configuration Profiles
          </Typography>
          <Chip
            label={allProfiles.length}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 700,
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
            }}
          />
        </Box>
        {allProfiles.map((p, i) => (
          <ProfileRow key={p.profileId ?? i} profile={p} isDark={isDark} showCertDetails={false} />
        ))}
      </Box>
    </Box>
  );
};

export default DeviceCertificatesTab;
