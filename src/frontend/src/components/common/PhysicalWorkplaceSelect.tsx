import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  FormHelperText,
  Box,
  Typography,
  Chip,
  Tooltip,
  alpha,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { physicalWorkplacesApi } from '../../api/physicalWorkplaces.api';
import { PhysicalWorkplaceSummary } from '../../types/physicalWorkplace.types';
import { useTranslation } from 'react-i18next';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import DockIcon from '@mui/icons-material/Dock';
import MonitorIcon from '@mui/icons-material/Monitor';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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
    staleTime: 5 * 60 * 1000,
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

  // Equipment summary display
  const getEquipmentSummary = (wp: PhysicalWorkplaceSummary) => {
    const items: string[] = [];
    if (wp.hasDockingStation) items.push('Dock');
    if (wp.monitorCount && wp.monitorCount > 0) items.push(`${wp.monitorCount}x Mon`);
    return items;
  };

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
                <Typography component="span" fontWeight={600}>{selectedWorkplace.code}</Typography>
                <Typography component="span" color="text.secondary">-</Typography>
                <Typography component="span">{selectedWorkplace.name}</Typography>
                {selectedWorkplace.currentOccupantName ? (
                  <Chip
                    icon={<PersonIcon sx={{ fontSize: 14 }} />}
                    label={selectedWorkplace.currentOccupantName}
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ ml: 1, height: 22 }}
                  />
                ) : (
                  <Chip
                    label={t('physicalWorkplaces.vacant')}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ ml: 1, height: 22 }}
                  />
                )}
              </Box>
            );
          }
          return selected;
        }}
        MenuProps={{
          PaperProps: { style: { maxHeight: 400 } },
        }}
      >
        {!required && (
          <MenuItem value="">
            <em>{t('common.none')}</em>
          </MenuItem>
        )}
        {activeWorkplaces.map((workplace) => {
          const isOccupied = !!workplace.currentOccupantName;
          const equipmentItems = getEquipmentSummary(workplace);

          return (
            <MenuItem
              key={workplace.id}
              value={workplace.id}
              sx={{
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {/* Header row: Code, Name, Occupancy Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography fontWeight={700} color="primary.main">
                    {workplace.code}
                  </Typography>
                  <Typography color="text.secondary">-</Typography>
                  <Typography fontWeight={500}>{workplace.name}</Typography>
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                    {isOccupied ? (
                      <Chip
                        icon={<PersonIcon sx={{ fontSize: 14 }} />}
                        label={t('physicalWorkplaces.occupied')}
                        size="small"
                        color="info"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    ) : (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                        label={t('physicalWorkplaces.vacant')}
                        size="small"
                        color="success"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Location info row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {workplace.buildingName && (
                    <Typography variant="caption" color="text.secondary">
                      {workplace.buildingName}
                    </Typography>
                  )}
                  {workplace.floor && (
                    <Typography variant="caption" color="text.secondary">
                      • {workplace.floor}
                    </Typography>
                  )}
                  {workplace.serviceName && (
                    <Typography variant="caption" color="text.secondary">
                      • {workplace.serviceName}
                    </Typography>
                  )}
                </Box>

                {/* Occupant info row (if occupied) */}
                {isOccupied && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 0.5,
                      p: 0.75,
                      bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                      borderRadius: 1,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 16, color: 'info.main' }} />
                    <Typography variant="body2" fontWeight={500}>
                      {workplace.currentOccupantName}
                    </Typography>
                    {workplace.currentOccupantEmail && (
                      <Typography variant="caption" color="text.secondary">
                        ({workplace.currentOccupantEmail})
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Equipment row */}
                {(equipmentItems.length > 0 || workplace.fixedAssetCount) && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 0.5,
                      p: 0.75,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t('physicalWorkplaces.equipment.title')}:
                    </Typography>
                    {workplace.hasDockingStation && (
                      <Tooltip title={workplace.dockingStationAssetCode || 'Docking station'}>
                        <Chip
                          icon={<DockIcon sx={{ fontSize: 12 }} />}
                          label="Dock"
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </Tooltip>
                    )}
                    {workplace.monitorCount && workplace.monitorCount > 0 && (
                      <Tooltip
                        title={[workplace.monitor1AssetCode, workplace.monitor2AssetCode]
                          .filter(Boolean)
                          .join(', ') || `${workplace.monitorCount} monitor(s)`}
                      >
                        <Chip
                          icon={<MonitorIcon sx={{ fontSize: 12 }} />}
                          label={`${workplace.monitorCount}x`}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </Tooltip>
                    )}
                    {workplace.fixedAssetCount !== undefined && workplace.fixedAssetCount > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        ({workplace.fixedAssetCount} {t('physicalWorkplaces.assets').toLowerCase()})
                      </Typography>
                    )}
                    {!workplace.hasDockingStation && (!workplace.monitorCount || workplace.monitorCount === 0) && (
                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        {t('physicalWorkplaces.equipment.noSlotsConfigured')}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </MenuItem>
          );
        })}
        {!isLoading && activeWorkplaces.length === 0 && (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
              <PersonOffIcon color="disabled" />
              <Typography color="text.secondary">
                {t('physicalWorkplaces.noWorkplaces')}
              </Typography>
            </Box>
          </MenuItem>
        )}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default PhysicalWorkplaceSelect;
