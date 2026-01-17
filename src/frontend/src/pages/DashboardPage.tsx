import { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  Chip,
  keyframes,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAssets } from '../hooks/useAssets';
import AssetList from '../components/assets/AssetList';
import Loading from '../components/common/Loading';
import ApiErrorDisplay from '../components/common/ApiErrorDisplay';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';

// Terminal cursor blink animation
const cursorBlink = keyframes`
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
`;

// Subtle glow pulse for the header
const headerGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.2), inset 0 0 10px rgba(255, 215, 0, 0.05);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 15px rgba(255, 215, 0, 0.1);
  }
`;

const DashboardPage = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: assets, isLoading, error, refetch } = useAssets(statusFilter);

  const handleFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  if (isLoading) return <Loading message="[LOAD] Loading asset inventory..." />;

  if (error) {
    // Check if it's a network error (API not running)
    const isNetworkError = error instanceof Error &&
      (error.message.includes('Network Error') ||
       error.message.includes('ERR_CONNECTION_REFUSED') ||
       error.message.includes('fetch'));

    if (isNetworkError) {
      return <ApiErrorDisplay onRetry={() => refetch()} />;
    }

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error">
          {t('dashboard.errorLoading')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error instanceof Error ? error.message : t('errors.unexpectedError')}
        </Typography>
      </Box>
    );
  }

  const assetCount = assets?.length || 0;
  const activeCount = assets?.filter(a => a.status === 'Active').length || 0;
  const maintenanceCount = assets?.filter(a => a.status === 'Maintenance').length || 0;

  return (
    <Box>
      {/* Terminal-style Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          animation: `${headerGlow} 3s ease-in-out infinite`,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, transparent 100%)'
              : 'linear-gradient(135deg, rgba(253, 185, 49, 0.05) 0%, transparent 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {/* Console prompt */}
          <Typography
            component="span"
            sx={{
              color: 'success.main',
              fontWeight: 700,
              fontSize: '1.5rem',
            }}
          >
            $
          </Typography>

          {/* Dashboard icon */}
          <DashboardIcon
            sx={{
              color: 'primary.main',
              fontSize: '2rem',
              filter: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))'
                  : 'none',
            }}
          />

          {/* Title */}
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            {t('dashboard.title')}
          </Typography>

          {/* Blinking cursor */}
          <Typography
            component="span"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '1.5rem',
              animation: `${cursorBlink} 1.5s infinite`,
            }}
          >
            _
          </Typography>
        </Box>

        {/* Stats Row */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            icon={<InventoryIcon />}
            label={`${assetCount} Total Assets`}
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 1,
            }}
          />
          <Chip
            label={`${activeCount} Active`}
            color="success"
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 1,
            }}
          />
          <Chip
            label={`${maintenanceCount} Maintenance`}
            color="warning"
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 1,
            }}
          />

          {/* Filter Control */}
          <Box sx={{ ml: 'auto' }}>
            <FormControl sx={{ minWidth: 220 }} size="small">
              <InputLabel>{t('dashboard.filterByStatus')}</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleFilterChange}
                label={t('dashboard.filterByStatus')}
              >
                <MenuItem value="">{t('dashboard.allAssets')}</MenuItem>
                <MenuItem value="Active">{t('dashboard.active')}</MenuItem>
                <MenuItem value="Maintenance">{t('dashboard.maintenance')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Asset List */}
      <AssetList assets={assets || []} />
    </Box>
  );
};

export default DashboardPage;
