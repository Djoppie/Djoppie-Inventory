import { useState } from 'react';
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
  InputAdornment,
  Stack,
  Fade,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Person,
  Business,
  LocationOn,
  Work,
  Computer,
  QrCode,
  Category as CategoryIcon,
  CalendarMonth,
  CheckCircle,
  ErrorOutline,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
import { useNextAssetNumber, useAssetCodeExists } from '../../hooks/useAssets';
import { Asset, CreateAssetDto, UpdateAssetDto, AssetTemplate } from '../../types/asset.types';
import { GraphUser, IntuneDevice } from '../../types/graph.types';
import UserAutocomplete from '../common/UserAutocomplete';
import DeviceAutocomplete from '../common/DeviceAutocomplete';

interface AssetFormProps {
  initialData?: Asset;
  onSubmit: (data: CreateAssetDto | UpdateAssetDto) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
}

// Helper function to format ISO date string to yyyy-MM-dd for HTML date inputs
const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// Parse an existing asset code into prefix and number parts
const parseAssetCode = (code: string): { prefix: string; number: number } => {
  const lastDash = code.lastIndexOf('-');
  if (lastDash > 0) {
    const prefix = code.substring(0, lastDash);
    const numStr = code.substring(lastDash + 1);
    const num = parseInt(numStr, 10);
    if (!isNaN(num)) return { prefix, number: num };
  }
  return { prefix: '', number: 1 };
};

// Section Header Component - defined outside to avoid re-creation on each render
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  theme: ReturnType<typeof useTheme>;
}

const SectionHeader = ({ icon, title, description, theme }: SectionHeaderProps) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 2,
          background: theme.palette.mode === 'light'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.2)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.3)}, ${alpha(theme.palette.primary.main, 0.2)})`,
          color: theme.palette.primary.main,
          boxShadow: theme.palette.mode === 'light'
            ? '2px 2px 4px rgba(0, 0, 0, 0.1), -2px -2px 4px rgba(255, 255, 255, 0.9)'
            : '3px 3px 6px rgba(0, 0, 0, 0.6), -2px -2px 4px rgba(255, 255, 255, 0.03)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'rotate(5deg) scale(1.05)',
          },
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </Typography>
    </Box>
    {description && (
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          ml: 6.5,
          fontStyle: 'italic',
        }}
      >
        {description}
      </Typography>
    )}
  </Box>
);

const AssetForm = ({ initialData, onSubmit, onCancel, isLoading, isEditMode }: AssetFormProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: templates, isLoading: templatesLoading } = useAssetTemplates();

  // Parse initial asset code for edit mode
  const initialParsed = initialData?.assetCode ? parseAssetCode(initialData.assetCode) : { prefix: '', number: 1 };

  const [assetCodePrefix, setAssetCodePrefix] = useState(isEditMode ? '' : initialParsed.prefix);
  const [assetCodeNumber, setAssetCodeNumber] = useState(isEditMode ? 0 : initialParsed.number);

  const [formData, setFormData] = useState<CreateAssetDto>({
    assetCode: initialData?.assetCode || '',
    assetName: initialData?.assetName || '',
    category: initialData?.category || '',
    owner: initialData?.owner || '',
    building: initialData?.building || '',
    department: initialData?.department || '',
    officeLocation: initialData?.officeLocation || '',
    jobTitle: initialData?.jobTitle || '',
    status: initialData?.status || 'InGebruik',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    serialNumber: initialData?.serialNumber || '',
    purchaseDate: formatDateForInput(initialData?.purchaseDate),
    warrantyExpiry: formatDateForInput(initialData?.warrantyExpiry),
    installationDate: formatDateForInput(initialData?.installationDate),
  });

  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  // Auto-fetch next number for prefix
  const { data: nextNumber } = useNextAssetNumber(assetCodePrefix);

  // Build the combined code for uniqueness check (only in create mode)
  const combinedCode = !isEditMode && assetCodePrefix && assetCodeNumber > 0
    ? `${assetCodePrefix}-${assetCodeNumber.toString().padStart(4, '0')}`
    : '';
  const { data: codeExists } = useAssetCodeExists(combinedCode);

  // Auto-fill number when next number is fetched (render-time state adjustment)
  const [numberAutoFilled, setNumberAutoFilled] = useState(false);
  const [prevNextNumber, setPrevNextNumber] = useState<number | undefined>(undefined);

  if (nextNumber !== undefined && nextNumber !== prevNextNumber && !isEditMode) {
    setPrevNextNumber(nextNumber);
    if (!numberAutoFilled) {
      setAssetCodeNumber(nextNumber);
      setNumberAutoFilled(true);
    }
  }

  // Auto-increment when code already exists (render-time state adjustment)
  const [prevCodeExists, setPrevCodeExists] = useState<boolean | undefined>(undefined);
  const [prevCombinedCode, setPrevCombinedCode] = useState('');

  if (combinedCode !== prevCombinedCode) {
    setPrevCombinedCode(combinedCode);
    setPrevCodeExists(undefined);
  }

  if (codeExists !== prevCodeExists) {
    setPrevCodeExists(codeExists);
    if (codeExists === true && !isEditMode && assetCodeNumber > 0 && assetCodeNumber < 9999) {
      setAssetCodeNumber(prev => prev + 1);
    }
  }

  // Reset auto-fill when prefix changes
  const handlePrefixChange = (value: string) => {
    setAssetCodePrefix(value.toUpperCase());
    setNumberAutoFilled(false);
    setPrevNextNumber(undefined);
    if (errors.assetCode) {
      setErrors(prev => ({ ...prev, assetCode: '' }));
    }
  };

  const handleNumberChange = (value: number) => {
    setAssetCodeNumber(value);
    if (errors.assetCode) {
      setErrors(prev => ({ ...prev, assetCode: '' }));
    }
  };

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
        officeLocation: template.officeLocation || prev.officeLocation,
        purchaseDate: template.purchaseDate?.split('T')[0] || prev.purchaseDate,
        warrantyExpiry: template.warrantyExpiry?.split('T')[0] || prev.warrantyExpiry,
        installationDate: template.installationDate?.split('T')[0] || prev.installationDate,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditMode) {
      if (!assetCodePrefix.trim()) newErrors.assetCode = t('assetForm.validationError');
      else if (assetCodeNumber < 1) newErrors.assetCode = t('assetForm.validationError');
      else if (codeExists) newErrors.assetCode = `Code ${combinedCode} ${t('assetForm.codeExists')}`;
    }
    if (!formData.assetName.trim()) newErrors.assetName = t('assetForm.validationError');
    if (!formData.category.trim()) newErrors.category = t('assetForm.validationError');
    if (!formData.owner.trim()) newErrors.owner = t('assetForm.validationError');
    if (!formData.building.trim()) newErrors.building = t('assetForm.validationError');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert empty strings to undefined so the API receives null instead of ""
  const cleanData = (data: Record<string, unknown>): Record<string, unknown> => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      cleaned[key] = typeof value === 'string' && value.trim() === '' ? undefined : value;
    }
    return cleaned;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isEditMode) {
      const { assetCode: _assetCode, ...updateData } = formData; // eslint-disable-line @typescript-eslint/no-unused-vars
      onSubmit(cleanData(updateData) as unknown as UpdateAssetDto);
    } else {
      const assetCode = `${assetCodePrefix}-${assetCodeNumber.toString().padStart(4, '0')}`;
      onSubmit(cleanData({ ...formData, assetCode }) as unknown as CreateAssetDto);
    }
  };

  const handleChange = (field: keyof CreateAssetDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const markFieldAsAutoFilled = (field: string) => {
    setAutoFilledFields(prev => new Set(prev).add(field));
    setTimeout(() => {
      setAutoFilledFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }, 3000);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: 'visible',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light}, ${theme.palette.secondary.main})`,
            borderRadius: '12px 12px 0 0',
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {/* Template Selection */}
          {!isEditMode && (
            <Fade in timeout={300}>
              <Box sx={{ mb: 4 }}>
                <SectionHeader
                  icon={<CategoryIcon />}
                  title={t('assetForm.templateSection')}
                  description={t('assetForm.templateSectionDesc')}
                  theme={theme}
                />
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
                        {template.templateName} - {template.category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Fade>
          )}

          {/* Identification Section */}
          <Fade in timeout={400}>
            <Box sx={{ mb: 4 }}>
              <SectionHeader
                icon={<QrCode />}
                title={t('assetForm.identificationSection')}
                theme={theme}
              />
              <Stack spacing={2.5}>
                {isEditMode ? (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                      sx={{ flex: '1 1 200px' }}
                      label={t('assetDetail.assetCode')}
                      value={formData.assetCode}
                      disabled
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <QrCode sx={{ color: 'primary.main' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      sx={{ flex: '2 1 400px' }}
                      label={t('assetDetail.assetName')}
                      value={formData.assetName}
                      onChange={(e) => handleChange('assetName', e.target.value)}
                      error={!!errors.assetName}
                      helperText={errors.assetName}
                      required
                    />
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', mb: 2 }}>
                      <TextField
                        sx={{ flex: '1 1 150px' }}
                        label={t('assetForm.codePrefix')}
                        value={assetCodePrefix}
                        onChange={(e) => handlePrefixChange(e.target.value)}
                        error={!!errors.assetCode}
                        helperText={t('assetForm.codePrefixHint')}
                        required
                        inputProps={{ maxLength: 20 }}
                      />
                      <TextField
                        sx={{ flex: '0 1 150px' }}
                        label={t('assetForm.number')}
                        type="number"
                        value={assetCodeNumber}
                        onChange={(e) => handleNumberChange(parseInt(e.target.value) || 0)}
                        error={!!errors.assetCode || (codeExists === true)}
                        helperText={errors.assetCode || (codeExists ? `${combinedCode} ${t('assetForm.codeExists')}` : '')}
                        required
                        inputProps={{ min: 1, max: 9999 }}
                        InputProps={{
                          endAdornment: codeExists === false && combinedCode ? (
                            <InputAdornment position="end">
                              <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                            </InputAdornment>
                          ) : codeExists === true ? (
                            <InputAdornment position="end">
                              <ErrorOutline sx={{ color: 'error.main', fontSize: 20 }} />
                            </InputAdornment>
                          ) : undefined,
                        }}
                      />
                      {combinedCode && (
                        <Box sx={{ display: 'flex', alignItems: 'center', pt: 1 }}>
                          <Chip
                            label={combinedCode}
                            color={codeExists ? 'error' : 'primary'}
                            variant="outlined"
                            sx={{
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              fontSize: '1rem',
                              height: 40,
                              borderWidth: 2,
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                    <TextField
                      fullWidth
                      label={t('assetDetail.assetName')}
                      value={formData.assetName}
                      onChange={(e) => handleChange('assetName', e.target.value)}
                      error={!!errors.assetName}
                      helperText={errors.assetName}
                      required
                    />
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    sx={{ flex: '1 1 300px' }}
                    label={t('assetDetail.category')}
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    error={!!errors.category}
                    helperText={errors.category || 'e.g., Computing, Peripherals'}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CategoryIcon sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormControl sx={{ flex: '1 1 200px' }} required>
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
              </Stack>
            </Box>
          </Fade>

          <Divider sx={{ my: 4 }} />

          {/* Assignment Section */}
          <Fade in timeout={500}>
            <Box sx={{ mb: 4 }}>
              <SectionHeader
                icon={<Person />}
                title={t('assetForm.assignmentSection')}
                description={t('assetForm.assignmentSectionDesc')}
                theme={theme}
              />
              <Stack spacing={2.5}>
                <UserAutocomplete
                  value={formData.owner}
                  onChange={(displayName: string, user: GraphUser | null) => {
                    handleChange('owner', displayName);
                    // Auto-populate department, job title, and office location if user selected
                    if (user) {
                      if (user.department && !formData.department) {
                        handleChange('department', user.department);
                        markFieldAsAutoFilled('department');
                      }
                      if (user.jobTitle && !formData.jobTitle) {
                        handleChange('jobTitle', user.jobTitle);
                        markFieldAsAutoFilled('jobTitle');
                      }
                      if (user.officeLocation && !formData.officeLocation) {
                        handleChange('officeLocation', user.officeLocation);
                        markFieldAsAutoFilled('officeLocation');
                      }
                    }
                  }}
                  label={t('assetDetail.owner')}
                  required
                  error={!!errors.owner}
                  helperText={errors.owner || t('assetForm.userAutoFillHint')}
                  disabled={isLoading}
                />

                {/* Auto-filled chips display */}
                {(formData.department || formData.jobTitle || formData.officeLocation) && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1.5,
                      p: 2,
                      borderRadius: 2,
                      background: theme.palette.mode === 'light'
                        ? alpha(theme.palette.primary.main, 0.05)
                        : alpha(theme.palette.primary.dark, 0.2),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    {formData.department && (
                      <Chip
                        icon={<Business />}
                        label={formData.department}
                        size="medium"
                        color="primary"
                        variant={autoFilledFields.has('department') ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: 600,
                          animation: autoFilledFields.has('department') ? 'pulse 0.5s ease-in-out' : 'none',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.1)' },
                            '100%': { transform: 'scale(1)' },
                          },
                        }}
                      />
                    )}
                    {formData.jobTitle && (
                      <Chip
                        icon={<Work />}
                        label={formData.jobTitle}
                        size="medium"
                        color="secondary"
                        variant={autoFilledFields.has('jobTitle') ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: 600,
                          animation: autoFilledFields.has('jobTitle') ? 'pulse 0.5s ease-in-out' : 'none',
                        }}
                      />
                    )}
                    {formData.officeLocation && (
                      <Chip
                        icon={<LocationOn />}
                        label={formData.officeLocation}
                        size="medium"
                        color="info"
                        variant={autoFilledFields.has('officeLocation') ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: 600,
                          animation: autoFilledFields.has('officeLocation') ? 'pulse 0.5s ease-in-out' : 'none',
                        }}
                      />
                    )}
                  </Box>
                )}

                <TextField
                  fullWidth
                  label={t('assetDetail.building')}
                  value={formData.building}
                  onChange={(e) => handleChange('building', e.target.value)}
                  error={!!errors.building}
                  helperText={errors.building}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business sx={{ color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
            </Box>
          </Fade>

          <Divider sx={{ my: 4 }} />

          {/* Technical Details Section */}
          <Fade in timeout={600}>
            <Box sx={{ mb: 4 }}>
              <SectionHeader
                icon={<Computer />}
                title={t('assetForm.technicalSection')}
                description={t('assetForm.technicalSectionDesc')}
                theme={theme}
              />
              <Stack spacing={2.5}>
                <DeviceAutocomplete
                  value={formData.serialNumber || ''}
                  onSelect={(device: IntuneDevice | null) => {
                    if (device) {
                      // Auto-populate device details
                      if (device.manufacturer && !formData.brand) {
                        handleChange('brand', device.manufacturer);
                        markFieldAsAutoFilled('brand');
                      }
                      if (device.model && !formData.model) {
                        handleChange('model', device.model);
                        markFieldAsAutoFilled('model');
                      }
                      if (device.serialNumber) {
                        handleChange('serialNumber', device.serialNumber);
                        markFieldAsAutoFilled('serialNumber');
                      }
                    }
                  }}
                  label={t('assetForm.searchIntuneDevice')}
                  helperText={t('assetForm.searchIntuneHint')}
                  searchBy="name"
                />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    sx={{ flex: '1 1 200px' }}
                    label={t('assetDetail.brand')}
                    value={formData.brand}
                    onChange={(e) => handleChange('brand', e.target.value)}
                    InputProps={{
                      endAdornment: autoFilledFields.has('brand') ? (
                        <InputAdornment position="end">
                          <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                        </InputAdornment>
                      ) : undefined,
                    }}
                  />
                  <TextField
                    sx={{ flex: '1 1 200px' }}
                    label={t('assetDetail.model')}
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    InputProps={{
                      endAdornment: autoFilledFields.has('model') ? (
                        <InputAdornment position="end">
                          <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                        </InputAdornment>
                      ) : undefined,
                    }}
                  />
                  <TextField
                    sx={{ flex: '1 1 200px' }}
                    label={t('assetDetail.serialNumber')}
                    value={formData.serialNumber}
                    onChange={(e) => handleChange('serialNumber', e.target.value)}
                    error={!!errors.serialNumber}
                    helperText={errors.serialNumber}
                    InputProps={{
                      endAdornment: autoFilledFields.has('serialNumber') ? (
                        <InputAdornment position="end">
                          <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                        </InputAdornment>
                      ) : undefined,
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          </Fade>

          <Divider sx={{ my: 4 }} />

          {/* Lifecycle Section */}
          <Fade in timeout={700}>
            <Box sx={{ mb: 4 }}>
              <SectionHeader
                icon={<CalendarMonth />}
                title={t('assetForm.lifecycleSection')}
                description={t('assetForm.lifecycleSectionDesc')}
                theme={theme}
              />
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
          </Fade>

          {/* Form Actions */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-end',
              mt: 5,
              pt: 3,
              borderTop: `2px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isLoading}
              size="large"
              sx={{
                minWidth: 120,
                height: 48,
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || (!isEditMode && codeExists === true)}
              size="large"
              sx={{
                minWidth: 180,
                height: 48,
                position: 'relative',
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isEditMode ? t('assetForm.updateAsset') : t('assetForm.createAsset')
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AssetForm;
