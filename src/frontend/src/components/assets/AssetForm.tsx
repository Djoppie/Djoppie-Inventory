import { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Tooltip,
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
  Search,
  Numbers,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
import { Asset, CreateAssetDto, UpdateAssetDto, AssetTemplate } from '../../types/asset.types';
import { GraphUser, IntuneDevice } from '../../types/graph.types';
import UserAutocomplete from '../common/UserAutocomplete';
import { intuneApi } from '../../api/intune.api';
import { serialNumberExists } from '../../api/assets.api';

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

  // Serial number lookup states
  const [isLookingUpSerial, setIsLookingUpSerial] = useState(false);
  const [serialLookupError, setSerialLookupError] = useState<string | null>(null);
  const [isSerialUnique, setIsSerialUnique] = useState<boolean | null>(null);
  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);

  const [formData, setFormData] = useState<Omit<CreateAssetDto, 'assetCodePrefix' | 'isDummy'>>({
    assetName: initialData?.assetName || '',
    category: initialData?.category || '',
    building: initialData?.building || '',
    owner: initialData?.owner || '',
    department: initialData?.department || '',
    officeLocation: initialData?.officeLocation || '',
    jobTitle: initialData?.jobTitle || '',
    status: initialData?.status || 'Stock',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    serialNumber: initialData?.serialNumber || '',
    purchaseDate: formatDateForInput(initialData?.purchaseDate),
    warrantyExpiry: formatDateForInput(initialData?.warrantyExpiry),
    installationDate: formatDateForInput(initialData?.installationDate),
  });

  // Alias is stored separately (optional readable name)
  const [alias, setAlias] = useState(initialData?.alias || '');

  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  // Lookup device info from Intune by serial number
  const lookupDeviceBySerial = useCallback(async (serial: string) => {
    if (!serial.trim()) return;

    setIsLookingUpSerial(true);
    setSerialLookupError(null);

    try {
      const device = await intuneApi.getDeviceBySerialNumber(serial.trim());
      setSelectedDevice(device);

      // Auto-populate device name (AssetName)
      if (device.deviceName) {
        setFormData(prev => ({ ...prev, assetName: device.deviceName || '' }));
        markFieldAsAutoFilled('assetName');
      }
      // Auto-populate device details
      if (device.manufacturer) {
        setFormData(prev => ({ ...prev, brand: device.manufacturer || '' }));
        markFieldAsAutoFilled('brand');
      }
      if (device.model) {
        setFormData(prev => ({ ...prev, model: device.model || '' }));
        markFieldAsAutoFilled('model');
      }
    } catch {
      setSerialLookupError(t('assetForm.deviceNotFoundBySerial'));
      setSelectedDevice(null);
    } finally {
      setIsLookingUpSerial(false);
    }
  }, [t]);

  // Check if serial number is unique
  const checkSerialUniqueness = useCallback(async (serial: string) => {
    if (!serial.trim()) {
      setIsSerialUnique(null);
      return;
    }

    setIsCheckingUniqueness(true);
    try {
      const exists = await serialNumberExists(serial.trim(), isEditMode ? initialData?.id : undefined);
      setIsSerialUnique(!exists);
      if (exists) {
        setErrors(prev => ({ ...prev, serialNumber: t('assetForm.serialNumberNotUnique') }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.serialNumber;
          return newErrors;
        });
      }
    } catch {
      setIsSerialUnique(null);
    } finally {
      setIsCheckingUniqueness(false);
    }
  }, [isEditMode, initialData?.id, t]);

  // Debounce serial number uniqueness check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.serialNumber) {
        checkSerialUniqueness(formData.serialNumber);
      } else {
        setIsSerialUnique(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.serialNumber, checkSerialUniqueness]);

  // Auto-lookup device from Intune when editing an asset with existing serial number
  useEffect(() => {
    if (isEditMode && initialData?.serialNumber) {
      lookupDeviceBySerial(initialData.serialNumber);
    }
  }, [isEditMode, initialData?.serialNumber, lookupDeviceBySerial]);

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
        // officeLocation not in template - keep existing value
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
    // SerialNumber is REQUIRED and must be unique
    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = t('assetForm.serialNumberRequired');
    } else if (isSerialUnique === false) {
      newErrors.serialNumber = t('assetForm.serialNumberNotUnique');
    }
    if (!formData.category.trim()) newErrors.category = t('assetForm.validationError');
    // Owner is optional - removed validation
    // Building (Installation Location) is optional
    // Status is required but has default value

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert empty strings to undefined so the API receives null instead of ""
  // Keep required fields (serialNumber, category, assetCodePrefix) as-is
  const cleanData = <T extends object>(data: T): T => {
    const requiredFields = ['serialNumber', 'category', 'assetCodePrefix', 'status'];
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (requiredFields.includes(key)) {
        cleaned[key] = value; // Keep required fields as-is
      } else {
        cleaned[key] = typeof value === 'string' && value.trim() === '' ? undefined : value;
      }
    }
    return cleaned as T;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isEditMode) {
      const updateData: UpdateAssetDto = {
        ...formData,
        alias: alias || undefined,
      };
      onSubmit(cleanData(updateData));
    } else {
      const createData: CreateAssetDto = {
        ...formData,
        alias: alias || undefined,
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

                {/* SerialNumber - REQUIRED (must be first after prefix) */}
                <Box>
                  <TextField
                    fullWidth
                    label={t('assetDetail.serialNumber')}
                    value={formData.serialNumber}
                    onChange={(e) => handleChange('serialNumber', e.target.value)}
                    error={!!errors.serialNumber}
                    helperText={errors.serialNumber || t('assetForm.serialNumberHint')}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Numbers sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          {isCheckingUniqueness && <CircularProgress size={20} />}
                          {!isCheckingUniqueness && isSerialUnique === true && (
                            <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                          )}
                          {!isCheckingUniqueness && isSerialUnique === false && (
                            <Warning sx={{ color: 'error.main', fontSize: 20 }} />
                          )}
                          <Tooltip title={t('assetForm.lookupDeviceBySerial')}>
                            <IconButton
                              size="small"
                              onClick={() => lookupDeviceBySerial(formData.serialNumber)}
                              disabled={!formData.serialNumber.trim() || isLookingUpSerial}
                            >
                              {isLookingUpSerial ? (
                                <CircularProgress size={20} />
                              ) : (
                                <Search />
                              )}
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {serialLookupError && (
                    <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                      {serialLookupError}
                    </Typography>
                  )}
                  {selectedDevice && (
                    <Chip
                      icon={<LinkIcon />}
                      label={`${t('assetForm.deviceFound')}: ${selectedDevice.deviceName}`}
                      color="success"
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                {/* AssetName (DeviceName) - auto-fetched from Intune */}
                <TextField
                  fullWidth
                  label={t('assetForm.assetNameDevice')}
                  value={formData.assetName}
                  onChange={(e) => handleChange('assetName', e.target.value)}
                  helperText={t('assetForm.assetNameAutoFetched')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Computer sx={{ color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                    endAdornment: autoFilledFields.has('assetName') ? (
                      <InputAdornment position="end">
                        <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                      </InputAdornment>
                    ) : undefined,
                  }}
                />

                {/* Alias - Optional readable name */}
                <TextField
                  fullWidth
                  label={t('assetForm.alias')}
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  helperText={t('assetForm.aliasHint')}
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
                      <MenuItem value="Stock">{t('statuses.stock')}</MenuItem>
                      <MenuItem value="InGebruik">{t('statuses.ingebruik')}</MenuItem>
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
                  helperText={t('assetForm.installationLocationHint')}
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
                  value={formData.owner || ''}
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
                  helperText={t('assetForm.ownerOptionalHint')}
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

                {/* Device-User validation indicator - shows relationship between selected user and device from SerialNumber lookup */}
                {selectedDevice && (
                  <Box sx={{ mt: 1 }}>
                    {selectedDevice.userPrincipalName ? (
                      // Device has an assigned user in Intune
                      // Check if user matches: either by UPN or by matching display name with UPN local part
                      (() => {
                        const deviceUpn = selectedDevice.userPrincipalName.toLowerCase();
                        const ownerName = (formData.owner || '').toLowerCase();
                        // Match by UPN (if user selected from autocomplete)
                        const upnMatch = selectedUserUpn && deviceUpn === selectedUserUpn.toLowerCase();
                        // Match by display name: "Jo Wijnen" matches "jo.wijnen@..."
                        const upnLocalPart = deviceUpn.split('@')[0].replace(/[._-]/g, ' ');
                        const nameMatch = ownerName && (
                          upnLocalPart.includes(ownerName.replace(/\s+/g, ' ')) ||
                          ownerName.split(' ').every(part => upnLocalPart.includes(part))
                        );

                        return upnMatch || nameMatch ? (
                          // User matches - show handshake indicator
                          <Chip
                            icon={<span style={{ fontSize: '16px' }}>🤝</span>}
                            label={`${formData.owner} 🤝 ${selectedDevice.deviceName}`}
                            color="success"
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 500, py: 0.5 }}
                          />
                        ) : (
                          // User does not match - show warning with Intune user
                          <Chip
                            icon={<Warning />}
                            label={`${t('assetForm.deviceLinkedToOther')}: ${selectedDevice.userPrincipalName}`}
                            color="warning"
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 500, maxWidth: '100%' }}
                          />
                        );
                      })()
                    ) : (
                      // Device has no assigned user in Intune
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
