import { useState, useEffect, useCallback } from 'react';
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
  InputAdornment,
  Stack,
  alpha,
  useTheme,
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
import AssetTypeSelect from '../common/AssetTypeSelect';
import ServiceSelect from '../common/ServiceSelect';
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

// Reusable Section Card matching the scanner-card banner style
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

const AssetForm = ({ initialData, onSubmit, onCancel, isLoading, isEditMode }: AssetFormProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: templates, isLoading: templatesLoading } = useAssetTemplates();

  const [isDummy, setIsDummy] = useState(initialData?.isDummy || false);
  const [selectedUserUpn, setSelectedUserUpn] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<IntuneDevice | null>(null);

  // Serial number lookup states
  const [isLookingUpSerial, setIsLookingUpSerial] = useState(false);
  const [serialLookupError, setSerialLookupError] = useState<string | null>(null);
  const [isSerialUnique, setIsSerialUnique] = useState<boolean | null>(null);
  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);

  const [formData, setFormData] = useState<Omit<CreateAssetDto, 'isDummy'>>({
    assetName: initialData?.assetName || '',
    category: initialData?.category || '',

    // New relational fields
    assetTypeId: initialData?.assetTypeId,
    serviceId: initialData?.serviceId,
    installationLocation: initialData?.installationLocation || '',

    // User assignment fields
    owner: initialData?.owner || '',
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

      if (device.deviceName) {
        setFormData(prev => ({ ...prev, assetName: device.deviceName || '' }));
        markFieldAsAutoFilled('assetName');
      }
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

  // Debounce serial number uniqueness check + Intune lookup
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.serialNumber) {
        checkSerialUniqueness(formData.serialNumber);
        lookupDeviceBySerial(formData.serialNumber);
      } else {
        setIsSerialUnique(null);
        setSelectedDevice(null);
        setSerialLookupError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.serialNumber, checkSerialUniqueness, lookupDeviceBySerial]);

  const handleTemplateChange = (templateId: number) => {
    setSelectedTemplate(templateId);

    if (templateId === 0) return;

    const template = templates?.find((t: AssetTemplate) => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        assetName: template.assetName || prev.assetName,
        category: template.category || prev.category,
        brand: template.brand || prev.brand,
        model: template.model || prev.model,
        owner: template.owner || prev.owner,
        assetTypeId: template.assetTypeId ?? prev.assetTypeId,
        serviceId: template.serviceId ?? prev.serviceId,
        installationLocation: template.installationLocation || prev.installationLocation,
        status: template.status || prev.status,
        purchaseDate: template.purchaseDate?.split('T')[0] || prev.purchaseDate,
        warrantyExpiry: template.warrantyExpiry?.split('T')[0] || prev.warrantyExpiry,
        installationDate: template.installationDate?.split('T')[0] || prev.installationDate,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = t('assetForm.serialNumberRequired');
    } else if (isSerialUnique === false) {
      newErrors.serialNumber = t('assetForm.serialNumberNotUnique');
    }
    if (!formData.assetTypeId) {
      newErrors.assetTypeId = t('assetForm.validationError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const cleanData = <T extends object>(data: T): T => {
    const requiredFields = ['serialNumber', 'assetTypeId', 'status'];
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (requiredFields.includes(key)) {
        cleaned[key] = value;
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
      {/* Template Selection (create mode only) */}
      {!isEditMode && (
        <SectionCard
          icon={<CategoryIcon />}
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
                  {template.templateName}{template.assetType ? ` - ${template.assetType.name}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </SectionCard>
      )}

      {/* Identification Section */}
      <SectionCard
        icon={<QrCode />}
        title={t('assetForm.identificationSection')}
      >
        <Stack spacing={2.5}>
          {isEditMode ? (
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

          {/* SerialNumber */}
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

          {/* AssetName (DeviceName) */}
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

          {/* Alias */}
          <TextField
            fullWidth
            label={t('assetForm.alias')}
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            helperText={t('assetForm.aliasHint')}
          />

          {/* Asset Type and Status */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <AssetTypeSelect
                value={formData.assetTypeId ?? null}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, assetTypeId: value ?? undefined }));
                  if (errors.assetTypeId) {
                    setErrors(prev => ({ ...prev, assetTypeId: '' }));
                  }
                }}
                label={t('assetDetail.category')}
                helperText={errors.assetTypeId}
                error={!!errors.assetTypeId}
                required
              />
            </Box>
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
        <Stack spacing={2.5}>
          <UserAutocomplete
            value={formData.owner || ''}
            onChange={(displayName: string, user: GraphUser | null) => {
              handleChange('owner', displayName);
              setSelectedUserUpn(user?.userPrincipalName || null);
              if (user) {
                if (user.jobTitle) {
                  handleChange('jobTitle', user.jobTitle);
                  markFieldAsAutoFilled('jobTitle');
                }
                if (user.officeLocation) {
                  handleChange('officeLocation', user.officeLocation);
                  markFieldAsAutoFilled('officeLocation');
                }
              } else {
                handleChange('jobTitle', '');
                handleChange('officeLocation', '');
              }
            }}
            label={t('assetDetail.primaryUser')}
            helperText={t('assetForm.ownerOptionalHint')}
            disabled={isLoading}
          />

          {/* User info display */}
          {(formData.jobTitle || formData.officeLocation) && (
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

          {/* Device-User validation indicator */}
          {selectedDevice && (
            <Box>
              {selectedDevice.userPrincipalName ? (
                (() => {
                  const deviceUpn = selectedDevice.userPrincipalName.toLowerCase();
                  const ownerName = (formData.owner || '').toLowerCase();
                  const upnMatch = selectedUserUpn && deviceUpn === selectedUserUpn.toLowerCase();
                  const upnLocalPart = deviceUpn.split('@')[0].replace(/[._-]/g, ' ');
                  const nameMatch = ownerName && (
                    upnLocalPart.includes(ownerName.replace(/\s+/g, ' ')) ||
                    ownerName.split(' ').every(part => upnLocalPart.includes(part))
                  );

                  return upnMatch || nameMatch ? (
                    <Chip
                      icon={<CheckCircle />}
                      label={`${formData.owner} — ${selectedDevice.deviceName}`}
                      color="success"
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 500, py: 0.5 }}
                    />
                  ) : (
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
      </SectionCard>

      {/* Technical Details + Lifecycle Section */}
      <SectionCard
        icon={<Computer />}
        title={t('assetForm.technicalSection')}
        description={selectedDevice ? t('assetForm.autoFilledFromDevice') : undefined}
      >
        <Stack spacing={3}>
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
      </SectionCard>

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
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          size="large"
          sx={{ minWidth: 180, height: 48 }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            isEditMode ? t('assetForm.updateAsset') : t('assetForm.createAsset')
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default AssetForm;
