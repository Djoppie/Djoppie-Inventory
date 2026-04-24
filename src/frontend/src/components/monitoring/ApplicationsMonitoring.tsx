/**
 * ApplicationsMonitoring
 *
 * Read-only monitoring of Entra ID app registration credentials (client secrets
 * and certificates). Highlights expired and soon-to-expire credentials and
 * provides a copy-to-clipboard action for the Application (Client) ID.
 */

import { useMemo, useState, type ReactElement } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import BadgeIcon from '@mui/icons-material/Badge';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import { useAppCredentials } from '../../hooks/useClientSecrets';
import type { AppCredential, CredentialStatus } from '../../types/clientSecret.types';

type StatusFilter = 'All' | CredentialStatus;

interface StatusVisual {
  label: string;
  bg: string;
  bgDark: string;
  fg: string;
  border: string;
  glow: string;
  icon: ReactElement;
  pulse: boolean;
}

const STATUS_VISUALS: Record<CredentialStatus, StatusVisual> = {
  Valid: {
    label: 'Geldig',
    bg: '#E8F5E9',
    bgDark: 'rgba(76, 175, 80, 0.18)',
    fg: '#2E7D32',
    border: '#66BB6A',
    glow: 'rgba(76, 175, 80, 0.35)',
    icon: <CheckCircleRoundedIcon sx={{ fontSize: '0.95rem !important' }} />,
    pulse: false,
  },
  Expiring: {
    label: 'Bijna verlopen',
    bg: '#FFF3E0',
    bgDark: 'rgba(255, 152, 0, 0.22)',
    fg: '#E65100',
    border: '#FB8C00',
    glow: 'rgba(255, 152, 0, 0.45)',
    icon: <WarningAmberRoundedIcon sx={{ fontSize: '0.95rem !important' }} />,
    pulse: false,
  },
  Expired: {
    label: 'Verlopen',
    bg: '#FFEBEE',
    bgDark: 'rgba(244, 67, 54, 0.22)',
    fg: '#C62828',
    border: '#E53935',
    glow: 'rgba(244, 67, 54, 0.55)',
    icon: <ErrorRoundedIcon sx={{ fontSize: '0.95rem !important' }} />,
    pulse: true,
  },
};

const formatDate = (iso?: string | null): string => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('nl-BE');
  } catch {
    return iso;
  }
};

const ApplicationsMonitoring = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data, isLoading, error, refetch, isFetching } = useAppCredentials();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const counts = useMemo(() => {
    const base = { All: 0, Valid: 0, Expiring: 0, Expired: 0 };
    (data ?? []).forEach((c) => {
      base.All += 1;
      base[c.status] += 1;
    });
    return base;
  }, [data]);

  const filtered = useMemo<AppCredential[]>(() => {
    let rows = data ?? [];
    if (statusFilter !== 'All') {
      rows = rows.filter((c) => c.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          c.appId.toLowerCase().includes(q) ||
          (c.credentialDisplayName ?? '').toLowerCase().includes(q),
      );
    }
    return [...rows].sort((a, b) => {
      const aDays = a.daysUntilExpiry ?? Number.MAX_SAFE_INTEGER;
      const bDays = b.daysUntilExpiry ?? Number.MAX_SAFE_INTEGER;
      return aDays - bDays;
    });
  }, [data, search, statusFilter]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* best-effort */
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <IconButton color="inherit" size="small" onClick={() => refetch()}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        }
      >
        Kan app registration credentials niet laden. Controleer of de backend API-permissie
        <code style={{ margin: '0 4px' }}>Application.Read.All</code>
        heeft en dat admin consent is verleend.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: { xs: 0.5, md: 1 } }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Entra ID App Registration Credentials
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {counts.All} credentials · {counts.Expiring} bijna verlopen · {counts.Expired} verlopen
        </Typography>
        <Tooltip title="Vernieuwen">
          <span>
            <IconButton size="small" onClick={() => refetch()} disabled={isFetching}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Zoek op applicatie, client ID of naam..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, maxWidth: { sm: 360 } }}
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={statusFilter}
          onChange={(_e, val) => val && setStatusFilter(val)}
          sx={{
            '& .MuiToggleButton-root': {
              fontWeight: 600,
              fontSize: '0.72rem',
              textTransform: 'none',
              letterSpacing: '0.01em',
              gap: 0.5,
              px: 1.25,
              '& svg': { fontSize: '0.95rem' },
            },
          }}
        >
          <ToggleButton value="All">Alle ({counts.All})</ToggleButton>
          <ToggleButton
            value="Valid"
            sx={{
              '&.Mui-selected': {
                color: STATUS_VISUALS.Valid.fg,
                bgcolor: alpha(STATUS_VISUALS.Valid.border, 0.18),
                '&:hover': { bgcolor: alpha(STATUS_VISUALS.Valid.border, 0.28) },
              },
            }}
          >
            {STATUS_VISUALS.Valid.icon}
            Geldig ({counts.Valid})
          </ToggleButton>
          <ToggleButton
            value="Expiring"
            sx={{
              '&.Mui-selected': {
                color: STATUS_VISUALS.Expiring.fg,
                bgcolor: alpha(STATUS_VISUALS.Expiring.border, 0.2),
                '&:hover': { bgcolor: alpha(STATUS_VISUALS.Expiring.border, 0.3) },
              },
            }}
          >
            {STATUS_VISUALS.Expiring.icon}
            Bijna verlopen ({counts.Expiring})
          </ToggleButton>
          <ToggleButton
            value="Expired"
            sx={{
              '&.Mui-selected': {
                color: STATUS_VISUALS.Expired.fg,
                bgcolor: alpha(STATUS_VISUALS.Expired.border, 0.22),
                '&:hover': { bgcolor: alpha(STATUS_VISUALS.Expired.border, 0.32) },
              },
            }}
          >
            {STATUS_VISUALS.Expired.icon}
            Verlopen ({counts.Expired})
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {counts.Expired > 0 && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          Er {counts.Expired === 1 ? 'is' : 'zijn'} {counts.Expired} verlopen credential
          {counts.Expired === 1 ? '' : 's'} — rotatie vereist.
        </Alert>
      )}
      {counts.Expiring > 0 && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          {counts.Expiring} credential{counts.Expiring === 1 ? '' : 's'} verloop
          {counts.Expiring === 1 ? 't' : 'en'} binnen 30 dagen.
        </Alert>
      )}

      <TableContainer
        component={Paper}
        sx={{
          bgcolor: alpha(theme.palette.background.paper, isDark ? 0.4 : 0.9),
          border: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.08)}`,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Applicatie</TableCell>
              <TableCell>Client ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Naam</TableCell>
              <TableCell>Startdatum</TableCell>
              <TableCell>Vervaldatum</TableCell>
              <TableCell align="right">Dagen</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    Geen credentials gevonden met de huidige filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={`${c.objectId}-${c.keyId ?? c.credentialType}`} hover>
                <TableCell>{c.displayName || '-'}</TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography
                      variant="body2"
                      component="code"
                      sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                    >
                      {c.appId}
                    </Typography>
                    <Tooltip title="Kopieer Client ID">
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(c.appId)}
                        aria-label="copy client id"
                      >
                        <ContentCopyIcon sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    variant="outlined"
                    icon={c.credentialType === 'Secret' ? <VpnKeyIcon /> : <BadgeIcon />}
                    label={c.credentialType === 'Secret' ? 'Secret' : 'Certificaat'}
                  />
                </TableCell>
                <TableCell>{c.credentialDisplayName || '-'}</TableCell>
                <TableCell>{formatDate(c.startDateTime)}</TableCell>
                <TableCell>{formatDate(c.endDateTime)}</TableCell>
                <TableCell align="right">
                  {c.daysUntilExpiry === null || c.daysUntilExpiry === undefined ? (
                    '-'
                  ) : (
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color: STATUS_VISUALS[c.status].fg,
                      }}
                    >
                      {c.daysUntilExpiry}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {(() => {
                    const v = STATUS_VISUALS[c.status];
                    return (
                      <Chip
                        size="small"
                        icon={v.icon}
                        label={v.label}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          letterSpacing: '0.02em',
                          height: 24,
                          px: 0.5,
                          borderRadius: '12px',
                          color: isDark ? '#fff' : v.fg,
                          bgcolor: isDark ? v.bgDark : v.bg,
                          border: `1px solid ${alpha(v.border, isDark ? 0.6 : 0.8)}`,
                          boxShadow: `0 0 0 0 ${v.glow}, 0 2px 6px -2px ${v.glow}`,
                          '& .MuiChip-icon': {
                            color: isDark ? v.border : v.fg,
                            ml: '4px',
                            mr: '-2px',
                          },
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: `0 0 0 2px ${alpha(v.border, 0.25)}, 0 4px 10px -2px ${v.glow}`,
                          },
                          ...(v.pulse && {
                            animation: 'chipPulse 2.4s ease-in-out infinite',
                            '@keyframes chipPulse': {
                              '0%, 100%': {
                                boxShadow: `0 0 0 0 ${v.glow}, 0 2px 6px -2px ${v.glow}`,
                              },
                              '50%': {
                                boxShadow: `0 0 0 4px ${alpha(v.border, 0)}, 0 2px 12px -1px ${v.glow}`,
                              },
                            },
                          }),
                        }}
                      />
                    );
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ApplicationsMonitoring;
