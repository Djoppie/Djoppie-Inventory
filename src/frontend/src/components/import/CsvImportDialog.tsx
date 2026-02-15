import { logger } from '../../utils/logger';
import { useState, useRef, DragEvent, useMemo } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Stack,
  Divider,
  alpha,
  useTheme,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  FileDownload as FileDownloadIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowBack as ArrowBackIcon,
  TableChart as TableChartIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { csvImportApi, CsvImportResult, CsvRowResult } from '../../api/csvImport.api';
import { useTranslation } from 'react-i18next';

interface CsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// CSV row structure for preview (parsed locally for display)
interface CsvPreviewRow {
  rowNumber: number;
  serialNumber: string;
  assetTypeCode: string;
  status: string;
  purchaseDate: string;
  isDummy: string;
  assetName: string;
  buildingCode: string;
  serviceCode: string;
  owner: string;
  brand: string;
  model: string;
  installationDate: string;
  warrantyExpiry: string;
  notes: string;
  // Validation from server
  hasError: boolean;
  errorMessage: string;
}

type DialogStep = 'upload' | 'preview' | 'result';

const CsvImportDialog = ({ open, onClose, onSuccess }: CsvImportDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<DialogStep>('upload');
  const [previewData, setPreviewData] = useState<CsvPreviewRow[]>([]);
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [validationResult, setValidationResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expected CSV headers
  const expectedHeaders = [
    'SerialNumber',
    'AssetTypeCode',
    'Status',
    'PurchaseDate',
    'IsDummy',
    'AssetName',
    'BuildingCode',
    'ServiceCode',
    'Owner',
    'Brand',
    'Model',
    'InstallationDate',
    'WarrantyExpiry',
    'Notes',
  ];

  const parseCsvFile = (content: string, validationResults?: CsvRowResult[]): CsvPreviewRow[] => {
    const lines = content.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'));
    if (lines.length < 2) return [];

    // Create a map of validation errors by row number
    const errorsByRow = new Map<number, string[]>();
    if (validationResults) {
      validationResults.forEach((r) => {
        if (!r.success && r.errors.length > 0) {
          errorsByRow.set(r.rowNumber, r.errors);
        }
      });
    }

    const rows: CsvPreviewRow[] = [];
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      if (values.length === 0 || values.every((v) => !v.trim())) continue;

      const rowNumber = i;
      const errors = errorsByRow.get(rowNumber) || [];

      rows.push({
        rowNumber,
        serialNumber: values[0] || '',
        assetTypeCode: values[1] || '',
        status: values[2] || 'Stock',
        purchaseDate: values[3] || '',
        isDummy: values[4] || 'false',
        assetName: values[5] || '',
        buildingCode: values[6] || '',
        serviceCode: values[7] || '',
        owner: values[8] || '',
        brand: values[9] || '',
        model: values[10] || '',
        installationDate: values[11] || '',
        warrantyExpiry: values[12] || '',
        notes: values[13] || '',
        hasError: errors.length > 0,
        errorMessage: errors.join('; '),
      });
    }
    return rows;
  };

  const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          currentValue += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    return values;
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError(t('csvImport.fileTooLarge'));
        return;
      }
      setFile(selectedFile);
      setError(null);
      setValidating(true);

      try {
        // Read file content for display
        const content = await selectedFile.text();

        // Validate with backend API
        const validation = await csvImportApi.validateCsv(selectedFile);
        setValidationResult(validation);

        // Parse CSV with validation results for display
        const rows = parseCsvFile(content, validation.results);
        if (rows.length === 0) {
          setError(t('csvImport.emptyFile'));
          setValidating(false);
          return;
        }

        setPreviewData(rows);
        setStep('preview');
        setPage(0);
      } catch (err) {
        logger.error('CSV validation failed:', err);
        setError(err instanceof Error ? err.message : t('csvImport.parseError'));
      } finally {
        setValidating(false);
      }
    } else {
      setError(t('csvImport.invalidFileType'));
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const importResult = await csvImportApi.importCsv(file);
      setResult(importResult);
      setStep('result');

      if (importResult.successCount > 0 && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      logger.error('CSV import failed:', err);
      setError(err instanceof Error ? err.message : t('csvImport.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await csvImportApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'asset-import-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Template download failed:', err);
      setError(t('csvImport.templateDownloadFailed'));
    }
  };

  const handleDownloadErrorReport = () => {
    if (!result) return;

    const errors = result.results
      .filter((r) => !r.success)
      .map((r) => `Row ${r.rowNumber}: ${r.errors.join('; ')}`)
      .join('\n');

    const blob = new Blob([errors], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import-errors.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleBack = () => {
    setStep('upload');
    setPreviewData([]);
    setValidationResult(null);
    setFile(null);
  };

  const handleClose = () => {
    setFile(null);
    setStep('upload');
    setPreviewData([]);
    setResult(null);
    setValidationResult(null);
    setError(null);
    setShowErrors(false);
    setShowSuccess(false);
    setPage(0);
    onClose();
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const successResults = result?.results.filter((r) => r.success) || [];
  const errorResults = result?.results.filter((r) => !r.success) || [];
  const rowsWithErrors = useMemo(() => previewData.filter((r) => r.hasError).length, [previewData]);
  const validRows = useMemo(() => previewData.filter((r) => !r.hasError).length, [previewData]);

  // Visible columns for preview table
  const visibleColumns = [
    { id: 'serialNumber', label: 'SerialNumber', minWidth: 120 },
    { id: 'assetTypeCode', label: 'Type', minWidth: 70 },
    { id: 'status', label: 'Status', minWidth: 90 },
    { id: 'purchaseDate', label: 'Purchase', minWidth: 100 },
    { id: 'isDummy', label: 'Dummy', minWidth: 60 },
    { id: 'buildingCode', label: 'Building', minWidth: 80 },
    { id: 'serviceCode', label: 'Service', minWidth: 80 },
    { id: 'assetName', label: 'Name', minWidth: 120 },
  ];

  const paginatedData = useMemo(() => {
    return previewData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [previewData, page, rowsPerPage]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'visible',
          minHeight: step === 'preview' ? '80vh' : 'auto',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(145deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          color: '#fff',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {step === 'preview' && (
              <IconButton onClick={handleBack} sx={{ color: '#fff', mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
            )}
            <TableChartIcon sx={{ mr: 1 }} />
            <Typography variant="h5" fontWeight={700}>
              {step === 'upload' && t('csvImport.title')}
              {step === 'preview' && t('csvImport.preview')}
              {step === 'result' && t('csvImport.importSummary')}
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{
              color: '#fff',
              '&:hover': { bgcolor: alpha('#fff', 0.1) },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <Box>
            {/* Download Template Button */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownloadTemplate}
              sx={{
                mb: 3,
                borderRadius: 2,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                fontWeight: 600,
                py: 1.5,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              {t('csvImport.downloadTemplate')}
            </Button>

            <Divider sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t('common.or')}
              </Typography>
            </Divider>

            {/* Upload Area */}
            <Paper
              elevation={0}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !validating && fileInputRef.current?.click()}
              sx={{
                p: 4,
                borderRadius: 3,
                border: '2px dashed',
                borderColor: isDragActive ? theme.palette.primary.main : 'divider',
                bgcolor: isDragActive
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.02),
                cursor: validating ? 'wait' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow:
                  theme.palette.mode === 'light'
                    ? '2px 2px 8px rgba(0, 0, 0, 0.1), -2px -2px 8px rgba(255, 255, 255, 0.9)'
                    : '3px 3px 10px rgba(0, 0, 0, 0.6), -2px -2px 6px rgba(255, 255, 255, 0.03)',
                '&:hover': validating
                  ? {}
                  : {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      transform: 'translateY(-2px)',
                    },
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                disabled={validating}
              />
              <Box sx={{ textAlign: 'center' }}>
                {validating ? (
                  <>
                    <CircularProgress size={60} sx={{ mb: 2 }} />
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      {t('csvImport.validating')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {file?.name}
                    </Typography>
                  </>
                ) : (
                  <>
                    <CloudUploadIcon
                      sx={{
                        fontSize: 60,
                        color: theme.palette.primary.main,
                        mb: 2,
                        opacity: 0.7,
                      }}
                    />
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      {isDragActive ? t('csvImport.dropHere') : t('csvImport.dragDropOrClick')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('csvImport.maxFileSize')} • {t('csvImport.csvOnly')}
                    </Typography>
                  </>
                )}
              </Box>
            </Paper>
          </Box>
        )}

        {/* STEP 2: Preview Table */}
        {step === 'preview' && (
          <Box>
            {/* Summary */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`${validRows} ${t('csvImport.validRows')}`}
                  color="success"
                  sx={{ fontWeight: 600 }}
                />
                {rowsWithErrors > 0 && (
                  <Chip
                    icon={<ErrorIcon />}
                    label={`${rowsWithErrors} ${t('csvImport.rowsWithErrors')}`}
                    color="error"
                    sx={{ fontWeight: 600 }}
                  />
                )}
                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                  {file?.name}
                </Typography>
              </Stack>
            </Paper>

            {/* Preview Table */}
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                maxHeight: 'calc(80vh - 350px)',
                boxShadow:
                  theme.palette.mode === 'light'
                    ? '4px 4px 10px rgba(0, 0, 0, 0.1), -4px -4px 10px rgba(255, 255, 255, 0.9)'
                    : '4px 4px 12px rgba(0, 0, 0, 0.5), -2px -2px 8px rgba(255, 255, 255, 0.04)',
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>#</TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.id}
                        sx={{
                          fontWeight: 700,
                          minWidth: col.minWidth,
                          bgcolor: 'background.paper',
                        }}
                      >
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row, idx) => (
                    <TableRow
                      key={row.rowNumber}
                      sx={{
                        bgcolor: row.hasError
                          ? alpha(theme.palette.error.main, 0.1)
                          : idx % 2 === 0
                          ? 'background.default'
                          : 'background.paper',
                        '&:hover': {
                          bgcolor: row.hasError
                            ? alpha(theme.palette.error.main, 0.15)
                            : alpha(theme.palette.primary.main, 0.05),
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {row.hasError ? (
                            <Tooltip title={row.errorMessage}>
                              <ErrorIcon color="error" fontSize="small" />
                            </Tooltip>
                          ) : (
                            <CheckCircleIcon color="success" fontSize="small" />
                          )}
                          {row.rowNumber}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.serialNumber || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.assetTypeCode || '-'}
                          size="small"
                          color={row.assetTypeCode ? 'primary' : 'default'}
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>{row.status || 'Stock'}</TableCell>
                      <TableCell>{row.purchaseDate || '-'}</TableCell>
                      <TableCell>
                        {row.isDummy.toLowerCase() === 'true' ||
                        row.isDummy === '1' ||
                        row.isDummy.toLowerCase() === 'ja' ? (
                          <Chip label="Ja" size="small" color="secondary" sx={{ fontSize: '0.7rem' }} />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Nee
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{row.buildingCode || '-'}</TableCell>
                      <TableCell>{row.serviceCode || '-'}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.assetName || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={previewData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('common.rowsPerPage')}
            />

            {/* Upload Progress */}
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  sx={{
                    borderRadius: 5,
                    height: 8,
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  {t('csvImport.importing')}...
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* STEP 3: Results */}
        {step === 'result' && result && (
          <Box>
            {/* Summary */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                background:
                  theme.palette.mode === 'light'
                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(
                        theme.palette.primary.light,
                        0.1
                      )})`
                    : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.2)}, ${alpha(
                        theme.palette.primary.main,
                        0.1
                      )})`,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow:
                  theme.palette.mode === 'light'
                    ? '2px 2px 8px rgba(0, 0, 0, 0.1), -2px -2px 8px rgba(255, 255, 255, 0.9)'
                    : '3px 3px 10px rgba(0, 0, 0, 0.6), -2px -2px 6px rgba(255, 255, 255, 0.03)',
              }}
            >
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('csvImport.progress')}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {result.successCount} / {result.totalRows}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(result.successCount / result.totalRows) * 100}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${result.successCount} ${t('csvImport.imported')}`}
                    color="success"
                    sx={{ fontWeight: 600 }}
                  />
                  {result.errorCount > 0 && (
                    <Chip
                      icon={<ErrorIcon />}
                      label={`${result.errorCount} ${t('csvImport.failed')}`}
                      color="error"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>
              </Stack>
            </Paper>

            {/* Success List */}
            {successResults.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Button
                  fullWidth
                  onClick={() => setShowSuccess(!showSuccess)}
                  endIcon={showSuccess ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{
                    justifyContent: 'space-between',
                    textTransform: 'none',
                    color: 'success.main',
                    fontWeight: 600,
                  }}
                >
                  {t('csvImport.successfulImports')} ({successResults.length})
                </Button>
                <Collapse in={showSuccess}>
                  <List
                    dense
                    sx={{
                      maxHeight: 200,
                      overflow: 'auto',
                      mt: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {successResults.slice(0, 50).map((row: CsvRowResult, idx: number) => (
                      <ListItem
                        key={idx}
                        sx={{
                          bgcolor: idx % 2 === 0 ? 'background.default' : 'background.paper',
                          borderBottom: idx < successResults.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                        }}
                      >
                        <ListItemIcon>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600}>
                              {row.assetCode || row.serialNumber}
                            </Typography>
                          }
                          secondary={`Row ${row.rowNumber}`}
                        />
                      </ListItem>
                    ))}
                    {successResults.length > 50 && (
                      <ListItem>
                        <ListItemText
                          secondary={`... and ${successResults.length - 50} more`}
                          sx={{ textAlign: 'center' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Collapse>
              </Box>
            )}

            {/* Error List */}
            {errorResults.length > 0 && (
              <Box>
                <Button
                  fullWidth
                  onClick={() => setShowErrors(!showErrors)}
                  endIcon={showErrors ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{
                    justifyContent: 'space-between',
                    textTransform: 'none',
                    color: 'error.main',
                    fontWeight: 600,
                  }}
                >
                  {t('csvImport.errors')} ({errorResults.length})
                </Button>
                <Collapse in={showErrors}>
                  <List
                    dense
                    sx={{
                      maxHeight: 200,
                      overflow: 'auto',
                      mt: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'error.main',
                    }}
                  >
                    {errorResults.map((row: CsvRowResult, idx: number) => (
                      <ListItem
                        key={idx}
                        sx={{
                          bgcolor: alpha(theme.palette.error.main, 0.05),
                          borderBottom: idx < errorResults.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                        }}
                      >
                        <ListItemIcon>
                          <ErrorIcon color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600}>
                              Row {row.rowNumber}
                            </Typography>
                          }
                          secondary={row.errors.join(', ')}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {step === 'upload' && (
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
        )}

        {step === 'preview' && (
          <>
            <Button onClick={handleBack} disabled={uploading} startIcon={<ArrowBackIcon />}>
              {t('common.back')}
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button onClick={handleClose} disabled={uploading}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading || validRows === 0}
              sx={{
                background: `linear-gradient(145deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                '&:hover': {
                  background: `linear-gradient(145deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                },
              }}
            >
              {uploading
                ? t('csvImport.importing')
                : `${t('csvImport.import')} (${validRows} ${t('csvImport.assets')})`}
            </Button>
          </>
        )}

        {step === 'result' && (
          <>
            {result && result.errorCount > 0 && (
              <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleDownloadErrorReport}>
                {t('csvImport.downloadErrors')}
              </Button>
            )}
            <Button variant="contained" onClick={handleClose}>
              {t('common.close')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CsvImportDialog;
