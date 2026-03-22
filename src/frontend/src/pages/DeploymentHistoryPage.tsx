import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  IconButton,
  Stack,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Collapse,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import LaptopIcon from '@mui/icons-material/Laptop';
import PlaceIcon from '@mui/icons-material/Place';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import { ROUTES } from '../constants/routes';
import { DeploymentMode, DeploymentHistoryItem, DeploymentHistoryParams } from '../types/deployment.types';
import { useDeploymentHistory } from '../hooks/useDeployment';
import Loading from '../components/common/Loading';
import ApiErrorDisplay from '../components/common/ApiErrorDisplay';

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
    boxShadow: (thm: { palette: { mode: string } }) =>
      thm.palette.mode === 'dark'
        ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
        : '0 4px 20px rgba(253, 185, 49, 0.3)',
  },
};

const iconButtonSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (thm: { palette: { mode: string } }) =>
      thm.palette.mode === 'dark'
        ? '0 4px 16px rgba(255, 215, 0, 0.2)'
        : '0 2px 12px rgba(253, 185, 49, 0.3)',
  },
};

const DeploymentHistoryPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const dateLocale = i18n.language === 'nl' ? nl : enUS;

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DeploymentHistoryParams>({
    pageNumber: 1,
    pageSize: 10,
  });

  // Temporary filter state (before applying)
  const [tempFromDate, setTempFromDate] = useState<string>('');
  const [tempToDate, setTempToDate] = useState<string>('');
  const [tempMode, setTempMode] = useState<DeploymentMode | ''>('');

  // Data fetching
  const { data: historyResult, isLoading, error, refetch } = useDeploymentHistory(filters);

  const handleApplyFilters = () => {
    setFilters(prev => ({
      ...prev,
      fromDate: tempFromDate || undefined,
      toDate: tempToDate || undefined,
      mode: tempMode !== '' ? tempMode : undefined,
      pageNumber: 1, // Reset to first page when filters change
    }));
  };

  const handleClearFilters = () => {
    setTempFromDate('');
    setTempToDate('');
    setTempMode('');
    setFilters({
      pageNumber: 1,
      pageSize: filters.pageSize,
    });
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, pageNumber: newPage + 1 }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1,
    }));
  };

  const handleExportCSV = () => {
    if (!historyResult?.items?.length) return;

    const headers = [
      t('deployment.history.columns.date'),
      t('deployment.history.columns.mode'),
      t('deployment.history.columns.user'),
      'Email',
      t('deployment.history.columns.oldDevice'),
      t('deployment.history.columns.newDevice'),
      t('deployment.history.columns.workplace'),
      t('deployment.history.columns.performedBy'),
    ];

    const rows = historyResult.items.map((item: DeploymentHistoryItem) => [
      format(new Date(item.deploymentDate), 'yyyy-MM-dd HH:mm'),
      item.mode === DeploymentMode.Swap ? 'Swap' : 'Onboarding',
      item.owner.name,
      item.owner.email,
      item.oldLaptop?.assetCode || '-',
      item.newLaptop.assetCode,
      item.physicalWorkplace?.code || '-',
      item.performedBy || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `deployment-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getModeIcon = (mode: DeploymentMode) => {
    return mode === DeploymentMode.Swap ? (
      <SwapHorizIcon fontSize="small" color="primary" />
    ) : (
      <PersonAddIcon fontSize="small" color="success" />
    );
  };

  const getModeLabel = (mode: DeploymentMode) => {
    return mode === DeploymentMode.Swap
      ? t('deployment.mode.swap')
      : t('deployment.mode.onboarding');
  };

  const hasActiveFilters = Boolean(filters.fromDate || filters.toDate || filters.mode !== undefined);

  if (isLoading) {
    return <Loading message={t('common.loading')} />;
  }

  if (error) {
    const isNetworkError =
      error instanceof Error &&
      (error.message.includes('Network Error') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('fetch'));

    if (isNetworkError) {
      return <ApiErrorDisplay onRetry={() => refetch()} />;
    }

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error">
          {t('errors.unexpectedError')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Back Button & New Deployment Link */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Tooltip title={t('common.back')}>
          <IconButton
            onClick={() => navigate(ROUTES.LAPTOP_SWAP)}
            sx={{
              ...iconButtonSx,
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
        <Button
          startIcon={<AddIcon />}
          onClick={() => navigate(ROUTES.LAPTOP_SWAP)}
          variant="contained"
          size="small"
        >
          {t('deployment.title')}
        </Button>
      </Stack>

      {/* Header */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (thm) =>
                  thm.palette.mode === 'dark'
                    ? 'rgba(255, 215, 0, 0.08)'
                    : 'rgba(253, 185, 49, 0.08)',
              }}
            >
              <HistoryIcon
                sx={{
                  fontSize: 28,
                  color: 'primary.main',
                  filter: (thm: { palette: { mode: string } }) =>
                    thm.palette.mode === 'dark'
                      ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                      : 'none',
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" fontWeight={700}>
                {t('deployment.history.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('deployment.history.subtitle')}
              </Typography>
            </Box>
            {historyResult && (
              <Chip
                icon={<HistoryIcon />}
                label={`${historyResult.totalCount} ${historyResult.totalCount === 1 ? 'record' : 'records'}`}
                sx={{ fontWeight: 600 }}
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card elevation={0} sx={{ ...scannerCardSx, mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
              >
                {t('deployment.history.filters')}
              </Button>
              {hasActiveFilters && (
                <Button size="small" onClick={handleClearFilters} color="secondary">
                  {t('common.clearFilters')}
                </Button>
              )}
            </Stack>
            <Button
              startIcon={<FileDownloadIcon />}
              onClick={handleExportCSV}
              size="small"
              variant="outlined"
              disabled={!historyResult?.items?.length}
            >
              {t('deployment.history.export')}
            </Button>
          </Stack>

          <Collapse in={showFilters}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ mt: 2 }}
              alignItems="flex-end"
            >
              <TextField
                label={t('deployment.history.startDate')}
                type="date"
                size="small"
                value={tempFromDate}
                onChange={(e) => setTempFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                label={t('deployment.history.endDate')}
                type="date"
                size="small"
                value={tempToDate}
                onChange={(e) => setTempToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{t('deployment.history.modeFilter')}</InputLabel>
                <Select
                  value={tempMode}
                  onChange={(e) => setTempMode(e.target.value as DeploymentMode | '')}
                  label={t('deployment.history.modeFilter')}
                >
                  <MenuItem value="">{t('deployment.history.allModes')}</MenuItem>
                  <MenuItem value={DeploymentMode.Swap}>{t('deployment.mode.swap')}</MenuItem>
                  <MenuItem value={DeploymentMode.Onboarding}>{t('deployment.mode.onboarding')}</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" size="small" onClick={handleApplyFilters}>
                {t('common.search')}
              </Button>
            </Stack>
          </Collapse>
        </CardContent>
      </Card>

      {/* History Table/List */}
      {!historyResult?.items?.length ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <HistoryIcon sx={{ fontSize: '4rem', color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('deployment.history.noHistory')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.LAPTOP_SWAP)}
            size="large"
            sx={{ mt: 2 }}
          >
            {t('deployment.title')}
          </Button>
        </Paper>
      ) : (
        <>
          {/* Mobile/Tablet: Card View */}
          {isTablet && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {historyResult.items.map((item: DeploymentHistoryItem) => (
                <Card
                  key={item.id}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: (thm) =>
                        thm.palette.mode === 'dark'
                          ? '0 8px 32px rgba(255, 215, 0, 0.2)'
                          : '0 4px 20px rgba(253, 185, 49, 0.3)',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <CardContent sx={{ pb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {getModeIcon(item.mode)}
                        <Chip
                          label={getModeLabel(item.mode)}
                          size="small"
                          color={item.mode === DeploymentMode.Swap ? 'primary' : 'success'}
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(item.deploymentDate), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography fontWeight={500}>{item.owner.name}</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5 }}>
                      {item.owner.email}
                    </Typography>

                    <Stack direction="row" spacing={2} mt={2} flexWrap="wrap">
                      {item.oldLaptop && (
                        <Chip
                          icon={<LaptopIcon />}
                          label={`${item.oldLaptop.assetCode} → ${item.oldLaptop.newStatus}`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      <Chip
                        icon={<LaptopIcon />}
                        label={item.newLaptop.assetCode}
                        size="small"
                        color="success"
                      />
                      {item.physicalWorkplace && (
                        <Chip
                          icon={<PlaceIcon />}
                          label={item.physicalWorkplace.code}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      )}
                    </Stack>

                    {item.performedBy && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {t('deployment.history.columns.performedBy')}: {item.performedBy}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Desktop: Table View */}
          {!isTablet && (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: (thm) =>
                        thm.palette.mode === 'dark'
                          ? 'rgba(255, 119, 0, 0.05)'
                          : 'rgba(255, 119, 0, 0.02)',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>{t('deployment.history.columns.date')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('deployment.history.columns.mode')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('deployment.history.columns.user')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('deployment.history.columns.oldDevice')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('deployment.history.columns.newDevice')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('deployment.history.columns.workplace')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('deployment.history.columns.performedBy')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyResult.items.map((item: DeploymentHistoryItem) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: (thm) =>
                            thm.palette.mode === 'dark'
                              ? 'rgba(255, 119, 0, 0.05)'
                              : 'rgba(255, 119, 0, 0.02)',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(item.deploymentDate), 'dd MMM yyyy', { locale: dateLocale })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(item.deploymentDate), 'HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {getModeIcon(item.mode)}
                          <Typography variant="body2">{getModeLabel(item.mode)}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={500}>{item.owner.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.owner.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.oldLaptop ? (
                          <Stack>
                            <Typography variant="body2" color="warning.main" fontWeight={500}>
                              {item.oldLaptop.assetCode}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              → {item.oldLaptop.newStatus}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.disabled">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" color="success.main" fontWeight={500}>
                            {item.newLaptop.assetCode}
                          </Typography>
                          {item.newLaptop.serialNumber && (
                            <Typography variant="caption" color="text.secondary">
                              {item.newLaptop.serialNumber}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {item.physicalWorkplace ? (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <PlaceIcon fontSize="small" color="info" />
                            <Typography variant="body2">{item.physicalWorkplace.code}</Typography>
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.disabled">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.performedBy || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          <TablePagination
            component="div"
            count={historyResult.totalCount}
            page={(filters.pageNumber || 1) - 1}
            onPageChange={handlePageChange}
            rowsPerPage={filters.pageSize || 10}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage={t('common.rowsPerPage')}
            sx={{ mt: 2 }}
          />
        </>
      )}
    </Box>
  );
};

export default DeploymentHistoryPage;
