import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Tooltip,
  alpha,
  InputAdornment,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { physicalWorkplacesApi } from '../../api/physicalWorkplaces.api';
import { PhysicalWorkplaceSummary } from '../../types/physicalWorkplace.types';
import { useTranslation } from 'react-i18next';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
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

  const activeWorkplaces = (workplaces || []).filter((wp) => wp.isActive);
  const selectedWorkplace = activeWorkplaces.find((wp) => wp.id === value) ?? null;

  const resolvedLabel = label || t('assetForm.physicalWorkplace');

  return (
    <Autocomplete<PhysicalWorkplaceSummary, false, false, false>
      value={selectedWorkplace}
      onChange={(_, next) => onChange(next?.id ?? null, next ?? null)}
      options={activeWorkplaces}
      loading={isLoading}
      disabled={disabled || isLoading}
      fullWidth={fullWidth}
      // Plain text key used to filter against typed input. We include code,
      // name, building, service and occupant so users can find a workplace
      // by typing any of those.
      getOptionLabel={(wp) =>
        [wp.code, wp.name, wp.buildingName, wp.serviceName, wp.currentOccupantName]
          .filter(Boolean)
          .join(' · ')
      }
      isOptionEqualToValue={(option, val) => option.id === val.id}
      filterOptions={(options, state) => {
        const q = state.inputValue.trim().toLowerCase();
        if (!q) return options;
        return options.filter((wp) =>
          [
            wp.code,
            wp.name,
            wp.buildingName,
            wp.serviceName,
            wp.floor,
            wp.currentOccupantName,
            wp.currentOccupantEmail,
          ]
            .filter(Boolean)
            .some((field) => field!.toLowerCase().includes(q)),
        );
      }}
      noOptionsText={t('physicalWorkplaces.noWorkplaces')}
      ListboxProps={{ style: { maxHeight: 400 } }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={resolvedLabel}
          placeholder={t('physicalWorkplaces.searchPlaceholder', 'Zoek op code, naam, gebouw of bewoner')}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <PlaceIcon sx={{ color: 'primary.main' }} fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {isLoading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, workplace) => {
        // MUI 7 passes a stable `key` inside props but ESLint flags
        // unused destructure; use props directly with explicit key override.
        const { key: _key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key?: string };
        void _key;
        const isOccupied = !!workplace.currentOccupantName;
        return (
          <li
            key={`workplace-${workplace.id}`}
            {...rest}
            style={{ paddingTop: 12, paddingBottom: 12, alignItems: 'flex-start', borderBottom: '1px solid rgba(128,128,128,0.12)' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0.5 }}>
              {/* Code · name · occupancy */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography fontWeight={700} color="primary.main">
                  {workplace.code}
                </Typography>
                <Typography color="text.secondary">·</Typography>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
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

              {/* Occupant info row */}
              {isOccupied && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
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
              {(workplace.hasDockingStation ||
                (workplace.monitorCount && workplace.monitorCount > 0) ||
                (workplace.fixedAssetCount && workplace.fixedAssetCount > 0)) && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
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
                      title={
                        [workplace.monitor1AssetCode, workplace.monitor2AssetCode]
                          .filter(Boolean)
                          .join(', ') || `${workplace.monitorCount} monitor(s)`
                      }
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
                </Box>
              )}
            </Box>
          </li>
        );
      }}
    />
  );
};

export default PhysicalWorkplaceSelect;
