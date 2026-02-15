import { FormControl, InputLabel, Select, MenuItem, CircularProgress, FormHelperText } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '../../api/admin.api';
import { Service } from '../../types/admin.types';

interface ServiceSelectProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  label?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  sectorId?: number; // Optional filter by sector
}

const ServiceSelect = ({
  value,
  onChange,
  label = 'Service / Department',
  helperText,
  error = false,
  required = false,
  disabled = false,
  fullWidth = true,
  sectorId,
}: ServiceSelectProps) => {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: sectorId ? ['services', 'by-sector', sectorId] : ['services'],
    queryFn: sectorId ? () => servicesApi.getBySector(sectorId) : servicesApi.getAll,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter only active services and sort by sortOrder
  const activeServices = (services || [])
    .filter(service => service.isActive)
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
        {activeServices.map((service) => (
          <MenuItem key={service.id} value={service.id}>
            {service.code} - {service.name}
            {service.sector && ` (${service.sector.name})`}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default ServiceSelect;
