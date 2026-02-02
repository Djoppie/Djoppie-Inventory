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
} from '@mui/material';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
import { Asset, CreateAssetDto, UpdateAssetDto, AssetTemplate } from '../../types/asset.types';

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
  // Handle both ISO format (2026-01-01T00:00:00) and date-only format (2026-01-01)
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Invalid date

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const AssetForm = ({ initialData, onSubmit, onCancel, isLoading, isEditMode }: AssetFormProps) => {
  const { data: templates, isLoading: templatesLoading } = useAssetTemplates();

  const [formData, setFormData] = useState<CreateAssetDto>({
    assetCode: initialData?.assetCode || '',
    assetName: initialData?.assetName || '',
    category: initialData?.category || '',
    owner: initialData?.owner || '',
    building: initialData?.building || '',
    spaceOrFloor: initialData?.spaceOrFloor || '',
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
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.assetCode.trim()) newErrors.assetCode = 'Asset code is required';
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

    if (isEditMode) {
      const { assetCode, ...updateData } = formData;
      onSubmit(updateData as UpdateAssetDto);
    } else {
      onSubmit(formData);
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
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  label="Asset Code"
                  value={formData.assetCode}
                  onChange={(e) => handleChange('assetCode', e.target.value)}
                  error={!!errors.assetCode}
                  helperText={errors.assetCode || 'Unique identifier (e.g., AST-001)'}
                  required
                  disabled={isEditMode}
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

          <Divider sx={{ my: 3 }} />

          {/* Technical Details Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Technical Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Optional but recommended for better asset tracking
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              disabled={isLoading}
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
