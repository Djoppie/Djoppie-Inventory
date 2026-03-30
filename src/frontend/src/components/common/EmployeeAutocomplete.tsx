import { useState, useEffect } from 'react';
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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

  // Load selected employee when value prop changes
  useEffect(() => {
    if (value) {
      const found = employees.find((e) => e.id === value);
      if (found) {
        setSelectedEmployee(found);
      } else {
        // Fetch the specific employee if not in cache
        employeesApi.getById(value).then(setSelectedEmployee).catch(() => {
          setSelectedEmployee(null);
        });
      }
    } else {
      setSelectedEmployee(null);
    }
  }, [value, employees]);

  // Combine employees list with search results, prioritizing search results
  const options = inputValue.length >= 2 ? searchResults : employees;

  // Handle selection change
  const handleChange = (_event: React.SyntheticEvent, newValue: Employee | null) => {
    setSelectedEmployee(newValue);
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
      renderOption={(props, option) => {
        // Remove key from props and pass it separately
        const { key, ...restProps } = props as { key: string; [k: string]: unknown };
        return (
          <li key={key} {...restProps}>
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
