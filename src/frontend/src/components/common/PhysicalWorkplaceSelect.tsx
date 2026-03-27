import { FormControl, InputLabel, Select, MenuItem, CircularProgress, FormHelperText, Box, Typography, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { physicalWorkplacesApi } from '../../api/physicalWorkplaces.api';
import { PhysicalWorkplaceSummary } from '../../types/physicalWorkplace.types';
import { useTranslation } from 'react-i18next';
import PlaceIcon from '@mui/icons-material/Place';

interface PhysicalWorkplaceSelectProps {
  value?: number | null;
  onChange: (value: number | null, workplace?: PhysicalWorkplaceSummary | null) => void;
  label?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  buildingId?: number;
  serviceId?: number;
}

const PhysicalWorkplaceSelect = ({
  value,
  onChange,
  label,
  helperText,
  error = false,
  required = false,
  disabled = false,
  fullWidth = true,
  buildingId,
  serviceId,
}: PhysicalWorkplaceSelectProps) => {
  const { t } = useTranslation();

  const { data: workplaces, isLoading } = useQuery<PhysicalWorkplaceSummary[]>({
    queryKey: ['physicalWorkplaces', 'summary', buildingId, serviceId],
    queryFn: () => physicalWorkplacesApi.getSummary(buildingId, serviceId, true),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const activeWorkplaces = (workplaces || []).filter(wp => wp.isActive);

  const handleChange = (selectedValue: unknown) => {
    if (selectedValue === '') {
      onChange(null, null);
    } else {
      const wpId = Number(selectedValue);
      const selectedWorkplace = activeWorkplaces.find(wp => wp.id === wpId);
      onChange(wpId, selectedWorkplace);
    }
  };

  const selectedWorkplace = activeWorkplaces.find(wp => wp.id === value);

  return (
    <FormControl fullWidth={fullWidth} required={required} error={error} disabled={disabled || isLoading}>
      <InputLabel>{label || t('assetForm.physicalWorkplace')}</InputLabel>
      <Select
        value={value ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        label={label || t('assetForm.physicalWorkplace')}
        startAdornment={
          <PlaceIcon sx={{ color: 'primary.main', mr: 1, ml: -0.5 }} />
        }
        endAdornment={
          isLoading ? (
            <CircularProgress size={20} sx={{ mr: 2 }} />
          ) : null
        }
        renderValue={(selected: number | '') => {
          if (!selected) {
            return <em>{t('common.none')}</em>;
          }
          if (selectedWorkplace) {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography component="span">{selectedWorkplace.code}</Typography>
                <Typography component="span" color="text.secondary">-</Typography>
                <Typography component="span">{selectedWorkplace.name}</Typography>
                {selectedWorkplace.currentOccupantName && (
                  <Chip
                    label={selectedWorkplace.currentOccupantName}
                    size="small"
                    variant="outlined"
                    color="info"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </Box>
            );
          }
          return selected;
        }}
      >
        {!required && (
          <MenuItem value="">
            <em>{t('common.none')}</em>
          </MenuItem>
        )}
        {activeWorkplaces.map((workplace) => (
          <MenuItem key={workplace.id} value={workplace.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography fontWeight={600}>{workplace.code}</Typography>
                <Typography color="text.secondary">-</Typography>
                <Typography>{workplace.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                {workplace.buildingName && (
                  <Typography variant="caption" color="text.secondary">
                    {workplace.buildingName}
                  </Typography>
                )}
                {workplace.serviceName && (
                  <Typography variant="caption" color="text.secondary">
                    • {workplace.serviceName}
                  </Typography>
                )}
                {workplace.currentOccupantName && (
                  <Chip
                    label={workplace.currentOccupantName}
                    size="small"
                    variant="outlined"
                    color="info"
                    sx={{ height: 18, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
          </MenuItem>
        ))}
        {!isLoading && activeWorkplaces.length === 0 && (
          <MenuItem disabled>
            <Typography color="text.secondary">
              {t('physicalWorkplaces.noWorkplaces')}
            </Typography>
          </MenuItem>
        )}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default PhysicalWorkplaceSelect;
