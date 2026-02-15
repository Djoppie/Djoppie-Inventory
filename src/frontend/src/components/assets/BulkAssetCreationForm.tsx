import { useState, useCallback } from 'react';
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
  Fade,
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
  Work,
  LocationOn,
  CloudUpload,
  TableChart,
  Description,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
import { BulkCreateAssetDto, AssetTemplate } from '../../types/asset.types';
import { GraphUser } from '../../types/graph.types';
import UserAutocomplete from '../common/UserAutocomplete';
import AssetTypeSelect from '../common/AssetTypeSelect';
import CsvImportDialog from '../import/CsvImportDialog';
import { csvImportApi } from '../../api/csvImport.api';

type BulkMode = 'template' | 'csv';

interface BulkAssetCreationFormProps {
  onSubmit: (data: BulkCreateAssetDto) => void | Promise<void>;
  onCancel: () => void;
  onCsvImportSuccess?: () => void;
  isLoading?: boolean;
}

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
        brand: template.brand || '',
        model: template.model || '',
        owner: template.owner || prev.owner || '',
        building: template.installationLocation || prev.building || '',
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
    if (!formData.category.trim()) newErrors.category = t('assetForm.validationError');
    // Owner and Building are now optional
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
                          {template.assetType && <Chip label={template.assetType.name} size="small" />}
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

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <AssetTypeSelect
                      value={formData.assetTypeId || 0}
                      onChange={(id) => handleChange('assetTypeId', id)}
                      error={!!errors.assetTypeId}
                      helperText={errors.assetTypeId}
                      required
                      sx={{ flex: '1 1 200px' }}
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
                  </Box>
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
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <CloudUpload color="primary" />
                <Typography variant="h6" color="primary">
                  {t('bulkCreate.csvUpload')}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('bulkCreate.csvModeDesc')}
              </Typography>

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
            {bulkMode === 'template' && (
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                size="large"
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                sx={{ minWidth: 200 }}
              >
                {isLoading
                  ? t('bulkCreate.creating')
                  : t('bulkCreate.createButton', { count: formData.quantity })
                }
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BulkAssetCreationForm;
