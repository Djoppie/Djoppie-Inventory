import { FormControl, InputLabel, Select, MenuItem, CircularProgress, FormHelperText } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../../api/admin.api';
import { Category } from '../../types/admin.types';

interface CategorySelectProps {
  value?: number | null;
  onChange: (value: number | null, category?: Category | null) => void;
  label?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const CategorySelect = ({
  value,
  onChange,
  label = 'Category',
  helperText,
  error = false,
  required = false,
  disabled = false,
  fullWidth = true,
}: CategorySelectProps) => {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(false), // Only active categories
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter only active categories and sort by sortOrder
  const activeCategories = (categories || [])
    .filter(cat => cat.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleChange = (selectedValue: unknown) => {
    if (selectedValue === '') {
      onChange(null, null);
    } else {
      const catId = Number(selectedValue);
      const selectedCategory = activeCategories.find(c => c.id === catId);
      onChange(catId, selectedCategory);
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
        {activeCategories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.name}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default CategorySelect;
