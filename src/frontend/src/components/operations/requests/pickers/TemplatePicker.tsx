import { Autocomplete, Box, Chip, TextField, alpha } from '@mui/material';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { RichOption, richAutocompleteSlotProps } from './RichOption';
import type { AssetTemplate } from '../../../../types/asset.types';

interface Props {
  options: AssetTemplate[];
  value: AssetTemplate | null;
  onChange: (template: AssetTemplate | null) => void;
  label: string;
  disabled?: boolean;
  /** Optional: restrict templates to a specific asset type id. */
  filterByAssetTypeId?: number;
}

export function TemplatePicker({
  options,
  value,
  onChange,
  label,
  disabled,
  filterByAssetTypeId,
}: Props) {
  const filtered = filterByAssetTypeId
    ? options.filter((t) => t.assetTypeId === filterByAssetTypeId)
    : options;

  return (
    <Autocomplete<AssetTemplate>
      size="small"
      options={filtered}
      value={value}
      onChange={(_, selected) => onChange(selected)}
      disabled={disabled}
      getOptionLabel={(t) => t.templateName}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      slotProps={richAutocompleteSlotProps}
      renderInput={(params) => <TextField {...params} label={label} />}
      renderOption={(props, tpl, { selected }) => {
        const subtitle = [
          [tpl.brand, tpl.model].filter(Boolean).join(' '),
          tpl.assetType?.name ?? tpl.category,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <RichOption
            {...props}
            key={tpl.id}
            selected={selected}
            primary={tpl.templateName}
            secondary={subtitle || tpl.assetName || undefined}
            leading={
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: (theme) =>
                    alpha('#FF7700', theme.palette.mode === 'dark' ? 0.18 : 0.12),
                  color: '#FF7700',
                }}
              >
                <AddBoxIcon sx={{ fontSize: 18 }} />
              </Box>
            }
            trailing={
              tpl.assetType?.name && (
                <Chip
                  size="small"
                  label={tpl.assetType.name}
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              )
            }
          />
        );
      }}
    />
  );
}
