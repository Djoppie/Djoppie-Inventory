import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
import type { AssetTemplate } from '../../types/asset.types';
import type { EquipmentType } from '../../types/rollout';

interface TemplateSelectorProps {
  equipmentType: EquipmentType;
  value?: AssetTemplate | null;
  onChange: (template: AssetTemplate | null) => void;
  required?: boolean;
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
 * Template selector component for equipment selection
 * Filters templates based on equipment type and provides autocomplete functionality
 */
export const TemplateSelector = ({
  equipmentType,
  value,
  onChange,
  required = false,
  label,
}: TemplateSelectorProps) => {
  const { data: templates, isLoading } = useAssetTemplates();

  // Filter templates by equipment type
  const filteredTemplates = templates?.filter((template) => {
    if (!template.assetType?.name) return false;
    const allowedTypes = EQUIPMENT_TYPE_MAPPING[equipmentType] || [];
    return allowedTypes.some((type) =>
      template.assetType!.name.toLowerCase().includes(type.toLowerCase())
    );
  }) || [];

  const defaultLabel = label || `${equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)} Template`;

  return (
    <Autocomplete
      options={filteredTemplates}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        const parts = [];
        if (option.brand) parts.push(option.brand);
        if (option.model) parts.push(option.model);
        if (parts.length > 0) return parts.join(' ');
        return option.templateName || 'Onbekend';
      }}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      loading={isLoading}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label={defaultLabel}
          required={required}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <div>
            <div style={{ fontWeight: 500 }}>
              {option.brand} {option.model}
            </div>
            {option.assetType?.name && (
              <div style={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                {option.assetType.name}
              </div>
            )}
          </div>
        </li>
      )}
      noOptionsText={
        isLoading
          ? 'Laden...'
          : `Geen templates gevonden voor ${equipmentType}`
      }
    />
  );
};

export default TemplateSelector;
