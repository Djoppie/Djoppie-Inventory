import { FormControl, InputLabel, Select, MenuItem, CircularProgress, FormHelperText } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { assetTypesApi } from '../../api/admin.api';
import { AssetType } from '../../types/admin.types';

interface AssetTypeSelectProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  label?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const AssetTypeSelect = ({
  value,
  onChange,
  label = 'Asset Type',
  helperText,
  error = false,
  required = false,
  disabled = false,
  fullWidth = true,
}: AssetTypeSelectProps) => {
  const { data: assetTypes, isLoading } = useQuery<AssetType[]>({
    queryKey: ['assetTypes'],
    queryFn: assetTypesApi.getAll,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter only active asset types and sort by sortOrder
  const activeAssetTypes = (assetTypes || [])
    .filter(type => type.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleChange = (selectedValue: unknown) => {
    if (selectedValue === '') {
      onChange(null);
    } else {
      onChange(Number(selectedValue));
    }
  };

  return (
    <FormControl fullWidth={fullWidth} required={required} error={error} disabled={disabled || isLoading}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        label={label}
        endAdornment={
          isLoading ? (
            <CircularProgress size={20} sx={{ mr: 2 }} />
          ) : null
        }
      >
        {!required && (
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
        )}
        {activeAssetTypes.map((type) => (
          <MenuItem key={type.id} value={type.id}>
            {type.code} - {type.name}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default AssetTypeSelect;
