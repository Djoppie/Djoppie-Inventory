import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  Chip,
  Divider,
  Paper,
  IconButton,
  FormGroup,
  Alert,
  Collapse,
  alpha,
  keyframes,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import TableViewIcon from '@mui/icons-material/TableView';
import DescriptionIcon from '@mui/icons-material/Description';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import { Asset, AssetStatus } from '../../types/asset.types';
import {
  exportAssets,
  ExportColumn,
  ExportConfig,
  getDefaultExportColumns,
} from '../../utils/exportUtils';

// Pulse animation for the download button
const pulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 119, 0, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(255, 119, 0, 0);
  }
`;

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  assets: Asset[];
}

const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose, assets }) => {
  const { t } = useTranslation();

  // Export configuration state
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [fileName, setFileName] = useState('djoppie_inventory');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [columns, setColumns] = useState<ExportColumn[]>(getDefaultExportColumns());

  // Filter state
  const [statusFilter, setStatusFilter] = useState<AssetStatus[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(assets.map(a => a.category));
    return Array.from(uniqueCategories).sort();
  }, [assets]);

  // Filter assets based on selected filters
  const filteredAssets = useMemo(() => {
    let result = [...assets];

    // Apply status filter
    if (statusFilter.length > 0) {
      result = result.filter(a => statusFilter.includes(a.status));
    }

    // Apply category filter
    if (categoryFilter.length > 0) {
      result = result.filter(a => categoryFilter.includes(a.category));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        a =>
          a.assetName.toLowerCase().includes(query) ||
          a.assetCode.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query) ||
          a.owner.toLowerCase().includes(query) ||
          a.building.toLowerCase().includes(query) ||
          a.brand?.toLowerCase().includes(query) ||
          a.model?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [assets, statusFilter, categoryFilter, searchQuery]);

  const handleColumnToggle = (key: keyof Asset) => {
    setColumns(prev =>
      prev.map(col => (col.key === key ? { ...col, enabled: !col.enabled } : col))
    );
  };

  const handleSelectAllColumns = () => {
    setColumns(prev => prev.map(col => ({ ...col, enabled: true })));
  };

  const handleDeselectAllColumns = () => {
    setColumns(prev => prev.map(col => ({ ...col, enabled: false })));
  };

  const handleStatusToggle = (status: AssetStatus) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleCategoryToggle = (category: string) => {
    setCategoryFilter(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleExport = async () => {
    try {
      const config: ExportConfig = {
        columns,
        format,
        fileName,
        includeTimestamp,
      };

      await exportAssets(filteredAssets, config);
      setExportSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const enabledColumnsCount = columns.filter(col => col.enabled).length;
  const hasActiveFilters = statusFilter.length > 0 || categoryFilter.length > 0 || searchQuery.trim() !== '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: theme =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(18, 18, 18, 0.98) 0%, rgba(30, 30, 30, 0.98) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: theme =>
            theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(255, 119, 0, 0.15)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          background: theme =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, rgba(255, 119, 0, 0.15) 0%, rgba(204, 0, 0, 0.05) 100%)'
              : 'linear-gradient(90deg, rgba(255, 119, 0, 0.08) 0%, rgba(204, 0, 0, 0.03) 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DownloadIcon
            sx={{
              fontSize: '2rem',
              color: 'primary.main',
              filter: theme =>
                theme.palette.mode === 'dark'
                  ? 'drop-shadow(0 0 8px rgba(255, 119, 0, 0.5))'
                  : 'none',
            }}
          />
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {t('export.title')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('export.subtitle')}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Export Success Alert */}
        <Collapse in={exportSuccess}>
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{
              mb: 3,
              borderRadius: 2,
              animation: `${pulse} 1s ease-in-out`,
            }}
          >
            {t('export.success')}
          </Alert>
        </Collapse>

        {/* Export Preview Stats */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            background: theme =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 119, 0, 0.05)'
                : 'rgba(255, 119, 0, 0.02)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <InventoryIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('export.preview')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`${filteredAssets.length} ${t('export.assetsToExport')}`}
              color="primary"
              sx={{ fontWeight: 600, fontSize: '0.9rem' }}
            />
            <Chip
              label={`${enabledColumnsCount} ${t('export.columnsSelected')}`}
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.9rem' }}
            />
            {hasActiveFilters && (
              <Chip
                label={t('export.filtersActive')}
                color="secondary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        </Paper>

        {/* Format Selection */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel
            component="legend"
            sx={{
              mb: 1.5,
              fontWeight: 600,
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <TableViewIcon fontSize="small" />
            {t('export.formatLabel')}
          </FormLabel>
          <RadioGroup
            row
            value={format}
            onChange={e => setFormat(e.target.value as 'xlsx' | 'csv')}
          >
            <Paper
              elevation={0}
              sx={{
                mr: 2,
                border: '2px solid',
                borderColor: format === 'xlsx' ? 'primary.main' : 'divider',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                  boxShadow: theme =>
                    format === 'xlsx'
                      ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                      : '0 4px 12px rgba(0,0,0,0.1)',
                },
              }}
            >
              <FormControlLabel
                value="xlsx"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 1 }}>
                    <TableViewIcon />
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Excel (.xlsx)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('export.excelDescription')}
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ m: 0, pr: 2 }}
              />
            </Paper>

            <Paper
              elevation={0}
              sx={{
                border: '2px solid',
                borderColor: format === 'csv' ? 'primary.main' : 'divider',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                  boxShadow: theme =>
                    format === 'csv'
                      ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                      : '0 4px 12px rgba(0,0,0,0.1)',
                },
              }}
            >
              <FormControlLabel
                value="csv"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 1 }}>
                    <DescriptionIcon />
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        CSV (.csv)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('export.csvDescription')}
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ m: 0, pr: 2 }}
              />
            </Paper>
          </RadioGroup>
        </FormControl>

        {/* File Name Configuration */}
        <Box sx={{ mb: 3 }}>
          <FormLabel
            sx={{
              mb: 1.5,
              fontWeight: 600,
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <DescriptionIcon fontSize="small" />
            {t('export.fileNameLabel')}
          </FormLabel>
          <TextField
            fullWidth
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            placeholder="djoppie_inventory"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={includeTimestamp}
                onChange={e => setIncludeTimestamp(e.target.checked)}
              />
            }
            label={t('export.includeTimestamp')}
            sx={{ mt: 1 }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Filters Section */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              mb: 1,
            }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterAltIcon />
              {t('export.filtersLabel')}
              {hasActiveFilters && (
                <Chip label={t('export.active')} size="small" color="secondary" />
              )}
            </Typography>
            <IconButton size="small">
              {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showFilters}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                background: theme =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(0, 0, 0, 0.2)'
                    : 'rgba(0, 0, 0, 0.02)',
              }}
            >
              {/* Search */}
              <TextField
                fullWidth
                size="small"
                placeholder={t('export.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              {/* Status Filter */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                {t('export.statusFilter')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {Object.values(AssetStatus).map(status => (
                  <Chip
                    key={status}
                    label={t(`statuses.${status.toLowerCase()}`)}
                    onClick={() => handleStatusToggle(status)}
                    color={statusFilter.includes(status) ? 'primary' : 'default'}
                    variant={statusFilter.includes(status) ? 'filled' : 'outlined'}
                    sx={{
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  />
                ))}
              </Box>

              {/* Category Filter */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                {t('export.categoryFilter')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {categories.map(category => (
                  <Chip
                    key={category}
                    label={category}
                    onClick={() => handleCategoryToggle(category)}
                    color={categoryFilter.includes(category) ? 'primary' : 'default'}
                    variant={categoryFilter.includes(category) ? 'filled' : 'outlined'}
                    sx={{
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </Collapse>
        </Box>

        {/* Columns Selection */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              mb: 1,
            }}
            onClick={() => setShowColumns(!showColumns)}
          >
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ViewColumnIcon />
              {t('export.columnsLabel')}
              <Chip label={`${enabledColumnsCount}/${columns.length}`} size="small" />
            </Typography>
            <IconButton size="small">
              {showColumns ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showColumns}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                background: theme =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(0, 0, 0, 0.2)'
                    : 'rgba(0, 0, 0, 0.02)',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSelectAllColumns}
                  sx={{ borderRadius: 2 }}
                >
                  {t('export.selectAll')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleDeselectAllColumns}
                  sx={{ borderRadius: 2 }}
                >
                  {t('export.deselectAll')}
                </Button>
              </Box>

              <FormGroup>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1 }}>
                  {columns.map(column => (
                    <FormControlLabel
                      key={column.key}
                      control={
                        <Checkbox
                          checked={column.enabled}
                          onChange={() => handleColumnToggle(column.key)}
                        />
                      }
                      label={column.label}
                      sx={{
                        m: 0,
                        p: 1,
                        borderRadius: 1,
                        '&:hover': {
                          background: theme =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(255, 119, 0, 0.05)'
                              : 'rgba(255, 119, 0, 0.02)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </FormGroup>
            </Paper>
          </Collapse>
        </Box>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 2,
          background: theme =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, transparent 0%, rgba(255, 119, 0, 0.05) 100%)'
              : 'linear-gradient(180deg, transparent 0%, rgba(255, 119, 0, 0.02) 100%)',
        }}
      >
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={filteredAssets.length === 0 || enabledColumnsCount === 0}
          sx={{
            borderRadius: 2,
            px: 3,
            animation: `${pulse} 2s infinite`,
            '&:hover': {
              animation: 'none',
            },
          }}
        >
          {t('export.exportButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
