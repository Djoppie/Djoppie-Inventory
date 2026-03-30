import { FormControl, InputLabel, Select, MenuItem, CircularProgress, FormHelperText, ListSubheader, Box, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { assetTypesApi, categoriesApi } from '../../api/admin.api';
import { AssetType, Category } from '../../types/admin.types';
import { useMemo } from 'react';

interface AssetTypeSelectProps {
  value?: number | null;
  onChange: (value: number | null, assetType?: AssetType | null) => void;
  label?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  categoryId?: number; // Optional filter by category
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
  categoryId,
}: AssetTypeSelectProps) => {
  const { data: assetTypes, isLoading: typesLoading } = useQuery<AssetType[]>({
    queryKey: ['assetTypes'],
    queryFn: () => assetTypesApi.getAll(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(false),
    staleTime: 5 * 60 * 1000,
  });

  // Filter active asset types and optionally by category
  const filteredAssetTypes = useMemo(() => {
    let types = (assetTypes || []).filter(type => type.isActive);

    if (categoryId) {
      types = types.filter(type => type.categoryId === categoryId);
    }

    return types.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [assetTypes, categoryId]);

  // Group asset types by category for better UX
  const groupedAssetTypes = useMemo(() => {
    if (categoryId) {
      // If filtered by category, don't group
      return null;
    }

    const categoryMap = new Map<number | undefined, { category?: Category; types: AssetType[] }>();

    filteredAssetTypes.forEach(type => {
      const catId = type.categoryId;
      if (!categoryMap.has(catId)) {
        const cat = categories?.find(c => c.id === catId);
        categoryMap.set(catId, { category: cat, types: [] });
      }
      categoryMap.get(catId)!.types.push(type);
    });

    return Array.from(categoryMap.entries())
      .sort((a, b) => {
        // Sort by category sortOrder, uncategorized last
        const catA = a[1].category;
        const catB = b[1].category;
        if (!catA && !catB) return 0;
        if (!catA) return 1;
        if (!catB) return -1;
        return catA.sortOrder - catB.sortOrder;
      });
  }, [filteredAssetTypes, categories, categoryId]);

  const handleChange = (selectedValue: unknown) => {
    if (selectedValue === '') {
      onChange(null, null);
    } else {
      const typeId = Number(selectedValue);
      const selectedType = filteredAssetTypes.find(t => t.id === typeId)
        || assetTypes?.find(t => t.id === typeId); // Fallback to all types
      onChange(typeId, selectedType);
    }
  };

  const isLoading = typesLoading;
  const selectedType = assetTypes?.find(t => t.id === value);

  return (
    <FormControl fullWidth={fullWidth} required={required} error={error} disabled={disabled || isLoading}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        label={label}
        renderValue={() => selectedType ? `${selectedType.code} - ${selectedType.name}` : ''}
        endAdornment={
          isLoading ? (
            <CircularProgress size={20} sx={{ mr: 2 }} />
          ) : null
        }
        MenuProps={{
          PaperProps: { style: { maxHeight: 400 } },
        }}
      >
        {!required && (
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
        )}

        {/* Show grouped by category when not filtered */}
        {groupedAssetTypes ? (
          groupedAssetTypes.map(([catId, { category, types }]) => [
            <ListSubheader
              key={`cat-${catId ?? 'none'}`}
              sx={{
                bgcolor: 'action.hover',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {category?.name || 'Uncategorized'}
              <Chip
                label={types.length}
                size="small"
                sx={{ ml: 'auto', height: 20, fontSize: '0.7rem' }}
              />
            </ListSubheader>,
            ...types.map((type) => (
              <MenuItem key={type.id} value={type.id} sx={{ pl: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={type.code}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                  />
                  {type.name}
                </Box>
              </MenuItem>
            )),
          ])
        ) : (
          /* Show flat list when filtered by category */
          filteredAssetTypes.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={type.code}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                />
                {type.name}
              </Box>
            </MenuItem>
          ))
        )}

        {filteredAssetTypes.length === 0 && !isLoading && (
          <MenuItem disabled>
            <em>No asset types available</em>
          </MenuItem>
        )}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default AssetTypeSelect;
