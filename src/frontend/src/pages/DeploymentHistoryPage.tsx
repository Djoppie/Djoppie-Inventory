import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
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
  InputAdornment,
  alpha,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonIcon from '@mui/icons-material/Person';
import LaptopIcon from '@mui/icons-material/Laptop';
import PlaceIcon from '@mui/icons-material/Place';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { ROUTES } from '../constants/routes';
import { ASSET_COLOR } from '../constants/filterColors';
import { DeploymentMode, DeploymentHistoryItem, DeploymentHistoryParams } from '../types/deployment.types';
import { useDeploymentHistory } from '../hooks/useDeployment';
import Loading from '../components/common/Loading';
import ApiErrorDisplay from '../components/common/ApiErrorDisplay';

// Neumorphic shadow utilities
const getNeumorph = (isDark: boolean, intensity: 'soft' | 'medium' | 'strong' = 'medium') => {
  const shadows = {
    soft: isDark
      ? '4px 4px 8px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.03)'
      : '4px 4px 8px rgba(0,0,0,0.08), -2px -2px 6px rgba(255,255,255,0.8)',
    medium: isDark
      ? '6px 6px 12px rgba(0,0,0,0.5), -3px -3px 8px rgba(255,255,255,0.04)'
      : '6px 6px 12px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.9)',
    strong: isDark
      ? '8px 8px 16px rgba(0,0,0,0.6), -4px -4px 10px rgba(255,255,255,0.05)'
      : '8px 8px 16px rgba(0,0,0,0.12), -4px -4px 10px rgba(255,255,255,1)',
  };
  return shadows[intensity];
};

const getNeumorphInset = (isDark: boolean) =>
  isDark
    ? 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.03)'
    : 'inset 2px 2px 4px rgba(0,0,0,0.06), inset -1px -1px 3px rgba(255,255,255,0.7)';

// Scanner-style card wrapper
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


const DeploymentHistoryPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const dateLocale = i18n.language === 'nl' ? nl : enUS;

  // Theme colors
  const bgBase = isDark ? '#1a1f2e' : '#f0f2f5';
  const bgSurface = isDark ? '#232936' : '#ffffff';
  const accentColor = '#FF7700';

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DeploymentHistoryParams>({
    pageNumber: 1,
    pageSize: 15,
  });

  // Temporary filter state (before applying)
  const [tempFromDate, setTempFromDate] = useState<string>('');
  const [tempToDate, setTempToDate] = useState<string>('');
  const [tempMode, setTempMode] = useState<DeploymentMode | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Data fetching
  const { data: historyResult, isLoading, error, refetch } = useDeploymentHistory(filters);

  const handleApplyFilters = () => {
    setFilters(prev => ({
      ...prev,
      fromDate: tempFromDate || undefined,
      toDate: tempToDate || undefined,
      mode: tempMode !== '' ? tempMode : undefined,
      pageNumber: 1,
    }));
  };

  const handleClearFilters = () => {
    setTempFromDate('');
    setTempToDate('');
    setTempMode('');
    setSearchTerm('');
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
      getModeLabel(item.mode),
      item.owner.name,
      item.owner.email,
      item.oldLaptop?.assetCode || '-',
      item.newLaptop?.assetCode || '-',
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
    switch (mode) {
      case DeploymentMode.Swap:
        return <SwapHorizIcon fontSize="small" sx={{ color: accentColor }} />;
      case DeploymentMode.Offboarding:
        return <PersonRemoveIcon fontSize="small" sx={{ color: '#EF5350' }} />;
      default:
        return <PersonAddIcon fontSize="small" sx={{ color: '#4CAF50' }} />;
    }
  };

  const getModeLabel = (mode: DeploymentMode) => {
    switch (mode) {
      case DeploymentMode.Swap:
        return t('deployment.mode.swap');
      case DeploymentMode.Offboarding:
        return t('deployment.mode.offboarding');
      default:
        return t('deployment.mode.onboarding');
    }
  };

  const getModeColor = (mode: DeploymentMode): 'primary' | 'success' | 'error' => {
    switch (mode) {
      case DeploymentMode.Swap:
        return 'primary';
      case DeploymentMode.Offboarding:
        return 'error';
      default:
        return 'success';
    }
  };

  const hasActiveFilters = Boolean(filters.fromDate || filters.toDate || filters.mode !== undefined);

  // Filter items by search term
  const filteredItems = historyResult?.items?.filter((item: DeploymentHistoryItem) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.owner.name?.toLowerCase().includes(search) ||
      item.owner.email?.toLowerCase().includes(search) ||
      item.oldLaptop?.assetCode?.toLowerCase().includes(search) ||
      item.newLaptop?.assetCode?.toLowerCase().includes(search) ||
      item.performedBy?.toLowerCase().includes(search)
    );
  }) || [];

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
        <Tooltip title={t('common.back')} arrow>
          <IconButton
            onClick={() => navigate(ROUTES.LAPTOP_SWAP)}
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              color: 'text.secondary',
              bgcolor: 'transparent',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.15s ease',
              '&:hover': {
                color: ASSET_COLOR,
                bgcolor: alpha(ASSET_COLOR, 0.08),
                borderColor: ASSET_COLOR,
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
                sx={{ fontWeight: 600, bgcolor: alpha(accentColor, 0.1), color: accentColor }}
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Filters Card */}
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
                  <MenuItem value={DeploymentMode.Onboarding}>{t('deployment.mode.onboarding')}</MenuItem>
                  <MenuItem value={DeploymentMode.Swap}>{t('deployment.mode.swap')}</MenuItem>
                  <MenuItem value={DeploymentMode.Offboarding}>{t('deployment.mode.offboarding')}</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" size="small" onClick={handleApplyFilters}>
                {t('common.search')}
              </Button>
            </Stack>
          </Collapse>
        </CardContent>
      </Card>

      {/* Table Section */}
      {!historyResult?.items?.length ? (
        <Box
          sx={{
            bgcolor: bgBase,
            borderRadius: 3,
            p: 6,
            boxShadow: getNeumorph(isDark, 'medium'),
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
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: bgBase,
            borderRadius: 3,
            p: { xs: 1.5, sm: 2 },
            boxShadow: getNeumorph(isDark, 'medium'),
          }}
        >
          {/* Search Bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 2,
              p: 1.5,
              bgcolor: bgSurface,
              borderRadius: 2,
              boxShadow: getNeumorphInset(isDark),
            }}
          >
            <TextField
              size="small"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.25 }}>
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: { xs: 1, md: '0 0 280px' },
                '& .MuiOutlinedInput-root': {
                  bgcolor: bgBase,
                  borderRadius: 1.5,
                  fontSize: '0.85rem',
                  boxShadow: getNeumorphInset(isDark),
                  '& fieldset': { border: 'none' },
                  '&:hover': {
                    boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha(accentColor, 0.3)}`,
                  },
                  '&.Mui-focused': {
                    boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha(accentColor, 0.4)}`,
                  },
                },
              }}
            />
            <Box sx={{ ml: 'auto' }}>
              <Chip
                size="small"
                label={`${filteredItems.length} ${t('deployment.history.items')}`}
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: alpha(accentColor, 0.1),
                  color: accentColor,
                }}
              />
            </Box>
          </Box>

          {/* Mobile/Tablet: Card View */}
          {isTablet && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredItems.map((item: DeploymentHistoryItem) => (
                <Card
                  key={item.id}
                  elevation={0}
                  sx={{
                    bgcolor: bgSurface,
                    borderRadius: 2,
                    boxShadow: getNeumorph(isDark, 'soft'),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: getNeumorph(isDark, 'medium'),
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
                          color={getModeColor(item.mode)}
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(item.deploymentDate), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography fontWeight={500}>{item.owner.name || '-'}</Typography>
                    </Stack>
                    {item.owner.email && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5 }}>
                        {item.owner.email}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={2} mt={2} flexWrap="wrap" gap={1}>
                      {item.oldLaptop && (
                        <Chip
                          icon={<LaptopIcon />}
                          label={`${item.oldLaptop.assetCode} → ${item.oldLaptop.newStatus}`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      {item.newLaptop && (
                        <Chip
                          icon={<LaptopIcon />}
                          label={item.newLaptop.assetCode}
                          size="small"
                          color="success"
                        />
                      )}
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
              sx={{
                bgcolor: bgSurface,
                borderRadius: 2,
                boxShadow: getNeumorph(isDark, 'soft'),
                overflow: 'hidden',
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 1.5,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                        bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.02),
                        borderBottom: `1px solid ${alpha(accentColor, 0.15)}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('deployment.history.columns.date')}
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 1.5,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                        bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.02),
                        borderBottom: `1px solid ${alpha(accentColor, 0.15)}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('deployment.history.columns.mode')}
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 1.5,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                        bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.02),
                        borderBottom: `1px solid ${alpha(accentColor, 0.15)}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('deployment.history.columns.user')}
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 1.5,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                        bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.02),
                        borderBottom: `1px solid ${alpha(accentColor, 0.15)}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('deployment.history.columns.oldDevice')}
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 1.5,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                        bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.02),
                        borderBottom: `1px solid ${alpha(accentColor, 0.15)}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('deployment.history.columns.newDevice')}
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 1.5,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                        bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.02),
                        borderBottom: `1px solid ${alpha(accentColor, 0.15)}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('deployment.history.columns.workplace')}
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 1.5,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                        bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.02),
                        borderBottom: `1px solid ${alpha(accentColor, 0.15)}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('deployment.history.columns.performedBy')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 4, textAlign: 'center' }}>
                        <TableRowsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {searchTerm ? t('common.noResults') : t('deployment.history.noHistory')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item: DeploymentHistoryItem, idx: number) => (
                      <TableRow
                        key={item.id}
                        sx={{
                          bgcolor: idx % 2 === 0 ? 'transparent' : alpha(bgBase, 0.3),
                          transition: 'all 0.12s ease',
                          '&:hover': {
                            bgcolor: alpha(accentColor, isDark ? 0.08 : 0.04),
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            py: 0.75,
                            px: 1.5,
                            fontSize: '0.8rem',
                            borderBottom: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.04)}`,
                          }}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {format(new Date(item.deploymentDate), 'dd MMM yyyy', { locale: dateLocale })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(item.deploymentDate), 'HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 0.75,
                            px: 1.5,
                            fontSize: '0.8rem',
                            borderBottom: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.04)}`,
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            {getModeIcon(item.mode)}
                            <Typography variant="body2">{getModeLabel(item.mode)}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 0.75,
                            px: 1.5,
                            fontSize: '0.8rem',
                            borderBottom: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.04)}`,
                          }}
                        >
                          <Typography fontWeight={500}>{item.owner.name || '-'}</Typography>
                          {item.owner.email && (
                            <Typography variant="caption" color="text.secondary">
                              {item.owner.email}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 0.75,
                            px: 1.5,
                            fontSize: '0.8rem',
                            borderBottom: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.04)}`,
                          }}
                        >
                          {item.oldLaptop ? (
                            <Stack>
                              <Typography
                                variant="body2"
                                sx={{ color: '#FF9800', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}
                              >
                                {item.oldLaptop.assetCode}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.oldLaptop.previousStatus} → {item.oldLaptop.newStatus}
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.disabled">-</Typography>
                          )}
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 0.75,
                            px: 1.5,
                            fontSize: '0.8rem',
                            borderBottom: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.04)}`,
                          }}
                        >
                          {item.newLaptop ? (
                            <Stack>
                              <Typography
                                variant="body2"
                                sx={{ color: '#4CAF50', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}
                              >
                                {item.newLaptop.assetCode}
                              </Typography>
                              {item.newLaptop.serialNumber && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.newLaptop.serialNumber}
                                </Typography>
                              )}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.disabled">-</Typography>
                          )}
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 0.75,
                            px: 1.5,
                            fontSize: '0.8rem',
                            borderBottom: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.04)}`,
                          }}
                        >
                          {item.physicalWorkplace ? (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <PlaceIcon fontSize="small" sx={{ color: '#2196F3' }} />
                              <Typography variant="body2">{item.physicalWorkplace.code}</Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.disabled">-</Typography>
                          )}
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 0.75,
                            px: 1.5,
                            fontSize: '0.8rem',
                            borderBottom: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.04)}`,
                          }}
                        >
                          <Typography variant="body2">
                            {item.performedBy || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          <Box
            sx={{
              mt: 1.5,
              px: 1.5,
              py: 0.75,
              bgcolor: bgSurface,
              borderRadius: 1.5,
              boxShadow: getNeumorph(isDark, 'soft'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <TablePagination
              component="div"
              count={historyResult?.totalCount || 0}
              page={(filters.pageNumber || 1) - 1}
              onPageChange={handlePageChange}
              rowsPerPage={filters.pageSize || 15}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 15, 25, 50]}
              labelRowsPerPage={t('common.rowsPerPage')}
              sx={{
                '& .MuiTablePagination-toolbar': {
                  minHeight: 32,
                  pl: 0,
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.75rem',
                  m: 0,
                },
                '& .MuiTablePagination-select': {
                  fontSize: '0.75rem',
                },
                '& .MuiTablePagination-actions': {
                  ml: 1,
                  '& .MuiIconButton-root': {
                    p: 0.5,
                    bgcolor: bgBase,
                    boxShadow: getNeumorph(isDark, 'soft'),
                    mx: 0.25,
                    '&:hover': {
                      bgcolor: alpha(accentColor, 0.1),
                    },
                    '&.Mui-disabled': {
                      opacity: 0.4,
                    },
                  },
                },
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DeploymentHistoryPage;
