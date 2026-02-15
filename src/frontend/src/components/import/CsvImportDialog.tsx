import { logger } from '../../utils/logger';
import { useState, useRef, DragEvent } from 'react';
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
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  FileDownload as FileDownloadIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { csvImportApi, CsvImportResult, CsvRowResult } from '../../api/csvImport.api';
import { useTranslation } from 'react-i18next';

interface CsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CsvImportDialog = ({ open, onClose, onSuccess }: CsvImportDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError(t('csvImport.fileTooLarge'));
        return;
      }
      setFile(selectedFile);
      setError(null);
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

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setShowErrors(false);
    setShowSuccess(false);
    onClose();
  };

  const successResults = result?.results.filter((r) => r.success) || [];
  const errorResults = result?.results.filter((r) => !r.success) || [];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'visible',
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
          <Typography variant="h5" fontWeight={700}>
            {t('csvImport.title')}
          </Typography>
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

        {/* Results Display */}
        {result ? (
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
              <Typography variant="h6" gutterBottom fontWeight={700}>
                {t('csvImport.importSummary')}
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
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
        ) : (
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
              onClick={() => fileInputRef.current?.click()}
              sx={{
                p: 4,
                borderRadius: 3,
                border: '2px dashed',
                borderColor: isDragActive ? theme.palette.primary.main : 'divider',
                bgcolor: isDragActive
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.02),
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow:
                  theme.palette.mode === 'light'
                    ? '2px 2px 8px rgba(0, 0, 0, 0.1), -2px -2px 8px rgba(255, 255, 255, 0.9)'
                    : '3px 3px 10px rgba(0, 0, 0, 0.6), -2px -2px 6px rgba(255, 255, 255, 0.03)',
                '&:hover': {
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
              />
              <Box sx={{ textAlign: 'center' }}>
                <CloudUploadIcon
                  sx={{
                    fontSize: 60,
                    color: theme.palette.primary.main,
                    mb: 2,
                    opacity: 0.7,
                  }}
                />
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {isDragActive
                    ? t('csvImport.dropHere')
                    : file
                    ? file.name
                    : t('csvImport.dragDropOrClick')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('csvImport.maxFileSize')} • {t('csvImport.csvOnly')}
                </Typography>
              </Box>
            </Paper>

            {/* Upload Progress */}
            {uploading && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress
                  sx={{
                    borderRadius: 5,
                    height: 8,
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, textAlign: 'center' }}
                >
                  {t('csvImport.uploading')}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {result ? (
          <>
            {result.errorCount > 0 && (
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadErrorReport}
              >
                {t('csvImport.downloadErrors')}
              </Button>
            )}
            <Button variant="contained" onClick={handleClose}>
              {t('common.close')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose} disabled={uploading}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!file || uploading}
              sx={{
                background: `linear-gradient(145deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                '&:hover': {
                  background: `linear-gradient(145deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                },
              }}
            >
              {uploading ? t('csvImport.uploading') : t('csvImport.upload')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CsvImportDialog;
