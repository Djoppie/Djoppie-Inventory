import { logger } from '../../utils/logger';
import { useState, useMemo } from 'react';
import { csvImportApi } from '../../api/csvImport.api';
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
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PreviewIcon from '@mui/icons-material/Preview';
import LabelImportantIcon from '@mui/icons-material/LabelImportant';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BuildIcon from '@mui/icons-material/Build';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CircularProgress from '@mui/material/CircularProgress';
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

// Column groups for better organization
interface ColumnGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  columns: ExportColumn[];
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
  const [showColumns, setShowColumns] = useState(true); // Expanded by default
  const [showPreview, setShowPreview] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [backendExporting, setBackendExporting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'essential' | 'full' | 'custom'>('essential');

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
          a.owner?.toLowerCase().includes(query) ||
          a.service?.name?.toLowerCase().includes(query) ||
          a.service?.code?.toLowerCase().includes(query) ||
          a.brand?.toLowerCase().includes(query) ||
          a.model?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [assets, statusFilter, categoryFilter, searchQuery]);

  // Organize columns into logical groups
  const columnGroups: ColumnGroup[] = useMemo(() => {
    return [
      {
        key: 'identification',
        label: 'Identificatie',
        icon: <LabelImportantIcon fontSize="small" />,
        description: 'Basisinformatie voor asset identificatie',
        columns: columns.filter(col =>
          ['assetCode', 'assetName', 'category', 'status'].includes(col.key)
        ),
      },
      {
        key: 'ownership',
        label: 'Eigenaarschap & Locatie',
        icon: <BusinessIcon fontSize="small" />,
        description: 'Eigenaar en locatiegegevens',
        columns: columns.filter(col =>
          ['owner', 'legacyBuilding', 'legacyDepartment', 'officeLocation'].includes(col.key)
        ),
      },
      {
        key: 'technical',
        label: 'Technische Details',
        icon: <BuildIcon fontSize="small" />,
        description: 'Technische specificaties en kenmerken',
        columns: columns.filter(col =>
          ['brand', 'model', 'serialNumber'].includes(col.key)
        ),
      },
      {
        key: 'dates',
        label: 'Datums',
        icon: <CalendarTodayIcon fontSize="small" />,
        description: 'Belangrijke datums en tijdslijnen',
        columns: columns.filter(col =>
          ['purchaseDate', 'warrantyExpiry', 'installationDate', 'intuneEnrollmentDate', 'intuneLastCheckIn', 'intuneCertificateExpiry', 'createdAt', 'updatedAt'].includes(col.key)
        ),
      },
    ];
  }, [columns]);

  const handleColumnToggle = (key: keyof Asset) => {
    setColumns(prev =>
      prev.map(col => (col.key === key ? { ...col, enabled: !col.enabled } : col))
    );
    setSelectedPreset('custom');
  };

  const handleSelectAllColumns = () => {
    setColumns(prev => prev.map(col => ({ ...col, enabled: true })));
    setSelectedPreset('full');
  };

  const handleDeselectAllColumns = () => {
    setColumns(prev => prev.map(col => ({ ...col, enabled: false })));
    setSelectedPreset('custom');
  };

  const handlePresetChange = (preset: 'essential' | 'full' | 'custom') => {
    setSelectedPreset(preset);
    if (preset === 'essential') {
      // Enable only essential columns
      setColumns(prev =>
        prev.map(col => ({
          ...col,
          enabled: ['assetCode', 'assetName', 'category', 'status', 'owner', 'brand', 'model', 'serialNumber'].includes(col.key),
        }))
      );
    } else if (preset === 'full') {
      handleSelectAllColumns();
    }
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
      logger.error('Export failed:', error);
    }
  };

  // Export using backend CSV format (matches import template)
  const handleBackendExport = async () => {
    setBackendExporting(true);
    try {
      // Use status filter if only one status is selected
      const statusParam = statusFilter.length === 1 ? statusFilter[0] : undefined;
      const blob = await csvImportApi.exportAssets(statusParam);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assets-import-export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      logger.error('Backend CSV export failed:', error);
    } finally {
      setBackendExporting(false);
    }
  };

  const enabledColumnsCount = columns.filter(col => col.enabled).length;
  const hasActiveFilters = statusFilter.length > 0 || categoryFilter.length > 0 || searchQuery.trim() !== '';

  // Get sample data for preview (first 3 assets)
  const previewAssets = filteredAssets.slice(0, 3);
  const enabledColumns = columns.filter(col => col.enabled);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
          maxHeight: '90vh',
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

        {/* Export Preview Stats - Enhanced with neumorphic design */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            background: theme =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.08) 0%, rgba(204, 0, 0, 0.03) 100%)'
                : 'linear-gradient(135deg, rgba(255, 119, 0, 0.04) 0%, rgba(204, 0, 0, 0.02) 100%)',
            boxShadow: theme =>
              theme.palette.mode === 'dark'
                ? 'inset 2px 2px 5px rgba(0, 0, 0, 0.5), inset -2px -2px 5px rgba(255, 119, 0, 0.03)'
                : 'inset 2px 2px 5px rgba(0, 0, 0, 0.05), inset -2px -2px 5px rgba(255, 255, 255, 0.8)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <InventoryIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>
              {t('export.preview')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<InventoryIcon />}
              label={`${filteredAssets.length} ${t('export.assetsToExport')}`}
              variant="outlined"
              sx={{
                fontWeight: 700,
                fontSize: '0.95rem',
                py: 2.5,
                px: 1,
                bgcolor: theme => theme.palette.mode === 'dark'
                  ? 'rgba(255, 119, 0, 0.25)'
                  : 'rgba(255, 119, 0, 0.15)',
                borderColor: 'primary.main',
                borderWidth: 2,
                color: 'primary.main',
                '& .MuiChip-icon': {
                  color: 'primary.main',
                },
              }}
            />
            <Chip
              icon={<ViewColumnIcon />}
              label={`${enabledColumnsCount} ${t('export.columnsSelected')}`}
              variant="outlined"
              sx={{
                fontWeight: 700,
                fontSize: '0.95rem',
                py: 2.5,
                px: 1,
                bgcolor: theme => theme.palette.mode === 'dark'
                  ? 'rgba(255, 119, 0, 0.25)'
                  : 'rgba(255, 119, 0, 0.15)',
                borderColor: 'primary.main',
                borderWidth: 2,
                color: 'primary.main',
                '& .MuiChip-icon': {
                  color: 'primary.main',
                },
              }}
            />
            {hasActiveFilters && (
              <Chip
                icon={<FilterAltIcon />}
                label={t('export.filtersActive')}
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  py: 2.5,
                  bgcolor: theme => theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.25)'
                    : 'rgba(255, 119, 0, 0.15)',
                  borderColor: 'primary.main',
                  borderWidth: 2,
                  color: 'primary.main',
                  '& .MuiChip-icon': {
                    color: 'primary.main',
                  },
                }}
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
              fontWeight: 700,
              fontSize: '1rem',
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
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: format === 'xlsx'
                  ? theme => `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                  : '0 2px 8px rgba(0,0,0,0.08)',
                transform: format === 'xlsx' ? 'translateY(-2px)' : 'none',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: theme =>
                    format === 'xlsx'
                      ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`
                      : '0 4px 16px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)',
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
                      <Typography variant="body1" fontWeight={700}>
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
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: format === 'csv'
                  ? theme => `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                  : '0 2px 8px rgba(0,0,0,0.08)',
                transform: format === 'csv' ? 'translateY(-2px)' : 'none',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: theme =>
                    format === 'csv'
                      ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`
                      : '0 4px 16px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)',
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
                      <Typography variant="body1" fontWeight={700}>
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
              fontWeight: 700,
              fontSize: '1rem',
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
                '&.Mui-focused': {
                  boxShadow: theme => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
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

        {/* Column Selection Presets */}
        <Box sx={{ mb: 3 }}>
          <FormLabel
            sx={{
              mb: 1.5,
              fontWeight: 700,
              fontSize: '1rem',
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ViewColumnIcon fontSize="small" />
            Kolom Voorinstellingen
          </FormLabel>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <Chip
              label="Essentieel"
              icon={<LabelImportantIcon />}
              onClick={() => handlePresetChange('essential')}
              variant="outlined"
              sx={{
                fontWeight: 600,
                py: 2.5,
                px: 1,
                transition: 'all 0.2s ease',
                bgcolor: selectedPreset === 'essential'
                  ? theme => theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.25)'
                    : 'rgba(255, 119, 0, 0.15)'
                  : 'transparent',
                borderColor: selectedPreset === 'essential' ? 'primary.main' : 'divider',
                borderWidth: selectedPreset === 'essential' ? 2 : 1,
                color: selectedPreset === 'essential' ? 'primary.main' : 'text.primary',
                '& .MuiChip-icon': {
                  color: selectedPreset === 'essential' ? 'primary.main' : 'text.secondary',
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  bgcolor: theme => theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.2)'
                    : 'rgba(255, 119, 0, 0.1)',
                  boxShadow: '0 4px 12px rgba(255, 119, 0, 0.2)',
                },
              }}
            />
            <Chip
              label="Volledig"
              icon={<CheckCircleIcon />}
              onClick={() => handlePresetChange('full')}
              variant="outlined"
              sx={{
                fontWeight: 600,
                py: 2.5,
                px: 1,
                transition: 'all 0.2s ease',
                bgcolor: selectedPreset === 'full'
                  ? theme => theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.25)'
                    : 'rgba(255, 119, 0, 0.15)'
                  : 'transparent',
                borderColor: selectedPreset === 'full' ? 'primary.main' : 'divider',
                borderWidth: selectedPreset === 'full' ? 2 : 1,
                color: selectedPreset === 'full' ? 'primary.main' : 'text.primary',
                '& .MuiChip-icon': {
                  color: selectedPreset === 'full' ? 'primary.main' : 'text.secondary',
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  bgcolor: theme => theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.2)'
                    : 'rgba(255, 119, 0, 0.1)',
                  boxShadow: '0 4px 12px rgba(255, 119, 0, 0.2)',
                },
              }}
            />
            <Chip
              label="Aangepast"
              icon={<BuildIcon />}
              onClick={() => setSelectedPreset('custom')}
              variant="outlined"
              sx={{
                fontWeight: 600,
                py: 2.5,
                px: 1,
                transition: 'all 0.2s ease',
                bgcolor: selectedPreset === 'custom'
                  ? theme => theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.25)'
                    : 'rgba(255, 119, 0, 0.15)'
                  : 'transparent',
                borderColor: selectedPreset === 'custom' ? 'primary.main' : 'divider',
                borderWidth: selectedPreset === 'custom' ? 2 : 1,
                color: selectedPreset === 'custom' ? 'primary.main' : 'text.primary',
                '& .MuiChip-icon': {
                  color: selectedPreset === 'custom' ? 'primary.main' : 'text.secondary',
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  bgcolor: theme => theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.2)'
                    : 'rgba(255, 119, 0, 0.1)',
                  boxShadow: '0 4px 12px rgba(255, 119, 0, 0.2)',
                },
              }}
            />
          </Box>
        </Box>

        {/* Filters Section */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              mb: 1,
              p: 1.5,
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: theme =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.05)'
                    : 'rgba(255, 119, 0, 0.02)',
              },
            }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterAltIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={700}>
                {t('export.filtersLabel')}
              </Typography>
              {hasActiveFilters && (
                <Chip
                  label={t('export.active')}
                  size="small"
                  color="secondary"
                  sx={{
                    color: theme => theme.palette.mode === 'dark' ? '#fff' : '#1a1a1a',
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
            <IconButton size="small">
              {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showFilters}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
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
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                {t('export.statusFilter')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
                {Object.values(AssetStatus).map(status => {
                  const isSelected = statusFilter.includes(status);
                  return (
                    <Chip
                      key={status}
                      label={t(`statuses.${status.toLowerCase()}`)}
                      onClick={() => handleStatusToggle(status)}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.875rem',
                        py: 2,
                        px: 0.5,
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        color: isSelected
                          ? theme => theme.palette.mode === 'dark' ? '#fff' : '#1a1a1a'
                          : undefined,
                        boxShadow: isSelected
                          ? theme => theme.palette.mode === 'dark'
                            ? '0 4px 16px rgba(255, 119, 0, 0.4), 0 0 0 2px rgba(255, 119, 0, 0.2)'
                            : '0 4px 16px rgba(255, 119, 0, 0.35), 0 0 0 2px rgba(255, 119, 0, 0.15)'
                          : 'none',
                        borderWidth: isSelected ? 0 : 2,
                        '&:hover': {
                          transform: 'scale(1.08)',
                          boxShadow: theme => theme.palette.mode === 'dark'
                            ? '0 6px 20px rgba(255, 119, 0, 0.3)'
                            : '0 6px 20px rgba(255, 119, 0, 0.25)',
                        },
                      }}
                    />
                  );
                })}
              </Box>

              {/* Category Filter */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                {t('export.categoryFilter')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {categories.map(category => {
                  const isSelected = categoryFilter.includes(category);
                  return (
                    <Chip
                      key={category}
                      label={category}
                      onClick={() => handleCategoryToggle(category)}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.875rem',
                        py: 2,
                        px: 0.5,
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        color: isSelected
                          ? theme => theme.palette.mode === 'dark' ? '#fff' : '#1a1a1a'
                          : undefined,
                        boxShadow: isSelected
                          ? theme => theme.palette.mode === 'dark'
                            ? '0 4px 16px rgba(255, 119, 0, 0.4), 0 0 0 2px rgba(255, 119, 0, 0.2)'
                            : '0 4px 16px rgba(255, 119, 0, 0.35), 0 0 0 2px rgba(255, 119, 0, 0.15)'
                          : 'none',
                        borderWidth: isSelected ? 0 : 2,
                        '&:hover': {
                          transform: 'scale(1.08)',
                          boxShadow: theme => theme.palette.mode === 'dark'
                            ? '0 6px 20px rgba(255, 119, 0, 0.3)'
                            : '0 6px 20px rgba(255, 119, 0, 0.25)',
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Paper>
          </Collapse>
        </Box>

        {/* Enhanced Columns Selection with Groups */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              mb: 1,
              p: 1.5,
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: theme =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.05)'
                    : 'rgba(255, 119, 0, 0.02)',
              },
            }}
            onClick={() => setShowColumns(!showColumns)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ViewColumnIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={700}>
                {t('export.columnsLabel')}
              </Typography>
              <Chip
                label={`${enabledColumnsCount}/${columns.length}`}
                size="small"
                color="primary"
                sx={{
                  fontWeight: 700,
                  color: theme => theme.palette.mode === 'dark' ? '#fff' : '#1a1a1a',
                }}
              />
            </Box>
            <IconButton size="small">
              {showColumns ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showColumns}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                background: theme =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(0, 0, 0, 0.2)'
                    : 'rgba(0, 0, 0, 0.02)',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSelectAllColumns}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  {t('export.selectAll')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleDeselectAllColumns}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  {t('export.deselectAll')}
                </Button>
              </Box>

              {/* Column Groups */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {columnGroups.map((group) => {
                  const groupEnabledCount = group.columns.filter(c => c.enabled).length;
                  return (
                    <Paper
                      key={group.key}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        background: theme =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 119, 0, 0.03)'
                            : 'rgba(255, 119, 0, 0.01)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: theme =>
                            theme.palette.mode === 'dark'
                              ? '0 4px 12px rgba(255, 119, 0, 0.15)'
                              : '0 4px 12px rgba(255, 119, 0, 0.1)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: theme =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 119, 0, 0.15)'
                                : 'rgba(255, 119, 0, 0.08)',
                            color: 'primary.main',
                          }}
                        >
                          {group.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {group.label}
                            </Typography>
                            <Badge
                              badgeContent={`${groupEnabledCount}/${group.columns.length}`}
                              color="primary"
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  minWidth: 32,
                                },
                              }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {group.description}
                          </Typography>
                        </Box>
                      </Box>

                      <FormGroup>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: 0.5,
                          }}
                        >
                          {group.columns.map(column => (
                            <Tooltip
                              key={column.key}
                              title={`Kolom: ${column.label}`}
                              placement="top"
                            >
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={column.enabled}
                                    onChange={() => handleColumnToggle(column.key)}
                                    size="small"
                                  />
                                }
                                label={
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: column.enabled ? 600 : 400,
                                      color: column.enabled ? 'text.primary' : 'text.secondary',
                                    }}
                                  >
                                    {column.label}
                                  </Typography>
                                }
                                sx={{
                                  m: 0,
                                  p: 1,
                                  borderRadius: 1,
                                  transition: 'all 0.15s ease',
                                  '&:hover': {
                                    background: theme =>
                                      theme.palette.mode === 'dark'
                                        ? 'rgba(255, 119, 0, 0.08)'
                                        : 'rgba(255, 119, 0, 0.04)',
                                  },
                                }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </FormGroup>
                    </Paper>
                  );
                })}
              </Box>
            </Paper>
          </Collapse>
        </Box>

        {/* Data Preview Section */}
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              mb: 1,
              p: 1.5,
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: theme =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.05)'
                    : 'rgba(255, 119, 0, 0.02)',
              },
            }}
            onClick={() => setShowPreview(!showPreview)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PreviewIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={700}>
                Data Voorbeeld
              </Typography>
              <Tooltip title="Toont de eerste 3 rijen van de export">
                <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </Tooltip>
            </Box>
            <IconButton size="small">
              {showPreview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showPreview}>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                maxHeight: 300,
                background: theme =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(0, 0, 0, 0.2)'
                    : 'rgba(0, 0, 0, 0.02)',
              }}
            >
              {enabledColumns.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <ViewColumnIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body2">
                    Selecteer minimaal één kolom om een voorbeeld te zien
                  </Typography>
                </Box>
              ) : previewAssets.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <InventoryIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body2">
                    Geen assets gevonden met de huidige filters
                  </Typography>
                </Box>
              ) : (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {enabledColumns.map(col => (
                        <TableCell
                          key={col.key}
                          sx={{
                            fontWeight: 700,
                            bgcolor: theme =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 119, 0, 0.15)'
                                : 'rgba(255, 119, 0, 0.08)',
                            borderBottom: '2px solid',
                            borderColor: 'primary.main',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewAssets.map((asset) => (
                      <TableRow
                        key={asset.id}
                        sx={{
                          '&:nth-of-type(odd)': {
                            bgcolor: theme =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.02)'
                                : 'rgba(0, 0, 0, 0.02)',
                          },
                        }}
                      >
                        {enabledColumns.map(col => (
                          <TableCell
                            key={col.key}
                            sx={{
                              whiteSpace: 'nowrap',
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {String(asset[col.key] || '-')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1, textAlign: 'center' }}
            >
              Preview toont maximaal 3 rijen • Totaal export: {filteredAssets.length} assets
            </Typography>
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
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Tooltip title={t('export.importCompatibleTooltip')}>
          <Button
            onClick={handleBackendExport}
            variant="outlined"
            color="secondary"
            startIcon={backendExporting ? <CircularProgress size={18} color="inherit" /> : <SyncAltIcon />}
            disabled={backendExporting}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            {t('export.importCompatible')}
          </Button>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600 }}>
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
            fontWeight: 700,
            animation: `${pulse} 2s infinite`,
            '&:hover': {
              animation: 'none',
            },
            '&:disabled': {
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
