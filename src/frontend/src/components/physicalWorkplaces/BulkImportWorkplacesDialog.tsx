import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  TextField,
  Alert,
  Stack,
  Divider,
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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: isMobile ? 0 : 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(255, 119, 0, 0.05)'
              : 'rgba(255, 119, 0, 0.02)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <UploadFileIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            {t('physicalWorkplaces.bulk.title')}
          </Typography>
        </Stack>
        <IconButton size="small" onClick={handleClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={t('physicalWorkplaces.bulk.csvImport')} />
          <Tab label={t('physicalWorkplaces.bulk.quickAdd')} />
        </Tabs>

        {/* CSV Import Tab */}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            {/* Download Template / Export Section */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('physicalWorkplaces.bulk.step1')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadTemplate}
                  disabled={downloadTemplateMutation.isPending}
                >
                  {downloadTemplateMutation.isPending
                    ? t('common.downloading')
                    : t('physicalWorkplaces.bulk.downloadTemplate')}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<FileUploadIcon />}
                  onClick={handleExportCsv}
                  disabled={exportCsvMutation.isPending}
                >
                  {exportCsvMutation.isPending
                    ? t('common.exporting')
                    : t('physicalWorkplaces.bulk.exportCurrent')}
                </Button>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('physicalWorkplaces.bulk.templateHint')}
              </Typography>
            </Box>

            <Divider />

            {/* Upload Section */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('physicalWorkplaces.bulk.step2')}
              </Typography>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('physicalWorkplaces.bulk.selectFile')}
                </Button>
                {selectedFile && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </Typography>
                )}
              </Stack>
            </Box>

            {selectedFile && !importResult && (
              <Button
                variant="contained"
                startIcon={importCsvMutation.isPending ? <CircularProgress size={20} /> : <UploadFileIcon />}
                onClick={handleImportCsv}
                disabled={importCsvMutation.isPending}
              >
                {importCsvMutation.isPending
                  ? t('common.importing')
                  : t('physicalWorkplaces.bulk.importNow')}
              </Button>
            )}

            {/* Import Results */}
            {importResult && (
              <Box>
                <Alert
                  severity={importResult.isFullySuccessful ? 'success' : importResult.successCount > 0 ? 'warning' : 'error'}
                  sx={{ mb: 2 }}
                >
                  {t('physicalWorkplaces.bulk.importResult', {
                    success: importResult.successCount,
                    errors: importResult.errorCount,
                    total: importResult.totalRows,
                  })}
                </Alert>

                {importResult.results.length > 0 && (
                  <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 300, border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('common.row')}</TableCell>
                          <TableCell>{t('physicalWorkplaces.code')}</TableCell>
                          <TableCell>{t('physicalWorkplaces.name')}</TableCell>
                          <TableCell>{t('common.status')}</TableCell>
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
          <Stack spacing={2}>
            <Alert severity="info">
              {t('physicalWorkplaces.bulk.quickAddHint')}
            </Alert>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <BuildingSelect
                  value={bulkForm.buildingId ?? null}
                  onChange={(value) => setBulkForm({ ...bulkForm, buildingId: value ?? 0 })}
                  required
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <ServiceSelect
                  value={bulkForm.serviceId ?? null}
                  onChange={(value) => setBulkForm({ ...bulkForm, serviceId: value ?? undefined })}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('physicalWorkplaces.bulk.codePrefix')}
                value={bulkForm.codePrefix}
                onChange={(e) => setBulkForm({ ...bulkForm, codePrefix: e.target.value })}
                required
                placeholder="GH-BZ-L"
                helperText={t('physicalWorkplaces.bulk.codePrefixHint')}
                sx={{ flex: 1 }}
              />
              <TextField
                label={t('physicalWorkplaces.bulk.startNumber')}
                type="number"
                value={bulkForm.startNumber}
                onChange={(e) => setBulkForm({ ...bulkForm, startNumber: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: 999 }}
                sx={{ width: 120 }}
              />
              <TextField
                label={t('physicalWorkplaces.bulk.count')}
                type="number"
                value={bulkForm.count}
                onChange={(e) => setBulkForm({ ...bulkForm, count: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: 100 }}
                sx={{ width: 100 }}
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
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('physicalWorkplaces.floor')}
                value={bulkForm.floor}
                onChange={(e) => setBulkForm({ ...bulkForm, floor: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label={t('physicalWorkplaces.room')}
                value={bulkForm.room}
                onChange={(e) => setBulkForm({ ...bulkForm, room: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>{t('physicalWorkplaces.type')}</InputLabel>
                <Select
                  value={bulkForm.type}
                  label={t('physicalWorkplaces.type')}
                  onChange={(e) => setBulkForm({ ...bulkForm, type: e.target.value as WorkplaceType })}
                >
                  {Object.entries(WorkplaceTypeLabels).map(([value, label]) => (
                    <MenuItem key={value} value={Number(value)}>
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
                sx={{ width: 130 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={bulkForm.hasDockingStation}
                    onChange={(e) => setBulkForm({ ...bulkForm, hasDockingStation: e.target.checked })}
                  />
                }
                label={t('physicalWorkplaces.hasDockingStation')}
              />
            </Stack>

            {/* Preview */}
            {bulkForm.buildingId > 0 && bulkForm.codePrefix && bulkForm.count > 0 && (
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
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

            <Button
              variant="contained"
              startIcon={bulkCreateMutation.isPending ? <CircularProgress size={20} /> : <AddIcon />}
              onClick={handleBulkCreate}
              disabled={
                bulkCreateMutation.isPending ||
                !bulkForm.buildingId ||
                !bulkForm.codePrefix ||
                !bulkForm.nameTemplate ||
                bulkForm.count < 1
              }
            >
              {bulkCreateMutation.isPending
                ? t('common.creating')
                : t('physicalWorkplaces.bulk.createWorkplaces', { count: bulkForm.count })}
            </Button>

            {/* Bulk Create Results */}
            {bulkResult && (
              <Box>
                <Alert
                  severity={bulkResult.errorCount === 0 ? 'success' : bulkResult.successCount > 0 ? 'warning' : 'error'}
                  sx={{ mb: 2 }}
                >
                  {t('physicalWorkplaces.bulk.createResult', {
                    success: bulkResult.successCount,
                    errors: bulkResult.errorCount,
                  })}
                </Alert>

                {bulkResult.results.some(r => !r.success) && (
                  <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 200, border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('physicalWorkplaces.code')}</TableCell>
                          <TableCell>{t('common.error')}</TableCell>
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
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose} variant="outlined">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkImportWorkplacesDialog;
