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
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Preview as PreviewIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
import { BulkCreateAssetDto, AssetTemplate } from '../../types/asset.types';

interface BulkAssetCreationFormProps {
  onSubmit: (data: BulkCreateAssetDto) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const BulkAssetCreationForm = ({ onSubmit, onCancel, isLoading }: BulkAssetCreationFormProps) => {
  const { data: templates, isLoading: templatesLoading } = useAssetTemplates();

  const [formData, setFormData] = useState<BulkCreateAssetDto>({
    assetCodePrefix: '',
    startingNumber: 1,
    quantity: 1,
    assetName: '',
    category: '',
    owner: '',
    building: '',
    spaceOrFloor: '',
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

  // Generate preview of asset codes using useMemo (avoids setState in effect)
  const previewCodes = useMemo(() => {
    if (formData.assetCodePrefix && formData.quantity > 0) {
      const codes: string[] = [];
      for (let i = 0; i < Math.min(formData.quantity, 5); i++) {
        const num = formData.startingNumber + i;
        codes.push(`${formData.assetCodePrefix}-${num.toString().padStart(4, '0')}`);
      }
      if (formData.quantity > 5) {
        codes.push('...');
      }
      return codes;
    }
    return [];
  }, [formData.assetCodePrefix, formData.startingNumber, formData.quantity]);

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
        templateId: template.id,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.assetCodePrefix.trim()) newErrors.assetCodePrefix = 'Prefix is required';
    if (formData.quantity < 1 || formData.quantity > 100) {
      newErrors.quantity = 'Quantity must be between 1 and 100';
    }
    if (formData.startingNumber < 1) newErrors.startingNumber = 'Starting number must be at least 1';
    if (!formData.assetName.trim()) newErrors.assetName = 'Asset name is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.owner.trim()) newErrors.owner = 'Owner is required';
    if (!formData.building.trim()) newErrors.building = 'Building is required';
    if (!formData.spaceOrFloor.trim()) newErrors.spaceOrFloor = 'Space/Floor is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  const handleChange = (field: keyof BulkCreateAssetDto, value: string | number) => {
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
          {/* Template Selection with Animation */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <AutoAwesomeIcon color="primary" />
              <Typography variant="h6" color="primary">
                Quick Start with Template
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a template to auto-fill common asset details
            </Typography>

            <FormControl fullWidth disabled={templatesLoading}>
              <InputLabel>Select Template (Optional)</InputLabel>
              <Select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(Number(e.target.value))}
                label="Select Template (Optional)"
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                <MenuItem value={0}>
                  <em>No Template - Enter Manually</em>
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
            <Typography variant="h6" gutterBottom color="primary">
              Bulk Creation Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure how many assets to create and their naming pattern
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  label="Asset Code Prefix"
                  value={formData.assetCodePrefix}
                  onChange={(e) => handleChange('assetCodePrefix', e.target.value.toUpperCase())}
                  error={!!errors.assetCodePrefix}
                  helperText={errors.assetCodePrefix || 'e.g., "LAP" for laptops, "MON" for monitors'}
                  required
                  inputProps={{ maxLength: 20 }}
                />
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  label="Serial Number Prefix (Optional)"
                  value={formData.serialNumberPrefix}
                  onChange={(e) => handleChange('serialNumberPrefix', e.target.value.toUpperCase())}
                  error={!!errors.serialNumberPrefix}
                  helperText={errors.serialNumberPrefix || 'e.g., "SN" for serial numbers'}
                  inputProps={{ maxLength: 50 }}
                />
                <TextField
                  sx={{ flex: '0 1 150px' }}
                  label="Starting Number"
                  type="number"
                  value={formData.startingNumber}
                  onChange={(e) => handleChange('startingNumber', parseInt(e.target.value) || 1)}
                  error={!!errors.startingNumber}
                  helperText={errors.startingNumber}
                  required
                  inputProps={{ min: 1, max: 9999 }}
                />
                <TextField
                  sx={{ flex: '0 1 150px' }}
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                  error={!!errors.quantity}
                  helperText={errors.quantity || 'Max: 100'}
                  required
                  inputProps={{ min: 1, max: 100 }}
                />
              </Box>

              {/* Preview Section with Animation */}
              <Collapse in={previewCodes.length > 0}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    background: (theme) =>
                      theme.palette.mode === 'light'
                        ? 'linear-gradient(135deg, rgba(255, 146, 51, 0.05), rgba(255, 119, 0, 0.08))'
                        : 'linear-gradient(135deg, rgba(255, 146, 51, 0.08), rgba(255, 119, 0, 0.12))',
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    transition: 'all 0.3s ease',
                    animation: 'fadeIn 0.5s ease-in',
                    '@keyframes fadeIn': {
                      from: { opacity: 0, transform: 'translateY(-10px)' },
                      to: { opacity: 1, transform: 'translateY(0)' },
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <PreviewIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={600} color="primary">
                      Preview: {formData.quantity} Asset{formData.quantity !== 1 ? 's' : ''} Will Be Created
                    </Typography>
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {previewCodes.map((code, idx) => (
                      <Chip
                        key={idx}
                        label={code}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          animation: `slideIn 0.3s ease-out ${idx * 0.05}s both`,
                          '@keyframes slideIn': {
                            from: { opacity: 0, transform: 'translateX(-10px)' },
                            to: { opacity: 1, transform: 'translateX(0)' },
                          },
                        }}
                      />
                    ))}
                  </Box>
                  {formData.quantity > 1 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                      All assets will have the same name: "{formData.assetName}"
                      {formData.serialNumberPrefix && (
                        <>
                          <br />
                          Serial numbers will follow the pattern: {formData.serialNumberPrefix}-0001, {formData.serialNumberPrefix}-0002, etc.
                        </>
                      )}
                    </Typography>
                  )}
                </Paper>
              </Collapse>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Basic Asset Details */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Asset Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              These details will apply to all assets in this bulk creation
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Base Asset Name"
                value={formData.assetName}
                onChange={(e) => handleChange('assetName', e.target.value)}
                error={!!errors.assetName}
                helperText={errors.assetName || 'Numbers will be appended automatically'}
                required
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  label="Category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  error={!!errors.category}
                  helperText={errors.category}
                  required
                />
                <FormControl sx={{ flex: '0 1 200px' }} required>
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

          {/* Assignment Details */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Assignment Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Owner"
                value={formData.owner}
                onChange={(e) => handleChange('owner', e.target.value)}
                error={!!errors.owner}
                helperText={errors.owner}
                required
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
                  label="Space / Floor"
                  value={formData.spaceOrFloor}
                  onChange={(e) => handleChange('spaceOrFloor', e.target.value)}
                  error={!!errors.spaceOrFloor}
                  helperText={errors.spaceOrFloor}
                  required
                />
              </Box>
            </Box>
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
                Advanced Options (Optional)
              </Typography>
            </Button>

            <Collapse in={showAdvanced}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Add technical details and lifecycle information
                </Typography>

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
                </Box>

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Lifecycle Dates
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
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              size="large"
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              sx={{
                minWidth: 200,
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 0,
                  height: 0,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.3)',
                  transform: 'translate(-50%, -50%)',
                  transition: 'width 0.6s, height 0.6s',
                },
                '&:hover::after': {
                  width: '300px',
                  height: '300px',
                },
              }}
            >
              {isLoading ? 'Creating Assets...' : `Create ${formData.quantity} Asset${formData.quantity !== 1 ? 's' : ''}`}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BulkAssetCreationForm;
