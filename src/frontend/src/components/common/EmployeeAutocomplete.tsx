import { useState, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '../../api/admin.api';
import { Employee } from '../../types/admin.types';

interface EmployeeAutocompleteProps {
  value?: number | null;
  onChange: (employeeId: number | null, employee: Employee | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

const EmployeeAutocomplete = ({
  value,
  onChange,
  label = 'Employee',
  placeholder = 'Search employee...',
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
  size = 'medium',
}: EmployeeAutocompleteProps) => {
  const [inputValue, setInputValue] = useState('');

  // Fetch all active employees for quick selection
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees', 'active'],
    queryFn: () => employeesApi.getAll(false), // Only active employees
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Search employees when typing
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['employees', 'search', inputValue],
    queryFn: () => employeesApi.search(inputValue, 20),
    enabled: inputValue.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch specific employee when value is provided but not in cache
  const { data: fetchedEmployee } = useQuery({
    queryKey: ['employee', value],
    queryFn: () => (value ? employeesApi.getById(value) : null),
    enabled: !!value && !employees.find((e) => e.id === value),
    staleTime: 5 * 60 * 1000,
  });

  // Derive selected employee from available data
  const selectedEmployee = useMemo(() => {
    if (!value) return null;
    // First check in loaded employees list
    const found = employees.find((e) => e.id === value);
    if (found) return found;
    // Then check fetched employee
    if (fetchedEmployee) return fetchedEmployee;
    return null;
  }, [value, employees, fetchedEmployee]);

  // Combine employees list with search results, prioritizing search results
  const options = inputValue.length >= 2 ? searchResults : employees;

  // Handle selection change
  const handleChange = (_event: React.SyntheticEvent, newValue: Employee | null) => {
    onChange(newValue?.id ?? null, newValue);
  };

  // Get initials for avatar
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Autocomplete
      value={selectedEmployee}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue) => setInputValue(newInputValue)}
      options={options}
      getOptionLabel={(option) => option.displayName}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      loading={isLoadingEmployees || isSearching}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      noOptionsText={inputValue.length < 2 ? 'Type to search...' : 'No employees found'}
      filterOptions={(x) => x} // Disable client-side filtering since we use server search
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {(isLoadingEmployees || isSearching) && (
                  <CircularProgress color="inherit" size={20} />
                )}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={({ key, ...props }, option) => {
        // Use employee id as key to avoid duplicate key issues with same names
        void key; // Suppress unused variable warning
        return (
          <li key={option.id} {...props}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#7B1FA2',
                  fontSize: '0.75rem',
                }}
              >
                {getInitials(option.displayName)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {option.displayName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {option.jobTitle && (
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary' }}
                    >
                      {option.jobTitle}
                    </Typography>
                  )}
                  {option.service && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        px: 0.5,
                        borderRadius: 0.5,
                        bgcolor: 'action.hover',
                      }}
                    >
                      {option.service.name}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </li>
        );
      }}
    />
  );
};

export default EmployeeAutocomplete;
