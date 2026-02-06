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
} from '@mui/material';
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

const AssetForm = ({ initialData, onSubmit, onCancel, isLoading, isEditMode }: AssetFormProps) => {
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
      if (!assetCodePrefix.trim()) newErrors.assetCode = 'Prefix is required';
      else if (assetCodeNumber < 1) newErrors.assetCode = 'Number must be at least 1';
      else if (codeExists) newErrors.assetCode = `Code ${combinedCode} already exists`;
    }
    if (!formData.assetName.trim()) newErrors.assetName = 'Asset name is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.owner.trim()) newErrors.owner = 'Owner is required';
    if (!formData.building.trim()) newErrors.building = 'Building is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';

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

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          {/* Template Selection */}
          {!isEditMode && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Quick Start with Template
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select a template to auto-fill common asset details
                </Typography>

                <FormControl fullWidth disabled={templatesLoading}>
                  <InputLabel>Select Template (Optional)</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(Number(e.target.value))}
                    label="Select Template (Optional)"
                  >
                    <MenuItem value={0}>
                      <em>No Template - Enter Manually</em>
                    </MenuItem>
                    {templates?.map((template: AssetTemplate) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.templateName} - {template.category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Divider sx={{ my: 3 }} />
            </>
          )}

          {/* Identification Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Asset Identification
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {isEditMode ? (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    sx={{ flex: '1 1 200px' }}
                    label="Asset Code"
                    value={formData.assetCode}
                    disabled
                    required
                  />
                  <TextField
                    sx={{ flex: '2 1 400px' }}
                    label="Asset Name"
                    value={formData.assetName}
                    onChange={(e) => handleChange('assetName', e.target.value)}
                    error={!!errors.assetName}
                    helperText={errors.assetName}
                    required
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <TextField
                    sx={{ flex: '1 1 150px' }}
                    label="Code Prefix"
                    value={assetCodePrefix}
                    onChange={(e) => handlePrefixChange(e.target.value)}
                    error={!!errors.assetCode}
                    helperText='e.g., LAP, MON, PRINT'
                    required
                    inputProps={{ maxLength: 20 }}
                  />
                  <TextField
                    sx={{ flex: '0 1 150px' }}
                    label="Number"
                    type="number"
                    value={assetCodeNumber}
                    onChange={(e) => handleNumberChange(parseInt(e.target.value) || 0)}
                    error={!!errors.assetCode || (codeExists === true)}
                    helperText={errors.assetCode || (codeExists ? `${combinedCode} exists already` : '')}
                    required
                    inputProps={{ min: 1, max: 9999 }}
                    InputProps={{
                      endAdornment: codeExists === false && combinedCode ? (
                        <InputAdornment position="end">
                          <Chip label="OK" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
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
                        sx={{ fontWeight: 600, fontFamily: 'monospace' }}
                      />
                    </Box>
                  )}
                  <TextField
                    sx={{ flex: '2 1 300px' }}
                    label="Asset Name"
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
                  label="Category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  error={!!errors.category}
                  helperText={errors.category || 'e.g., Computing, Peripherals'}
                  required
                />
                <FormControl sx={{ flex: '1 1 200px' }} required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="InGebruik">In gebruik</MenuItem>
                    <MenuItem value="Stock">Stock</MenuItem>
                    <MenuItem value="Herstelling">Herstelling</MenuItem>
                    <MenuItem value="Defect">Defect</MenuItem>
                    <MenuItem value="UitDienst">Uit dienst</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Assignment Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Assignment Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <UserAutocomplete
                value={formData.owner}
                onChange={(displayName: string, user: GraphUser | null) => {
                  handleChange('owner', displayName);
                  // Auto-populate department and office location if user selected
                  if (user) {
                    if (user.department && !formData.department) {
                      handleChange('department', user.department);
                    }
                    if (user.officeLocation && !formData.officeLocation) {
                      handleChange('officeLocation', user.officeLocation);
                    }
                  }
                }}
                label="Owner"
                required
                error={!!errors.owner}
                helperText={errors.owner || 'Search for user or enter name manually'}
                disabled={isLoading}
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 250px' }}
                  label="Building"
                  value={formData.building}
                  onChange={(e) => handleChange('building', e.target.value)}
                  error={!!errors.building}
                  helperText={errors.building}
                  required
                />
                <TextField
                  sx={{ flex: '1 1 250px' }}
                  label="Department"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  error={!!errors.department}
                  helperText={errors.department}
                  required
                />
              </Box>
              <TextField
                fullWidth
                label="Office Location"
                value={formData.officeLocation}
                onChange={(e) => handleChange('officeLocation', e.target.value)}
                helperText="Optional: Specific office or room number"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Technical Details Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Technical Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Optional but recommended for better asset tracking. Search Intune for device details.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DeviceAutocomplete
                value={formData.serialNumber || ''}
                onSelect={(device: IntuneDevice | null) => {
                  if (device) {
                    // Auto-populate device details
                    if (device.manufacturer && !formData.brand) {
                      handleChange('brand', device.manufacturer);
                    }
                    if (device.model && !formData.model) {
                      handleChange('model', device.model);
                    }
                    if (device.serialNumber) {
                      handleChange('serialNumber', device.serialNumber);
                    }
                  }
                }}
                label="Search Intune Device"
                helperText="Search by device name or serial number to auto-fill details"
                searchBy="name"
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  label="Brand"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                />
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  label="Model"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                />
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  label="Serial Number"
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                  error={!!errors.serialNumber}
                  helperText={errors.serialNumber}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Lifecycle Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Lifecycle Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Track warranty and installation dates
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                sx={{ flex: '1 1 200px' }}
                label="Purchase Date"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleChange('purchaseDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                sx={{ flex: '1 1 200px' }}
                label="Warranty Expiry"
                type="date"
                value={formData.warrantyExpiry}
                onChange={(e) => handleChange('warrantyExpiry', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                sx={{ flex: '1 1 200px' }}
                label="Installation Date"
                type="date"
                value={formData.installationDate}
                onChange={(e) => handleChange('installationDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>

          {/* Form Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isLoading}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || (!isEditMode && codeExists === true)}
              size="large"
              sx={{ minWidth: 150 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isEditMode ? 'Update Asset' : 'Create Asset'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AssetForm;
