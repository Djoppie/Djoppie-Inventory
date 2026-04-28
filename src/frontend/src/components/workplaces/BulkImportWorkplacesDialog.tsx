import { useState, useRef } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  TextField,
  Alert,
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import {
  useDownloadWorkplaceTemplate,
  useExportWorkplacesCsv,
  useImportWorkplacesCsv,
  useBulkCreateWorkplaces,
} from '../../hooks/usePhysicalWorkplaces';
import {
  WorkplaceCsvImportResult,
  BulkCreateWorkplacesResult,
  BulkCreateWorkplacesDto,
} from '../../api/physicalWorkplaces.api';
import { WorkplaceType, WorkplaceTypeLabels } from '../../types/physicalWorkplace.types';
import BuildingSelect from '../common/BuildingSelect';
import ServiceSelect from '../common/ServiceSelect';

interface BulkImportWorkplacesDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

const BulkImportWorkplacesDialog = ({
  open,
  onClose,
  onSuccess,
  onError,
}: BulkImportWorkplacesDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tabValue, setTabValue] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<WorkplaceCsvImportResult | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkCreateWorkplacesResult | null>(null);

  // Bulk create form state
  const [bulkForm, setBulkForm] = useState<BulkCreateWorkplacesDto>({
    buildingId: 0,
    serviceId: undefined,
    codePrefix: '',
    startNumber: 1,
    count: 5,
    nameTemplate: 'Werkplek {n}',
    floor: '',
    room: '',
    type: WorkplaceType.Laptop,
    monitorCount: 2,
    hasDockingStation: true,
  });

  // Neomorph styling constants
  const neomorphBoxShadow = isDark
    ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33'
    : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff';
  const neomorphInsetShadow = isDark
    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff';
  const bgColor = isDark ? '#1e2328' : '#e8eef3';
  const sectionBg = isDark ? '#1e2328' : '#e8eef3';
  const accentColor = '#FF7700';

  const downloadTemplateMutation = useDownloadWorkplaceTemplate();
  const exportCsvMutation = useExportWorkplacesCsv();
  const importCsvMutation = useImportWorkplacesCsv();
  const bulkCreateMutation = useBulkCreateWorkplaces();

  const handleDownloadTemplate = () => {
    downloadTemplateMutation.mutate(undefined, {
      onSuccess: () => onSuccess?.(t('physicalWorkplaces.bulk.templateDownloaded')),
      onError: () => onError?.(t('physicalWorkplaces.bulk.templateError')),
    });
  };

  const handleExportCsv = () => {
    exportCsvMutation.mutate(undefined, {
      onSuccess: () => onSuccess?.(t('physicalWorkplaces.bulk.exportSuccess')),
      onError: (error) => {
        console.error('Export error:', error);
        onError?.(t('physicalWorkplaces.bulk.exportError'));
      },
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImportCsv = () => {
    if (!selectedFile) return;

    importCsvMutation.mutate(selectedFile, {
      onSuccess: (result) => {
        setImportResult(result);
        if (result.isFullySuccessful) {
          onSuccess?.(t('physicalWorkplaces.bulk.importSuccess', { count: result.successCount }));
        } else if (result.successCount > 0) {
          onSuccess?.(t('physicalWorkplaces.bulk.importPartial', {
            success: result.successCount,
            errors: result.errorCount,
          }));
        } else {
          onError?.(t('physicalWorkplaces.bulk.importFailed'));
        }
      },
      onError: () => onError?.(t('physicalWorkplaces.bulk.importError')),
    });
  };

  const handleBulkCreate = () => {
    if (!bulkForm.buildingId || !bulkForm.codePrefix || !bulkForm.nameTemplate) return;

    bulkCreateMutation.mutate(bulkForm, {
      onSuccess: (result) => {
        setBulkResult(result);
        if (result.errorCount === 0) {
          onSuccess?.(t('physicalWorkplaces.bulk.createSuccess', { count: result.successCount }));
        } else if (result.successCount > 0) {
          onSuccess?.(t('physicalWorkplaces.bulk.createPartial', {
            success: result.successCount,
            errors: result.errorCount,
          }));
        } else {
          onError?.(t('physicalWorkplaces.bulk.createFailed'));
        }
      },
      onError: () => onError?.(t('physicalWorkplaces.bulk.createError')),
    });
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    setBulkResult(null);
    setTabValue(0);
    setBulkForm({
      buildingId: 0,
      serviceId: undefined,
      codePrefix: '',
      startNumber: 1,
      count: 5,
      nameTemplate: 'Werkplek {n}',
      floor: '',
      room: '',
      type: WorkplaceType.Laptop,
      monitorCount: 2,
      hasDockingStation: true,
    });
    onClose();
  };

  // Neomorph text field styling
  const neomorphTextFieldSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: bgColor,
      borderRadius: 2,
      boxShadow: neomorphInsetShadow,
      transition: 'all 0.3s ease',
      '& fieldset': {
        borderColor: 'transparent',
      },
      '&:hover fieldset': {
        borderColor: accentColor,
      },
      '&.Mui-focused fieldset': {
        borderColor: accentColor,
        borderWidth: 2,
      },
    },
  };

  // Neomorph button styling
  const neomorphButtonSx = {
    backgroundColor: bgColor,
    boxShadow: neomorphBoxShadow,
    borderRadius: 2,
    border: 'none',
    color: isDark ? '#fff' : '#333',
    textTransform: 'none' as const,
    fontWeight: 600,
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: bgColor,
      boxShadow: isDark
        ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33'
        : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      boxShadow: neomorphInsetShadow,
      transform: 'translateY(0)',
    },
    '&.Mui-disabled': {
      backgroundColor: bgColor,
      opacity: 0.5,
    },
  };

  const neomorphPrimaryButtonSx = {
    ...neomorphButtonSx,
    backgroundColor: accentColor,
    color: '#fff',
    '&:hover': {
      backgroundColor: accentColor,
      boxShadow: isDark
        ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, 0 0 20px rgba(255, 119, 0, 0.4)'
        : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, 0 0 20px rgba(255, 119, 0, 0.3)',
      transform: 'translateY(-1px)',
    },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
          boxShadow: neomorphBoxShadow,
          backgroundColor: bgColor,
          backgroundImage: 'none',
          border: 'none',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: isDark
            ? `linear-gradient(135deg, ${bgColor} 0%, #252a30 100%)`
            : `linear-gradient(135deg, ${bgColor} 0%, #dde4eb 100%)`,
          borderBottom: `2px solid ${accentColor}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: bgColor,
                boxShadow: neomorphBoxShadow,
              }}
            >
              <UploadFileIcon sx={{ color: accentColor, fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {t('physicalWorkplaces.bulk.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('physicalWorkplaces.bulk.subtitle')}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={handleClose}
            sx={{
              backgroundColor: bgColor,
              boxShadow: neomorphBoxShadow,
              '&:hover': {
                backgroundColor: bgColor,
                boxShadow: neomorphInsetShadow,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {/* Tabs */}
        <Box
          sx={{
            backgroundColor: sectionBg,
            borderRadius: 2,
            boxShadow: neomorphInsetShadow,
            p: 0.5,
            mb: 3,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="fullWidth"
            TabIndicatorProps={{ sx: { display: 'none' } }}
            sx={{
              '& .MuiTab-root': {
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                '&.Mui-selected': {
                  backgroundColor: bgColor,
                  boxShadow: neomorphBoxShadow,
                  color: accentColor,
                },
              },
            }}
          >
            <Tab label={t('physicalWorkplaces.bulk.csvImport')} />
            <Tab label={t('physicalWorkplaces.bulk.quickAdd')} />
          </Tabs>
        </Box>

        {/* CSV Import Tab */}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            {/* Download Template / Export Section */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: sectionBg,
                boxShadow: neomorphBoxShadow,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: accentColor }}>
                {t('physicalWorkplaces.bulk.step1')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                <Box
                  component="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadTemplateMutation.isPending}
                  sx={{
                    ...neomorphButtonSx,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    cursor: 'pointer',
                  }}
                >
                  <DownloadIcon sx={{ fontSize: 20 }} />
                  {downloadTemplateMutation.isPending
                    ? t('common.downloading')
                    : t('physicalWorkplaces.bulk.downloadTemplate')}
                </Box>
                <Box
                  component="button"
                  onClick={handleExportCsv}
                  disabled={exportCsvMutation.isPending}
                  sx={{
                    ...neomorphButtonSx,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    cursor: 'pointer',
                  }}
                >
                  <FileUploadIcon sx={{ fontSize: 20 }} />
                  {exportCsvMutation.isPending
                    ? t('common.exporting')
                    : t('physicalWorkplaces.bulk.exportCurrent')}
                </Box>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t('physicalWorkplaces.bulk.templateHint')}
              </Typography>
            </Box>

            {/* Upload Section */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: sectionBg,
                boxShadow: neomorphBoxShadow,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: accentColor }}>
                {t('physicalWorkplaces.bulk.step2')}
              </Typography>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
                <Box
                  component="button"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    ...neomorphButtonSx,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    cursor: 'pointer',
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 20 }} />
                  {t('physicalWorkplaces.bulk.selectFile')}
                </Box>
                {selectedFile && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </Typography>
                )}
              </Stack>

              {selectedFile && !importResult && (
                <Box
                  component="button"
                  onClick={handleImportCsv}
                  disabled={importCsvMutation.isPending}
                  sx={{
                    ...neomorphPrimaryButtonSx,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    mt: 2,
                    cursor: 'pointer',
                  }}
                >
                  {importCsvMutation.isPending ? (
                    <CircularProgress size={20} sx={{ color: '#fff' }} />
                  ) : (
                    <UploadFileIcon sx={{ fontSize: 20 }} />
                  )}
                  {importCsvMutation.isPending
                    ? t('common.importing')
                    : t('physicalWorkplaces.bulk.importNow')}
                </Box>
              )}
            </Box>

            {/* Import Results */}
            {importResult && (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: sectionBg,
                  boxShadow: neomorphBoxShadow,
                }}
              >
                <Alert
                  severity={importResult.isFullySuccessful ? 'success' : importResult.successCount > 0 ? 'warning' : 'error'}
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  {t('physicalWorkplaces.bulk.importResult', {
                    success: importResult.successCount,
                    errors: importResult.errorCount,
                    total: importResult.totalRows,
                  })}
                </Alert>

                {importResult.results.length > 0 && (
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                      maxHeight: 300,
                      borderRadius: 2,
                      boxShadow: neomorphInsetShadow,
                      backgroundColor: bgColor,
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ backgroundColor: bgColor, fontWeight: 600 }}>{t('common.row')}</TableCell>
                          <TableCell sx={{ backgroundColor: bgColor, fontWeight: 600 }}>{t('physicalWorkplaces.code')}</TableCell>
                          <TableCell sx={{ backgroundColor: bgColor, fontWeight: 600 }}>{t('physicalWorkplaces.name')}</TableCell>
                          <TableCell sx={{ backgroundColor: bgColor, fontWeight: 600 }}>{t('common.status')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importResult.results.map((row) => (
                          <TableRow key={row.rowNumber}>
                            <TableCell>{row.rowNumber}</TableCell>
                            <TableCell>{row.code || '-'}</TableCell>
                            <TableCell>{row.name || '-'}</TableCell>
                            <TableCell>
                              {row.success ? (
                                <Chip icon={<CheckCircleIcon />} label={t('common.success')} color="success" size="small" />
                              ) : (
                                <Chip icon={<ErrorIcon />} label={row.error} color="error" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </Stack>
        </TabPanel>

        {/* Quick Add Tab */}
        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              {t('physicalWorkplaces.bulk.quickAddHint')}
            </Alert>

            {/* Location Section */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: sectionBg,
                boxShadow: neomorphBoxShadow,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: accentColor }}>
                {t('physicalWorkplaces.location')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                <Box sx={{ flex: 1, ...neomorphTextFieldSx }}>
                  <BuildingSelect
                    value={bulkForm.buildingId ?? null}
                    onChange={(value) => setBulkForm({ ...bulkForm, buildingId: value ?? 0 })}
                    required
                  />
                </Box>
                <Box sx={{ flex: 1, ...neomorphTextFieldSx }}>
                  <ServiceSelect
                    value={bulkForm.serviceId ?? null}
                    onChange={(value) => setBulkForm({ ...bulkForm, serviceId: value ?? undefined })}
                  />
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label={t('physicalWorkplaces.floor')}
                  value={bulkForm.floor}
                  onChange={(e) => setBulkForm({ ...bulkForm, floor: e.target.value })}
                  sx={{ flex: 1, ...neomorphTextFieldSx }}
                />
                <TextField
                  label={t('physicalWorkplaces.room')}
                  value={bulkForm.room}
                  onChange={(e) => setBulkForm({ ...bulkForm, room: e.target.value })}
                  sx={{ flex: 1, ...neomorphTextFieldSx }}
                />
              </Stack>
            </Box>

            {/* Naming Section */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: sectionBg,
                boxShadow: neomorphBoxShadow,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: accentColor }}>
                {t('physicalWorkplaces.bulk.naming')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label={t('physicalWorkplaces.bulk.codePrefix')}
                  value={bulkForm.codePrefix}
                  onChange={(e) => setBulkForm({ ...bulkForm, codePrefix: e.target.value })}
                  required
                  placeholder="GH-BZ-L"
                  helperText={t('physicalWorkplaces.bulk.codePrefixHint')}
                  sx={{ flex: 1, ...neomorphTextFieldSx }}
                />
                <TextField
                  label={t('physicalWorkplaces.bulk.startNumber')}
                  type="number"
                  value={bulkForm.startNumber}
                  onChange={(e) => setBulkForm({ ...bulkForm, startNumber: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1, max: 999 }}
                  sx={{ width: 120, ...neomorphTextFieldSx }}
                />
                <TextField
                  label={t('physicalWorkplaces.bulk.count')}
                  type="number"
                  value={bulkForm.count}
                  onChange={(e) => setBulkForm({ ...bulkForm, count: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1, max: 100 }}
                  sx={{ width: 100, ...neomorphTextFieldSx }}
                />
              </Stack>
              <TextField
                label={t('physicalWorkplaces.bulk.nameTemplate')}
                value={bulkForm.nameTemplate}
                onChange={(e) => setBulkForm({ ...bulkForm, nameTemplate: e.target.value })}
                required
                placeholder="Loket {n} Burgerzaken"
                helperText={t('physicalWorkplaces.bulk.nameTemplateHint')}
                fullWidth
                sx={{ mt: 2, ...neomorphTextFieldSx }}
              />
            </Box>

            {/* Configuration Section */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: sectionBg,
                boxShadow: neomorphBoxShadow,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: accentColor }}>
                {t('physicalWorkplaces.configuration')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mt: 2 }}>
                <FormControl sx={{ minWidth: 150, ...neomorphTextFieldSx }}>
                  <InputLabel>{t('physicalWorkplaces.type')}</InputLabel>
                  <Select
                    value={bulkForm.type}
                    label={t('physicalWorkplaces.type')}
                    onChange={(e) => setBulkForm({ ...bulkForm, type: e.target.value as WorkplaceType })}
                  >
                    {Object.entries(WorkplaceTypeLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label={t('physicalWorkplaces.monitorCount')}
                  type="number"
                  value={bulkForm.monitorCount}
                  onChange={(e) => setBulkForm({ ...bulkForm, monitorCount: parseInt(e.target.value) || 0 })}
                  inputProps={{ min: 0, max: 10 }}
                  sx={{ width: 130, ...neomorphTextFieldSx }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={bulkForm.hasDockingStation}
                      onChange={(e) => setBulkForm({ ...bulkForm, hasDockingStation: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: accentColor,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: accentColor,
                        },
                      }}
                    />
                  }
                  label={t('physicalWorkplaces.hasDockingStation')}
                />
              </Stack>
            </Box>

            {/* Preview */}
            {bulkForm.buildingId > 0 && bulkForm.codePrefix && bulkForm.count > 0 && (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: sectionBg,
                  boxShadow: neomorphInsetShadow,
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: accentColor }}>
                  {t('physicalWorkplaces.bulk.preview')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Array.from({ length: Math.min(bulkForm.count, 3) }, (_, i) => {
                    const num = bulkForm.startNumber + i;
                    return `${bulkForm.codePrefix}${num.toString().padStart(2, '0')} - ${bulkForm.nameTemplate.replace('{n}', num.toString())}`;
                  }).join(', ')}
                  {bulkForm.count > 3 && `, ... (+${bulkForm.count - 3} more)`}
                </Typography>
              </Box>
            )}

            {/* Create Button */}
            <Box
              component="button"
              onClick={handleBulkCreate}
              disabled={
                bulkCreateMutation.isPending ||
                !bulkForm.buildingId ||
                !bulkForm.codePrefix ||
                !bulkForm.nameTemplate ||
                bulkForm.count < 1
              }
              sx={{
                ...neomorphPrimaryButtonSx,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                px: 3,
                py: 1.5,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              {bulkCreateMutation.isPending ? (
                <CircularProgress size={20} sx={{ color: '#fff' }} />
              ) : (
                <AddIcon sx={{ fontSize: 20 }} />
              )}
              {bulkCreateMutation.isPending
                ? t('common.creating')
                : t('physicalWorkplaces.bulk.createWorkplaces', { count: bulkForm.count })}
            </Box>

            {/* Bulk Create Results */}
            {bulkResult && (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: sectionBg,
                  boxShadow: neomorphBoxShadow,
                }}
              >
                <Alert
                  severity={bulkResult.errorCount === 0 ? 'success' : bulkResult.successCount > 0 ? 'warning' : 'error'}
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  {t('physicalWorkplaces.bulk.createResult', {
                    success: bulkResult.successCount,
                    errors: bulkResult.errorCount,
                  })}
                </Alert>

                {bulkResult.results.some(r => !r.success) && (
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                      maxHeight: 200,
                      borderRadius: 2,
                      boxShadow: neomorphInsetShadow,
                      backgroundColor: bgColor,
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ backgroundColor: bgColor, fontWeight: 600 }}>{t('physicalWorkplaces.code')}</TableCell>
                          <TableCell sx={{ backgroundColor: bgColor, fontWeight: 600 }}>{t('common.error')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bulkResult.results.filter(r => !r.success).map((row) => (
                          <TableRow key={row.code}>
                            <TableCell>{row.code}</TableCell>
                            <TableCell>{row.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </Stack>
        </TabPanel>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 3,
          borderTop: `1px solid ${isDark ? '#2a3038' : '#d0d7de'}`,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Box
          component="button"
          onClick={handleClose}
          sx={{
            ...neomorphButtonSx,
            px: 4,
            py: 1.5,
            cursor: 'pointer',
          }}
        >
          {t('common.close')}
        </Box>
      </Box>
    </Dialog>
  );
};

export default BulkImportWorkplacesDialog;
