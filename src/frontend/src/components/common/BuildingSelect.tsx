import { FormControl, InputLabel, Select, MenuItem, CircularProgress, FormHelperText } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { buildingsApi } from '../../api/admin.api';
import { Building } from '../../types/admin.types';

interface BuildingSelectProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  label?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const BuildingSelect = ({
  value,
  onChange,
  label = 'Building',
  helperText,
  error = false,
  required = false,
  disabled = false,
  fullWidth = true,
}: BuildingSelectProps) => {
  const { data: buildings, isLoading } = useQuery<Building[]>({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter only active buildings and sort by sortOrder
  const activeBuildings = (buildings || [])
    .filter(building => building.isActive)
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
        {activeBuildings.map((building) => (
          <MenuItem key={building.id} value={building.id}>
            {building.code} - {building.name}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default BuildingSelect;
