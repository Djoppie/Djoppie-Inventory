import { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
  Typography,
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
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as AutoAwesomeIcon,
  Science,
  Business,
  QrCode,
  Person,
  LocationOn,
  CloudUpload,
  TableChart,
  Description,
  Download as DownloadIcon,
  Computer,
  CalendarMonth,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
import { BulkCreateAssetDto, AssetTemplate } from '../../types/asset.types';
import UserAutocomplete from '../common/UserAutocomplete';
import AssetTypeSelect from '../common/AssetTypeSelect';
import ServiceSelect from '../common/ServiceSelect';
import CsvImportDialog from '../import/CsvImportDialog';
import { csvImportApi } from '../../api/csvImport.api';

type BulkMode = 'template' | 'csv';

interface BulkAssetCreationFormProps {
  onSubmit: (data: BulkCreateAssetDto) => void | Promise<void>;
  onCancel: () => void;
  onCsvImportSuccess?: () => void;
  isLoading?: boolean;
}

// Reusable Section Card matching the scanner-card banner style (same as AssetForm)
interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SectionCard = ({ icon, title, description, children }: SectionCardProps) => (
  <Card
    elevation={0}
    sx={{
      mb: 3,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        borderColor: 'primary.main',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(255, 146, 51, 0.15)'
            : '0 4px 20px rgba(255, 119, 0, 0.1)',
      },
    }}
  >
    {/* Section Title Bar */}
    <Box
      sx={{
        px: 3,
        py: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.04)
            : alpha(theme.palette.primary.main, 0.02),
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: 'primary.main',
          filter: (theme) =>
            theme.palette.mode === 'dark'
              ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.4))'
              : 'none',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
          {title}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
    </Box>

    {/* Section Content */}
    <CardContent sx={{ p: 3 }}>
      {children}
    </CardContent>
  </Card>
);

const BulkAssetCreationForm = ({ onSubmit, onCancel, onCsvImportSuccess, isLoading }: BulkAssetCreationFormProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: templates, isLoading: templatesLoading } = useAssetTemplates();

  // Mode selection
  const [bulkMode, setBulkMode] = useState<BulkMode>('template');

  // Template mode state
  const [formData, setFormData] = useState<BulkCreateAssetDto>({
    assetTypeId: 0,
    serialNumberPrefix: '', // REQUIRED
    quantity: 1,
    isDummy: false,
    assetName: '',
    category: '',
    owner: '',
    serviceId: undefined,
    installationLocation: '',
    status: 'Stock',
    brand: '',
    model: '',
    purchaseDate: '',
    warrantyExpiry: '',
    installationDate: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // CSV import dialog state
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  // Download CSV template from backend (has correct columns + reference data)
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const blob = await csvImportApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'asset-import-template.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Silently fail - user can retry
    }
  }, []);

  // Template mode handlers - updated for relational template fields
  const handleTemplateChange = (templateId: number) => {
    setSelectedTemplate(templateId);
    if (templateId === 0) return;

    const template = templates?.find((t: AssetTemplate) => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        assetName: template.assetName || '',
        category: template.category || prev.category,
        assetTypeId: template.assetTypeId ?? prev.assetTypeId,
        serviceId: template.serviceId ?? prev.serviceId,
        installationLocation: template.installationLocation || prev.installationLocation || '',
        brand: template.brand || '',
        model: template.model || '',
        owner: template.owner || prev.owner || '',
        status: template.status || prev.status,
        purchaseDate: template.purchaseDate?.split('T')[0] || prev.purchaseDate,
        warrantyExpiry: template.warrantyExpiry?.split('T')[0] || prev.warrantyExpiry,
        installationDate: template.installationDate?.split('T')[0] || prev.installationDate,
        templateId: template.id,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.assetTypeId || formData.assetTypeId <= 0) newErrors.assetTypeId = t('assetForm.validationError');
    if (!formData.serialNumberPrefix.trim()) newErrors.serialNumberPrefix = t('bulkCreate.serialNumberPrefixRequired');
    if (formData.quantity < 1 || formData.quantity > 100) {
      newErrors.quantity = t('bulkCreate.quantityError');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only template mode uses the form submit - CSV uses the dialog
    if (bulkMode !== 'template') return;
    if (!validateForm()) return;
    onSubmit(formData);
  };

  const handleChange = (field: keyof BulkCreateAssetDto, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {/* Mode Selection */}
      <SectionCard
        icon={<CategoryIcon />}
        title={t('bulkCreate.title')}
        description={t('bulkCreate.modeDescription')}
      >
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
      </SectionCard>

      {/* Template Mode */}
      {bulkMode === 'template' && (
        <>
          {/* Template Selection */}
          <SectionCard
            icon={<AutoAwesomeIcon />}
            title={t('assetForm.templateSection')}
            description={t('assetForm.templateSectionDesc')}
          >
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
                      {template.assetType && <Chip label={template.assetType.name} size="small" />}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </SectionCard>

          {/* Identification Section */}
          <SectionCard
            icon={<QrCode />}
            title={t('assetForm.identificationSection')}
          >
            <Stack spacing={2.5}>
              {/* Auto-generated code chip + Dummy toggle */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip
                  icon={<QrCode />}
                  label={t('assetForm.codeAutoGenerated')}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
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
                    ml: 0,
                    p: 1,
                    borderRadius: 2,
                    bgcolor: formData.isDummy ? alpha(theme.palette.warning.main, 0.1) : 'transparent',
                    border: formData.isDummy ? `1px solid ${theme.palette.warning.main}` : '1px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                />
              </Box>

              {/* AssetType + Serial Prefix + Quantity */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <Box sx={{ flex: '1 1 250px' }}>
                  <AssetTypeSelect
                    value={formData.assetTypeId || null}
                    onChange={(id) => handleChange('assetTypeId', id ?? 0)}
                    error={!!errors.assetTypeId}
                    helperText={errors.assetTypeId}
                    required
                  />
                </Box>
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
              </Box>

              {/* AssetName + Status */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label={t('assetForm.alias')}
                  value={formData.assetName}
                  onChange={(e) => handleChange('assetName', e.target.value)}
                  helperText={t('assetForm.aliasHint')}
                />
                <FormControl sx={{ flex: '1 1 200px' }} required>
                  <InputLabel>{t('assetDetail.status')}</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    label={t('assetDetail.status')}
                  >
                    <MenuItem value="Stock">{t('statuses.stock')}</MenuItem>
                    <MenuItem value="InGebruik">{t('statuses.ingebruik')}</MenuItem>
                    <MenuItem value="Herstelling">{t('statuses.herstelling')}</MenuItem>
                    <MenuItem value="Defect">{t('statuses.defect')}</MenuItem>
                    <MenuItem value="UitDienst">{t('statuses.uitdienst')}</MenuItem>
                    <MenuItem value="Nieuw">{t('statuses.nieuw')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </SectionCard>

          {/* Location Section */}
          <SectionCard
            icon={<Business />}
            title={t('assetForm.locationSection')}
            description={t('assetForm.locationSectionDesc')}
          >
            <Stack spacing={2.5}>
              <ServiceSelect
                value={formData.serviceId ?? null}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, serviceId: value ?? undefined }));
                }}
                label={t('assetForm.service')}
                helperText={t('assetForm.serviceHint')}
              />
              <TextField
                fullWidth
                label={t('assetForm.installationLocation')}
                value={formData.installationLocation}
                onChange={(e) => handleChange('installationLocation', e.target.value)}
                helperText={t('assetForm.installationLocationHint')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </SectionCard>

          {/* Assignment Section */}
          <SectionCard
            icon={<Person />}
            title={t('assetForm.assignmentSection')}
            description={t('assetForm.assignmentSectionDesc')}
          >
            <UserAutocomplete
              value={formData.owner || ''}
              onChange={(displayName: string) => {
                handleChange('owner', displayName);
              }}
              label={t('assetDetail.primaryUser')}
              helperText={t('assetForm.ownerOptionalHint')}
            />
          </SectionCard>

          {/* Technical Details + Lifecycle (collapsible) */}
          <Card
            elevation={0}
            sx={{
              mb: 3,
              border: '1px solid',
              borderColor: showAdvanced ? 'primary.main' : 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(255, 146, 51, 0.15)'
                    : '0 4px 20px rgba(255, 119, 0, 0.1)',
              },
            }}
          >
            {/* Collapsible Title Bar */}
            <Box
              onClick={() => setShowAdvanced(!showAdvanced)}
              sx={{
                px: 3,
                py: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                borderBottom: showAdvanced ? '1px solid' : 'none',
                borderColor: 'divider',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.04)
                    : alpha(theme.palette.primary.main, 0.02),
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.primary.main, 0.08)
                      : alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'primary.main',
                  filter: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.4))'
                      : 'none',
                }}
              >
                <Computer />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                  {t('bulkCreate.advancedOptions')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('assetForm.technicalSection')} & {t('assetForm.lifecycleSection')}
                </Typography>
              </Box>
              {showAdvanced ? (
                <ExpandLessIcon sx={{ color: 'primary.main' }} />
              ) : (
                <ExpandMoreIcon sx={{ color: 'text.secondary' }} />
              )}
            </Box>

            <Collapse in={showAdvanced}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                  {/* Technical Details */}
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

                  {/* Lifecycle dates */}
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <CalendarMonth sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {t('assetForm.lifecycleSection')}
                      </Typography>
                    </Stack>
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
                </Stack>
              </CardContent>
            </Collapse>
          </Card>
        </>
      )}

      {/* CSV Import Mode */}
      {bulkMode === 'csv' && (
        <SectionCard
          icon={<CloudUpload />}
          title={t('bulkCreate.csvUpload')}
          description={t('bulkCreate.csvModeDesc')}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.default, 0.5),
            }}
          >
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('bulkCreate.csvUpload')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              SerialNumber, AssetTypeCode, Status, PurchaseDate, ...
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
              {t('bulkCreate.csvHelp')}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                sx={{ textTransform: 'none' }}
              >
                {t('bulkCreate.downloadTemplate')}
              </Button>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => setCsvDialogOpen(true)}
              >
                {t('bulkCreate.csvUpload')}
              </Button>
            </Stack>
          </Paper>

          <CsvImportDialog
            open={csvDialogOpen}
            onClose={() => setCsvDialogOpen(false)}
            onSuccess={() => {
              setCsvDialogOpen(false);
              onCsvImportSuccess?.();
            }}
          />
        </SectionCard>
      )}

      {/* Form Actions */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end',
          mt: 1,
        }}
      >
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isLoading}
          size="large"
          sx={{ minWidth: 120, height: 48 }}
        >
          {t('common.cancel')}
        </Button>
        {bulkMode === 'template' && (
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            size="large"
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            sx={{ minWidth: 200, height: 48 }}
          >
            {isLoading
              ? t('bulkCreate.creating')
              : t('bulkCreate.createButton', { count: formData.quantity })
            }
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default BulkAssetCreationForm;
