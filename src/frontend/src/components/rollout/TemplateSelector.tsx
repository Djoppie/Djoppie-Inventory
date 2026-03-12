import { useMemo } from 'react';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
} from '@mui/material';
import LaptopIcon from '@mui/icons-material/Laptop';
import ComputerIcon from '@mui/icons-material/Computer';
import DockIcon from '@mui/icons-material/Dock';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
import type { AssetTemplate } from '../../types/asset.types';
import type { EquipmentType } from '../../types/rollout';

interface TemplateSelectorProps {
  equipmentType: EquipmentType;
  value?: AssetTemplate | null;
  onChange: (template: AssetTemplate | null) => void;
  required?: boolean;
  error?: boolean;
  label?: string;
}

/**
 * Equipment type mapping to asset type names for filtering
 */
const EQUIPMENT_TYPE_MAPPING: Record<EquipmentType, string[]> = {
  laptop: ['Laptop', 'laptop'],
  desktop: ['Desktop', 'desktop', 'PC'],
  docking: ['Docking Station', 'Docking', 'docking'],
  monitor: ['Monitor', 'monitor', 'Screen', 'Beeldscherm'],
  keyboard: ['Keyboard', 'keyboard', 'Toetsenbord'],
  mouse: ['Mouse', 'mouse', 'Muis'],
};

/**
 * Icon mapping for equipment types
 */
const EQUIPMENT_ICONS: Record<EquipmentType, React.ReactElement> = {
  laptop: <LaptopIcon sx={{ fontSize: '1rem' }} />,
  desktop: <ComputerIcon sx={{ fontSize: '1rem' }} />,
  docking: <DockIcon sx={{ fontSize: '1rem' }} />,
  monitor: <MonitorIcon sx={{ fontSize: '1rem' }} />,
  keyboard: <KeyboardIcon sx={{ fontSize: '1rem' }} />,
  mouse: <MouseIcon sx={{ fontSize: '1rem' }} />,
};

/**
 * Simple dropdown template selector component
 */
export const TemplateSelector = ({
  equipmentType,
  value,
  onChange,
  required = false,
  error = false,
  label,
}: TemplateSelectorProps) => {
  const { data: templates, isLoading } = useAssetTemplates();

  // Filter templates by equipment type
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];

    return templates
      .filter((template) => {
        if (!template.assetType?.name) return false;
        const allowedTypes = EQUIPMENT_TYPE_MAPPING[equipmentType] || [];
        return allowedTypes.some((type) =>
          template.assetType!.name.toLowerCase().includes(type.toLowerCase())
        );
      })
      .sort((a, b) => {
        const nameA = `${a.brand} ${a.model}`.toLowerCase();
        const nameB = `${b.brand} ${b.model}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [templates, equipmentType]);

  const defaultLabel = label || `${equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)} Template`;

  return (
    <Box>
      <Autocomplete
        value={value || null}
        onChange={(_, newValue) => onChange(newValue)}
        options={filteredTemplates}
        getOptionLabel={(option) => `${option.brand} ${option.model}`}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        loading={isLoading}
        renderInput={(params) => (
          <TextField
            {...params}
            label={defaultLabel}
            required={required}
            error={error}
            helperText={error ? 'Template vereist' : undefined}
            size="small"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5, mr: 1, color: error ? 'error.main' : 'text.secondary' }}>
                    {EQUIPMENT_ICONS[equipmentType]}
                  </Box>
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          return (
            <Box
              component="li"
              key={key}
              {...otherProps}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important', py: 1 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {option.brand} {option.model}
              </Typography>
              {option.templateName && (
                <Typography variant="caption" color="text.secondary">
                  {option.templateName}
                </Typography>
              )}
            </Box>
          );
        }}
        noOptionsText={`Geen templates beschikbaar voor ${equipmentType}`}
        clearText="Wissen"
        openText="Openen"
        closeText="Sluiten"
      />
    </Box>
  );
};

export default TemplateSelector;
