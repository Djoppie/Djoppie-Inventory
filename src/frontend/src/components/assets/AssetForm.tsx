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
  InputAdornment,
  Stack,
  Fade,
  alpha,
  useTheme,
  Theme,
  FormControlLabel,
  Checkbox,
  Chip,
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
  Science,
  Warning,
  Link as LinkIcon,
  LinkOff,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
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

// Section Header Component
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  theme: Theme;
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

  const [assetCodePrefix, setAssetCodePrefix] = useState('');
  const [isDummy, setIsDummy] = useState(initialData?.isDummy || false);
  const [selectedUserUpn, setSelectedUserUpn] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<IntuneDevice | null>(null);

  const [formData, setFormData] = useState<Omit<CreateAssetDto, 'assetCodePrefix' | 'isDummy'>>({
    assetName: initialData?.assetName || '',
    category: initialData?.category || '',
    building: initialData?.building || '',
    owner: initialData?.owner || '',
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
      if (!assetCodePrefix.trim()) newErrors.assetCodePrefix = t('assetForm.validationError');
    }
    if (!formData.assetName.trim()) newErrors.assetName = t('assetForm.validationError');
    if (!formData.category.trim()) newErrors.category = t('assetForm.validationError');
    if (!formData.building.trim()) newErrors.building = t('assetForm.validationError');
    if (!formData.owner.trim()) newErrors.owner = t('assetForm.validationError');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert empty strings to undefined so the API receives null instead of ""
  const cleanData = <T extends object>(data: T): T => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      cleaned[key] = typeof value === 'string' && value.trim() === '' ? undefined : value;
    }
    return cleaned as T;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isEditMode) {
      onSubmit(cleanData(formData as UpdateAssetDto));
    } else {
      const createData: CreateAssetDto = {
        ...formData,
        assetCodePrefix: assetCodePrefix.toUpperCase(),
        isDummy,
      };
      onSubmit(cleanData(createData));
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
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
                  // Edit mode: show asset code as read-only
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                      sx={{ flex: '1 1 200px' }}
                      label={t('assetDetail.assetCode')}
                      value={initialData?.assetCode || ''}
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <QrCode sx={{ color: 'primary.main' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    {initialData?.isDummy && (
                      <Chip
                        icon={<Science />}
                        label={t('assetForm.dummyAsset')}
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                ) : (
                  // Create mode: show prefix input and dummy checkbox
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <TextField
                      sx={{ flex: '1 1 200px' }}
                      label={t('assetForm.codePrefix')}
                      value={assetCodePrefix}
                      onChange={(e) => {
                        setAssetCodePrefix(e.target.value.toUpperCase());
                        if (errors.assetCodePrefix) {
                          setErrors(prev => ({ ...prev, assetCodePrefix: '' }));
                        }
                      }}
                      error={!!errors.assetCodePrefix}
                      helperText={errors.assetCodePrefix || t('assetForm.codePrefixHint')}
                      required
                      inputProps={{ maxLength: 20 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <QrCode sx={{ color: 'primary.main' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isDummy}
                          onChange={(e) => setIsDummy(e.target.checked)}
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
                        bgcolor: isDummy ? alpha(theme.palette.warning.main, 0.1) : 'transparent',
                        border: isDummy ? `1px solid ${theme.palette.warning.main}` : '1px solid transparent',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </Box>
                )}

                {/* Alias (Asset Name) */}
                <TextField
                  fullWidth
                  label={t('assetForm.alias')}
                  value={formData.assetName}
                  onChange={(e) => handleChange('assetName', e.target.value)}
                  error={!!errors.assetName}
                  helperText={errors.assetName}
                  required
                />

                {/* Category and Status */}
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

                {/* Installation Location (Building) */}
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
                    // Store UPN for device validation
                    setSelectedUserUpn(user?.userPrincipalName || null);
                    // Auto-populate department, job title, and office location if user selected
                    if (user) {
                      if (user.department) {
                        handleChange('department', user.department);
                        markFieldAsAutoFilled('department');
                      }
                      if (user.jobTitle) {
                        handleChange('jobTitle', user.jobTitle);
                        markFieldAsAutoFilled('jobTitle');
                      }
                      if (user.officeLocation) {
                        handleChange('officeLocation', user.officeLocation);
                        markFieldAsAutoFilled('officeLocation');
                      }
                    } else {
                      // Clear auto-filled fields when user is cleared
                      handleChange('department', '');
                      handleChange('jobTitle', '');
                      handleChange('officeLocation', '');
                    }
                  }}
                  label={t('assetDetail.primaryUser')}
                  required
                  error={!!errors.owner}
                  helperText={errors.owner}
                  disabled={isLoading}
                />

                {/* User info display (read-only) */}
                {(formData.department || formData.jobTitle || formData.officeLocation) && (
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
                        <Business sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {t('assetDetail.department')}:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formData.department}
                        </Typography>
                      </Box>
                    )}
                    {formData.jobTitle && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Work sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {t('assetDetail.jobTitle')}:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formData.jobTitle}
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

                {/* Intune Device Search */}
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'text.secondary',
                    }}
                  >
                    <Computer sx={{ fontSize: 18 }} />
                    {t('assetForm.searchIntuneDevice')}
                  </Typography>
                  <DeviceAutocomplete
                    value={formData.serialNumber || ''}
                    onSelect={(device: IntuneDevice | null) => {
                      setSelectedDevice(device);
                      if (device) {
                        // Auto-populate device details
                        if (device.manufacturer) {
                          handleChange('brand', device.manufacturer);
                          markFieldAsAutoFilled('brand');
                        }
                        if (device.model) {
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

                  {/* Device-User validation indicator */}
                  {selectedDevice && (
                    <Box sx={{ mt: 1.5 }}>
                      {selectedDevice.userPrincipalName ? (
                        // Device has an assigned user in Intune
                        selectedUserUpn && selectedDevice.userPrincipalName.toLowerCase() === selectedUserUpn.toLowerCase() ? (
                          // User matches
                          <Chip
                            icon={<LinkIcon />}
                            label={t('assetForm.deviceLinkedToUser')}
                            color="success"
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        ) : (
                          // User does not match
                          <Chip
                            icon={<Warning />}
                            label={`${t('assetForm.deviceLinkedToOther')}: ${selectedDevice.userPrincipalName}`}
                            color="warning"
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 500, maxWidth: '100%' }}
                          />
                        )
                      ) : (
                        // Device has no assigned user
                        <Chip
                          icon={<LinkOff />}
                          label={t('assetForm.deviceNotLinked')}
                          color="default"
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
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
                description={selectedDevice ? t('assetForm.autoFilledFromDevice') : undefined}
                theme={theme}
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
              disabled={isLoading}
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
