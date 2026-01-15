import { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAssets } from '../hooks/useAssets';
import AssetList from '../components/assets/AssetList';
import Loading from '../components/common/Loading';
import ApiErrorDisplay from '../components/common/ApiErrorDisplay';

const DashboardPage = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: assets, isLoading, error, refetch } = useAssets(statusFilter);

  const handleFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  if (isLoading) return <Loading />;

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('dashboard.title')}
        </Typography>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('dashboard.filterByStatus')}</InputLabel>
          <Select value={statusFilter} onChange={handleFilterChange} label={t('dashboard.filterByStatus')}>
            <MenuItem value="">{t('dashboard.allAssets')}</MenuItem>
            <MenuItem value="Active">{t('dashboard.active')}</MenuItem>
            <MenuItem value="Maintenance">{t('dashboard.maintenance')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <AssetList assets={assets || []} />
    </Box>
  );
};

export default DashboardPage;
