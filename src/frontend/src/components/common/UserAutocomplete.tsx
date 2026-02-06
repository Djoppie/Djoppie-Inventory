import { useState, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Alert
} from '@mui/material';
import { Person, Business, LocationOn } from '@mui/icons-material';
import { graphApi } from '../../api/graph.api';
import { GraphUser } from '../../types/graph.types';
import { debounce } from '../../utils/debounce';

interface UserAutocompleteProps {
  value: string;
  onChange: (displayName: string, user: GraphUser | null) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const UserAutocomplete = ({
  value,
  onChange,
  label = 'Owner',
  required = false,
  error = false,
  helperText,
  disabled = false
}: UserAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<GraphUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<GraphUser | null>(null);

  // Debounced search function
  const searchUsers = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      setSearchError(null);

      try {
        const users = await graphApi.searchUsers(query, 10);
        setOptions(users);
      } catch (error) {
        // Silently fall back to manual input - Graph search is optional
        console.warn('Graph user search unavailable, using manual input:', error);
        setSearchError(null);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Search when input changes
  useEffect(() => {
    if (inputValue && inputValue !== value) {
      searchUsers(inputValue);
    }
  }, [inputValue, value, searchUsers]);

  const handleInputChange = (_event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: GraphUser | string | null) => {
    if (typeof newValue === 'string') {
      // User typed a custom value (free text)
      setSelectedUser(null);
      setInputValue(newValue);
      onChange(newValue, null);
    } else if (newValue) {
      // User selected from dropdown
      setSelectedUser(newValue);
      setInputValue(newValue.displayName);
      onChange(newValue.displayName, newValue);
    } else {
      // Cleared selection
      setSelectedUser(null);
      setInputValue('');
      onChange('', null);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Autocomplete
        freeSolo
        options={options}
        loading={loading}
        disabled={disabled}
        value={selectedUser}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={handleChange}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option.displayName || '';
        }}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Person sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {option.displayName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 3 }}>
                {option.jobTitle && (
                  <Chip
                    label={option.jobTitle}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
                {option.department && (
                  <Chip
                    icon={<Business sx={{ fontSize: 14 }} />}
                    label={option.department}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
                {option.officeLocation && (
                  <Chip
                    icon={<LocationOn sx={{ fontSize: 14 }} />}
                    label={option.officeLocation}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                {option.mail || option.userPrincipalName}
              </Typography>
            </Box>
          </Box>
        )}
        noOptionsText={
          inputValue.length < 2
            ? 'Type at least 2 characters to search'
            : 'No users found'
        }
      />
      {searchError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {searchError}
        </Alert>
      )}
      {selectedUser && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedUser.department && (
            <Chip
              icon={<Business />}
              label={`Department: ${selectedUser.department}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {selectedUser.officeLocation && (
            <Chip
              icon={<LocationOn />}
              label={`Office: ${selectedUser.officeLocation}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default UserAutocomplete;
