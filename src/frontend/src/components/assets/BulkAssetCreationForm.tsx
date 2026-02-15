import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Chip,
  Stack,
  Collapse,
  Paper,
  FormControlLabel,
  Checkbox,
  alpha,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Tooltip,
  LinearProgress,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Preview as PreviewIcon,
  AutoAwesome as AutoAwesomeIcon,
  Science,
  Business,
  QrCode,
  Person,
  Work,
  LocationOn,
  CloudUpload,
  TableChart,
  Description,
  Delete as DeleteIcon,
  CheckCircle,
  Error as ErrorIcon,
  Download as DownloadIcon,
  HelpOutline,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
import { BulkCreateAssetDto, AssetTemplate, CreateAssetDto } from '../../types/asset.types';
import { GraphUser } from '../../types/graph.types';
import UserAutocomplete from '../common/UserAutocomplete';

type BulkMode = 'template' | 'csv';

interface CsvAsset {
  serialNumber: string;  // REQUIRED - primary device identifier
  assetCodePrefix: string;  // REQUIRED
  category: string;  // REQUIRED
  assetName: string;  // Optional but we store it
  status: string;
  building: string;  // Optional
  owner: string;  // Optional
  department?: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
  isDummy?: boolean;
  isValid: boolean;
  errors: string[];
}

interface BulkAssetCreationFormProps {
  onSubmit: (data: BulkCreateAssetDto) => void | Promise<void>;
  onSubmitMultiple?: (assets: CreateAssetDto[]) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// CSV column mapping - updated for new asset structure
const CSV_COLUMNS = [
  { key: 'serialNumber', label: 'Serial Number', required: true },  // REQUIRED - primary device identifier
  { key: 'assetCodePrefix', label: 'Code Prefix', required: true },
  { key: 'category', label: 'Category', required: true },
  { key: 'assetName', label: 'Alias', required: false },  // Optional - friendly name
  { key: 'status', label: 'Status', required: false },
  { key: 'building', label: 'Installation Location', required: false },  // Optional
  { key: 'owner', label: 'Primary User', required: false },  // Optional
  { key: 'department', label: 'Department', required: false },
  { key: 'brand', label: 'Brand', required: false },
  { key: 'model', label: 'Model', required: false },
  { key: 'purchaseDate', label: 'Purchase Date', required: false },
  { key: 'warrantyExpiry', label: 'Warranty Expiry', required: false },
  { key: 'installationDate', label: 'Installation Date', required: false },
  { key: 'isDummy', label: 'Is Dummy', required: false },
];

const VALID_STATUSES = ['InGebruik', 'Stock', 'Herstelling', 'Defect', 'UitDienst', 'Nieuw'];

// Parse date string in multiple formats (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD)
// Returns ISO date string (YYYY-MM-DD) or null if invalid
const parseDateString = (dateStr: string): string | null => {
  if (!dateStr || !dateStr.trim()) return null;

  const trimmed = dateStr.trim();

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) return trimmed;
  }

  // Try European format DD-MM-YYYY or DD/MM/YYYY
  const euroMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (euroMatch) {
    const [, day, month, year] = euroMatch;
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(isoDate);
    // Validate the date is real (not like 31-02-2024)
    if (!isNaN(date.getTime()) &&
        date.getDate() === parseInt(day) &&
        date.getMonth() + 1 === parseInt(month)) {
      return isoDate;
    }
  }

  // Try US format MM/DD/YYYY (less common but Date.parse handles it)
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const date = new Date(parsed);
    return date.toISOString().split('T')[0];
  }

  return null;
};

const BulkAssetCreationForm = ({ onSubmit, onSubmitMultiple, onCancel, isLoading }: BulkAssetCreationFormProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: templates, isLoading: templatesLoading } = useAssetTemplates();

  // Mode selection
  const [bulkMode, setBulkMode] = useState<BulkMode>('template');

  // Template mode state
  const [formData, setFormData] = useState<BulkCreateAssetDto>({
    assetCodePrefix: '',
    serialNumberPrefix: '', // REQUIRED
    quantity: 1,
    isDummy: false,
    assetName: '',
    category: '',
    building: '',
    owner: '',
    department: '',
    officeLocation: '',
    status: 'Stock', // Default to Stock
    brand: '',
    model: '',
    purchaseDate: '',
    warrantyExpiry: '',
    installationDate: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // CSV mode state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvAssets, setCsvAssets] = useState<CsvAsset[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Generate preview of asset codes (template mode)
  const previewCodes = useMemo(() => {
    if (formData.assetCodePrefix && formData.quantity > 0) {
      const codes: string[] = [];
      const startNum = formData.isDummy ? 9000 : 1;
      for (let i = 0; i < Math.min(formData.quantity, 5); i++) {
        const num = startNum + i;
        codes.push(`${formData.assetCodePrefix}-${num.toString().padStart(4, '0')}`);
      }
      if (formData.quantity > 5) {
        codes.push('...');
      }
      return codes;
    }
    return [];
  }, [formData.assetCodePrefix, formData.quantity, formData.isDummy]);

  // CSV validation - updated for new asset structure
  const validateCsvAsset = (row: Record<string, string>): CsvAsset => {
    const errors: string[] = [];

    // Required field validation - SerialNumber is now the primary identifier
    if (!row.serialNumber?.trim()) errors.push('Serial Number is required');
    if (!row.assetCodePrefix?.trim()) errors.push('Code Prefix is required');
    if (!row.category?.trim()) errors.push('Category is required');
    // Note: assetName, building, and owner are now optional

    // Status validation - default to Stock for new assets
    const status = row.status?.trim() || 'Stock';
    if (row.status && !VALID_STATUSES.includes(status)) {
      errors.push(`Invalid status: ${status}`);
    }

    // Date validation and parsing - supports DD-MM-YYYY, DD/MM/YYYY, and YYYY-MM-DD formats
    const dateFields = ['purchaseDate', 'warrantyExpiry', 'installationDate'] as const;
    const parsedDates: Record<string, string | undefined> = {};

    dateFields.forEach(field => {
      if (row[field]) {
        const parsed = parseDateString(row[field]);
        if (parsed === null) {
          errors.push(`Invalid date format for ${field} (use DD-MM-YYYY or YYYY-MM-DD)`);
        } else {
          parsedDates[field] = parsed;
        }
      }
    });

    return {
      serialNumber: row.serialNumber?.trim() || '',  // Required
      assetCodePrefix: row.assetCodePrefix?.trim() || '',
      category: row.category?.trim() || '',
      assetName: row.assetName?.trim() || '',  // Optional
      status: status,
      building: row.building?.trim() || '',  // Optional
      owner: row.owner?.trim() || '',  // Optional
      department: row.department?.trim(),
      brand: row.brand?.trim(),
      model: row.model?.trim(),
      purchaseDate: parsedDates.purchaseDate,
      warrantyExpiry: parsedDates.warrantyExpiry,
      installationDate: parsedDates.installationDate,
      isDummy: row.isDummy?.toLowerCase() === 'true' || row.isDummy === '1',
      isValid: errors.length === 0,
      errors,
    };
  };

  // Parse CSV file
  const parseCsv = useCallback((content: string) => {
    // Filter out empty lines and comment lines (starting with #)
    const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
    if (lines.length < 2) {
      setCsvError(t('bulkCreate.csvNoData'));
      return;
    }

    // Parse header
    const header = lines[0].split(/[,;]/).map(h => h.trim().replace(/^["']|["']$/g, ''));

    // Map header to column keys
    const columnMap: Record<number, string> = {};
    header.forEach((col, idx) => {
      const matchedCol = CSV_COLUMNS.find(c =>
        c.label.toLowerCase() === col.toLowerCase() ||
        c.key.toLowerCase() === col.toLowerCase()
      );
      if (matchedCol) {
        columnMap[idx] = matchedCol.key;
      }
    });

    // Check required columns
    const requiredCols = CSV_COLUMNS.filter(c => c.required).map(c => c.key);
    const mappedCols = Object.values(columnMap);
    const missingCols = requiredCols.filter(c => !mappedCols.includes(c));

    if (missingCols.length > 0) {
      setCsvError(t('bulkCreate.csvMissingColumns', { columns: missingCols.join(', ') }));
      return;
    }

    // Parse data rows
    const assets: CsvAsset[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, string> = {};

      Object.entries(columnMap).forEach(([idx, key]) => {
        row[key] = values[parseInt(idx)] || '';
      });

      assets.push(validateCsvAsset(row));
    }

    setCsvAssets(assets);
    setCsvError(null);
  }, [t]);

  // Handle file drop/select
  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setCsvError(t('bulkCreate.csvInvalidType'));
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      parseCsv(content);
    };
    reader.onerror = () => {
      setCsvError(t('bulkCreate.csvReadError'));
    };
    reader.readAsText(file);
  }, [parseCsv, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  // Remove asset from CSV list
  const removeAsset = useCallback((index: number) => {
    setCsvAssets(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear CSV
  const clearCsv = useCallback(() => {
    setCsvFile(null);
    setCsvAssets([]);
    setCsvError(null);
  }, []);

  // Download template CSV - updated for new asset structure
  const downloadTemplate = useCallback(() => {
    const headers = CSV_COLUMNS.map(c => c.label).join(',');
    // Example with European date format (DD-MM-YYYY) and ISO format (YYYY-MM-DD) both work
    const exampleRow1 = 'SN-12345,LAP,Computing,Laptop Dell Latitude,Stock,Building A,John Doe,IT Department,Dell,Latitude 5520,15-01-2024,15-01-2027,20-01-2024,false';
    const exampleRow2 = 'SN-12346,MON,Displays,Monitor 24 inch,Stock,Building B,,Finance,Samsung,S24E450,2024-02-01,2027-02-01,2024-02-05,false';
    // Add a comment line explaining date formats
    const dateHint = '# Date formats: DD-MM-YYYY (European) or YYYY-MM-DD (ISO) are both supported';
    const content = `${dateHint}\n${headers}\n${exampleRow1}\n${exampleRow2}`;

    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk-assets-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // Template mode handlers - updated for optional template fields
  const handleTemplateChange = (templateId: number) => {
    setSelectedTemplate(templateId);
    if (templateId === 0) return;

    const template = templates?.find((t: AssetTemplate) => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        assetName: template.assetName || '',  // Optional
        category: template.category,
        brand: template.brand || '',  // Optional
        model: template.model || '',  // Optional
        owner: template.owner || prev.owner || '',  // Optional
        building: template.building || prev.building || '',  // Optional
        department: template.department || prev.department || '',  // Optional
        purchaseDate: template.purchaseDate?.split('T')[0] || prev.purchaseDate,
        warrantyExpiry: template.warrantyExpiry?.split('T')[0] || prev.warrantyExpiry,
        installationDate: template.installationDate?.split('T')[0] || prev.installationDate,
        templateId: template.id,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.assetCodePrefix.trim()) newErrors.assetCodePrefix = t('assetForm.validationError');
    if (!formData.serialNumberPrefix.trim()) newErrors.serialNumberPrefix = t('bulkCreate.serialNumberPrefixRequired');
    if (formData.quantity < 1 || formData.quantity > 100) {
      newErrors.quantity = t('bulkCreate.quantityError');
    }
    if (!formData.category.trim()) newErrors.category = t('assetForm.validationError');
    // Owner and Building are now optional
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (bulkMode === 'template') {
      if (!validateForm()) return;
      onSubmit(formData);
    } else {
      // CSV mode - submit valid assets
      const validAssets = csvAssets.filter(a => a.isValid);
      if (validAssets.length === 0) {
        setCsvError(t('bulkCreate.csvNoValidAssets'));
        return;
      }

      if (onSubmitMultiple) {
        const assetsToCreate: CreateAssetDto[] = validAssets.map(a => ({
          serialNumber: a.serialNumber,  // Required
          assetCodePrefix: a.assetCodePrefix,  // Required
          category: a.category,  // Required
          assetName: a.assetName || '',  // Optional but has default
          status: a.status || 'Stock',
          building: a.building || undefined,  // Optional
          owner: a.owner || undefined,  // Optional
          department: a.department || undefined,
          brand: a.brand || undefined,
          model: a.model || undefined,
          purchaseDate: a.purchaseDate || undefined,  // Don't send empty strings for dates
          warrantyExpiry: a.warrantyExpiry || undefined,
          installationDate: a.installationDate || undefined,
          isDummy: a.isDummy || false,
        }));
        onSubmitMultiple(assetsToCreate);
      }
    }
  };

  const handleChange = (field: keyof BulkCreateAssetDto, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Statistics for CSV mode
  const csvStats = useMemo(() => {
    const valid = csvAssets.filter(a => a.isValid).length;
    const invalid = csvAssets.length - valid;
    return { total: csvAssets.length, valid, invalid };
  }, [csvAssets]);

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Card
        elevation={2}
        sx={{
          position: 'relative',
          overflow: 'visible',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #FF9233, #FF7700, #CC0000)',
            borderRadius: '16px 16px 0 0',
          }
        }}
      >
        <CardContent sx={{ p: 3, pt: 4 }}>
          {/* Mode Selection */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
              {t('bulkCreate.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('bulkCreate.modeDescription')}
            </Typography>

            <ToggleButtonGroup
              value={bulkMode}
              exclusive
              onChange={(_, value) => value && setBulkMode(value)}
              fullWidth
              sx={{
                '& .MuiToggleButton-root': {
                  py: 2,
                  px: 3,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: 'divider',
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                  },
                },
              }}
            >
              <ToggleButton value="template">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Description />
                  <Box textAlign="left">
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('bulkCreate.templateMode')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('bulkCreate.templateModeDesc')}
                    </Typography>
                  </Box>
                </Stack>
              </ToggleButton>
              <ToggleButton value="csv">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <TableChart />
                  <Box textAlign="left">
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('bulkCreate.csvMode')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('bulkCreate.csvModeDesc')}
                    </Typography>
                  </Box>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Template Mode */}
          <Fade in={bulkMode === 'template'} unmountOnExit>
            <Box>
              {/* Template Selection */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <AutoAwesomeIcon color="primary" />
                  <Typography variant="h6" color="primary">
                    {t('assetForm.templateSection')}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('assetForm.templateSectionDesc')}
                </Typography>

                <FormControl fullWidth disabled={templatesLoading}>
                  <InputLabel>{t('assetForm.optional')}</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(Number(e.target.value))}
                    label={t('assetForm.optional')}
                  >
                    <MenuItem value={0}>
                      <em>{t('assetForm.noTemplate')}</em>
                    </MenuItem>
                    {templates?.map((template: AssetTemplate) => (
                      <MenuItem key={template.id} value={template.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {template.templateName}
                          </Typography>
                          <Chip label={template.category} size="small" />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Bulk Creation Settings */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <QrCode color="primary" />
                  <Typography variant="h6" color="primary">
                    {t('bulkCreate.settingsTitle')}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('bulkCreate.settingsDescription')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <TextField
                      sx={{ flex: '1 1 200px' }}
                      label={t('assetForm.codePrefix')}
                      value={formData.assetCodePrefix}
                      onChange={(e) => handleChange('assetCodePrefix', e.target.value.toUpperCase())}
                      error={!!errors.assetCodePrefix}
                      helperText={errors.assetCodePrefix || t('assetForm.codePrefixHint')}
                      required
                      inputProps={{ maxLength: 20 }}
                    />
                    <TextField
                      sx={{ flex: '1 1 200px' }}
                      label={t('bulkCreate.serialNumberPrefix')}
                      value={formData.serialNumberPrefix}
                      onChange={(e) => handleChange('serialNumberPrefix', e.target.value.toUpperCase())}
                      error={!!errors.serialNumberPrefix}
                      helperText={errors.serialNumberPrefix || t('bulkCreate.serialNumberPrefixHint')}
                      required
                      inputProps={{ maxLength: 50 }}
                    />
                    <TextField
                      sx={{ flex: '0 1 150px' }}
                      label={t('bulkCreate.quantity')}
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                      error={!!errors.quantity}
                      helperText={errors.quantity || t('bulkCreate.maxQuantity')}
                      required
                      inputProps={{ min: 1, max: 100 }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.isDummy || false}
                          onChange={(e) => handleChange('isDummy', e.target.checked)}
                          color="warning"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Science sx={{ fontSize: 20, color: 'warning.main' }} />
                          <Typography variant="body2">{t('assetForm.dummyAsset')}</Typography>
                        </Box>
                      }
                      sx={{
                        mt: 1,
                        ml: 0,
                        p: 1,
                        borderRadius: 2,
                        bgcolor: formData.isDummy ? alpha(theme.palette.warning.main, 0.1) : 'transparent',
                        border: formData.isDummy ? `1px solid ${theme.palette.warning.main}` : '1px solid transparent',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </Box>

                  {/* Preview Section */}
                  <Collapse in={previewCodes.length > 0}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        background: formData.isDummy
                          ? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)}, ${alpha(theme.palette.warning.main, 0.1)})`
                          : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                        borderRadius: 2,
                        border: '2px dashed',
                        borderColor: formData.isDummy ? 'warning.main' : 'primary.main',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                        <PreviewIcon color={formData.isDummy ? 'warning' : 'primary'} fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600} color={formData.isDummy ? 'warning.main' : 'primary'}>
                          {t('bulkCreate.preview', { count: formData.quantity })}
                        </Typography>
                        {formData.isDummy && (
                          <Chip
                            icon={<Science />}
                            label={t('assetForm.dummyAsset')}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {previewCodes.map((code, idx) => (
                          <Chip
                            key={idx}
                            label={code}
                            size="small"
                            color={formData.isDummy ? 'warning' : 'primary'}
                            variant="outlined"
                            sx={{ fontWeight: 600, fontFamily: 'monospace' }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Collapse>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Asset Identification */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  {t('assetForm.identificationSection')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label={t('assetForm.alias')}
                    value={formData.assetName}
                    onChange={(e) => handleChange('assetName', e.target.value)}
                    helperText={t('assetForm.aliasHint')}
                  />

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                      sx={{ flex: '1 1 200px' }}
                      label={t('assetDetail.category')}
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      error={!!errors.category}
                      helperText={errors.category}
                      required
                    />
                    <FormControl sx={{ flex: '0 1 200px' }} required>
                      <InputLabel>{t('assetDetail.status')}</InputLabel>
                      <Select
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        label={t('assetDetail.status')}
                      >
                        <MenuItem value="InGebruik">{t('statuses.ingebruik')}</MenuItem>
                        <MenuItem value="Stock">{t('statuses.stock')}</MenuItem>
                        <MenuItem value="Herstelling">{t('statuses.herstelling')}</MenuItem>
                        <MenuItem value="Defect">{t('statuses.defect')}</MenuItem>
                        <MenuItem value="UitDienst">{t('statuses.uitdienst')}</MenuItem>
                        <MenuItem value="Nieuw">{t('statuses.nieuw')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Installation Location (optional) */}
                  <TextField
                    fullWidth
                    label={t('assetForm.installationLocation')}
                    value={formData.building}
                    onChange={(e) => handleChange('building', e.target.value)}
                    helperText={t('assetForm.installationLocationHint')}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          <Business sx={{ color: 'primary.main' }} />
                        </Box>
                      ),
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Assignment Details */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Person color="primary" />
                  <Typography variant="h6" color="primary">
                    {t('assetForm.assignmentSection')}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('assetForm.assignmentSectionDesc')}
                </Typography>

                <Stack spacing={2.5}>
                  <UserAutocomplete
                    value={formData.owner || ''}
                    onChange={(displayName: string, user: GraphUser | null) => {
                      handleChange('owner', displayName);
                      if (user) {
                        if (user.department) handleChange('department', user.department);
                        if (user.officeLocation) handleChange('officeLocation', user.officeLocation || '');
                      }
                    }}
                    label={t('assetDetail.primaryUser')}
                    helperText={t('assetForm.ownerOptionalHint')}
                  />

                  {(formData.department || formData.officeLocation) && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        pl: 2,
                        py: 1,
                        borderLeft: `3px solid ${theme.palette.primary.main}`,
                        background: alpha(theme.palette.primary.main, 0.03),
                        borderRadius: '0 8px 8px 0',
                      }}
                    >
                      {formData.department && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Work sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {t('assetDetail.department')}:
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formData.department}
                          </Typography>
                        </Box>
                      )}
                      {formData.officeLocation && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {t('assetDetail.officeLocation')}:
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formData.officeLocation}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Advanced Options */}
              <Box sx={{ mb: 3 }}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ mb: 2, justifyContent: 'space-between', textTransform: 'none', fontSize: '1rem' }}
                >
                  <Typography variant="h6" color="primary">
                    {t('bulkCreate.advancedOptions')}
                  </Typography>
                </Button>

                <Collapse in={showAdvanced}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {t('bulkCreate.advancedDescription')}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <TextField
                        sx={{ flex: '1 1 200px' }}
                        label={t('assetDetail.brand')}
                        value={formData.brand}
                        onChange={(e) => handleChange('brand', e.target.value)}
                      />
                      <TextField
                        sx={{ flex: '1 1 200px' }}
                        label={t('assetDetail.model')}
                        value={formData.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                      />
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('assetForm.lifecycleSection')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <TextField
                        sx={{ flex: '1 1 200px' }}
                        label={t('assetDetail.purchaseDate')}
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) => handleChange('purchaseDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        sx={{ flex: '1 1 200px' }}
                        label={t('assetDetail.warrantyExpiry')}
                        type="date"
                        value={formData.warrantyExpiry}
                        onChange={(e) => handleChange('warrantyExpiry', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        sx={{ flex: '1 1 200px' }}
                        label={t('assetDetail.installationDate')}
                        type="date"
                        value={formData.installationDate}
                        onChange={(e) => handleChange('installationDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  </Box>
                </Collapse>
              </Box>
            </Box>
          </Fade>

          {/* CSV Import Mode */}
          <Fade in={bulkMode === 'csv'} unmountOnExit>
            <Box>
              {/* CSV Upload Area */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CloudUpload color="primary" />
                    <Typography variant="h6" color="primary">
                      {t('bulkCreate.csvUpload')}
                    </Typography>
                  </Stack>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={downloadTemplate}
                    sx={{ textTransform: 'none' }}
                  >
                    {t('bulkCreate.downloadTemplate')}
                  </Button>
                </Stack>

                {!csvFile ? (
                  <Paper
                    elevation={0}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      border: '2px dashed',
                      borderColor: isDragOver ? 'primary.main' : 'divider',
                      borderRadius: 3,
                      bgcolor: isDragOver
                        ? alpha(theme.palette.primary.main, 0.05)
                        : alpha(theme.palette.background.default, 0.5),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                      },
                    }}
                    onClick={() => document.getElementById('csv-file-input')?.click()}
                  >
                    <input
                      id="csv-file-input"
                      type="file"
                      accept=".csv"
                      hidden
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                    <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {t('bulkCreate.dropCsvHere')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('bulkCreate.orClickToSelect')}
                    </Typography>
                  </Paper>
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <TableChart color="primary" />
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {csvFile.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(csvFile.size / 1024).toFixed(1)} KB
                          </Typography>
                        </Box>
                      </Stack>
                      <IconButton onClick={clearCsv} size="small" color="error">
                        <CloseIcon />
                      </IconButton>
                    </Stack>
                  </Paper>
                )}

                {csvError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {csvError}
                  </Alert>
                )}
              </Box>

              {/* CSV Preview */}
              {csvAssets.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Divider sx={{ my: 3 }} />

                  {/* Statistics */}
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      {t('bulkCreate.csvPreview')}
                    </Typography>
                    <Chip
                      label={`${csvStats.total} ${t('bulkCreate.totalAssets')}`}
                      size="small"
                      color="default"
                    />
                    <Chip
                      icon={<CheckCircle />}
                      label={`${csvStats.valid} ${t('bulkCreate.validAssets')}`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                    {csvStats.invalid > 0 && (
                      <Chip
                        icon={<ErrorIcon />}
                        label={`${csvStats.invalid} ${t('bulkCreate.invalidAssets')}`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Stack>

                  {/* Progress bar */}
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(csvStats.valid / csvStats.total) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.error.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'success.main',
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>

                  {/* Preview Table */}
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                      maxHeight: 400,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Serial Number</TableCell>
                          <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Code Prefix</TableCell>
                          <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Category</TableCell>
                          <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Alias</TableCell>
                          <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Owner</TableCell>
                          <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }} align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {csvAssets.map((asset, idx) => (
                          <TableRow
                            key={idx}
                            sx={{
                              bgcolor: asset.isValid
                                ? 'inherit'
                                : alpha(theme.palette.error.main, 0.05),
                              '&:hover': {
                                bgcolor: asset.isValid
                                  ? alpha(theme.palette.primary.main, 0.03)
                                  : alpha(theme.palette.error.main, 0.1),
                              },
                            }}
                          >
                            <TableCell>
                              {asset.isValid ? (
                                <CheckCircle color="success" fontSize="small" />
                              ) : (
                                <Tooltip title={asset.errors.join(', ')}>
                                  <ErrorIcon color="error" fontSize="small" />
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={asset.serialNumber || '-'}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={asset.assetCodePrefix || '-'}
                                size="small"
                                color={asset.isDummy ? 'warning' : 'default'}
                                variant="outlined"
                                sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>{asset.category || '-'}</TableCell>
                            <TableCell>{asset.assetName || '-'}</TableCell>
                            <TableCell>{asset.owner || '-'}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => removeAsset(idx)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Help text */}
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HelpOutline fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {t('bulkCreate.csvHelp')}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Fade>

          {/* Form Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isLoading}
              size="large"
              sx={{ minWidth: 120 }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || (bulkMode === 'csv' && csvStats.valid === 0)}
              size="large"
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              sx={{ minWidth: 200 }}
            >
              {isLoading
                ? t('bulkCreate.creating')
                : bulkMode === 'template'
                  ? t('bulkCreate.createButton', { count: formData.quantity })
                  : t('bulkCreate.createCsvButton', { count: csvStats.valid })
              }
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BulkAssetCreationForm;
