import { useState, useMemo } from 'react';
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
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
import { BulkCreateAssetDto, AssetTemplate } from '../../types/asset.types';
import { GraphUser } from '../../types/graph.types';
import UserAutocomplete from '../common/UserAutocomplete';

interface BulkAssetCreationFormProps {
  onSubmit: (data: BulkCreateAssetDto) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const BulkAssetCreationForm = ({ onSubmit, onCancel, isLoading }: BulkAssetCreationFormProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: templates, isLoading: templatesLoading } = useAssetTemplates();

  const [formData, setFormData] = useState<BulkCreateAssetDto>({
    assetCodePrefix: '',
    quantity: 1,
    isDummy: false,
    assetName: '',
    category: '',
    building: '',
    owner: '',
    department: '',
    officeLocation: '',
    status: 'InGebruik',
    brand: '',
    model: '',
    serialNumberPrefix: '',
    purchaseDate: '',
    warrantyExpiry: '',
    installationDate: '',
  });

  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generate preview of asset codes
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

  const handleTemplateChange = (templateId: number) => {
    setSelectedTemplate(templateId);

    if (templateId === 0) return;

    const template = templates?.find((t: AssetTemplate) => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        assetName: template.assetName,
        category: template.category,
        brand: template.brand,
        model: template.model,
        owner: template.owner || prev.owner,
        building: template.building || prev.building,
        department: template.department || prev.department,
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
    if (formData.quantity < 1 || formData.quantity > 100) {
      newErrors.quantity = t('bulkCreate.quantityError');
    }
    if (!formData.assetName.trim()) newErrors.assetName = t('assetForm.validationError');
    if (!formData.category.trim()) newErrors.category = t('assetForm.validationError');
    if (!formData.building.trim()) newErrors.building = t('assetForm.validationError');
    if (!formData.owner?.trim()) newErrors.owner = t('assetForm.validationError');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
                error={!!errors.assetName}
                helperText={errors.assetName}
                required
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
                  </Select>
                </FormControl>
              </Box>

              {/* Installation Location */}
              <TextField
                fullWidth
                label={t('assetForm.installationLocation')}
                value={formData.building}
                onChange={(e) => handleChange('building', e.target.value)}
                error={!!errors.building}
                helperText={errors.building}
                required
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
                  // Auto-populate department and office location if user selected
                  if (user) {
                    if (user.department) {
                      handleChange('department', user.department);
                    }
                    if (user.officeLocation) {
                      handleChange('officeLocation', user.officeLocation || '');
                    }
                  }
                }}
                label={t('assetDetail.primaryUser')}
                required
                error={!!errors.owner}
                helperText={errors.owner}
              />

              {/* User info display (read-only) */}
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

          {/* Advanced Options - Collapsible */}
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                mb: 2,
                justifyContent: 'space-between',
                textTransform: 'none',
                fontSize: '1rem',
              }}
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

                <TextField
                  fullWidth
                  label={t('bulkCreate.serialNumberPrefix')}
                  value={formData.serialNumberPrefix}
                  onChange={(e) => handleChange('serialNumberPrefix', e.target.value.toUpperCase())}
                  helperText={t('bulkCreate.serialNumberPrefixHint')}
                  inputProps={{ maxLength: 50 }}
                />

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
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BulkAssetCreationForm;
