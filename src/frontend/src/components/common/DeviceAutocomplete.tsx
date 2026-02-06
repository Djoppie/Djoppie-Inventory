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
import {
  Computer,
  Smartphone,
  Tablet,
  Check,
  Warning
} from '@mui/icons-material';
import { intuneApi } from '../../api/intune.api';
import { IntuneDevice } from '../../types/graph.types';
import { debounce } from '../../utils/debounce';

interface DeviceAutocompleteProps {
  value: string;
  onSelect: (device: IntuneDevice | null) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  searchBy?: 'name' | 'serial';
}

const DeviceAutocomplete = ({
  value,
  onSelect,
  label = 'Search Device',
  helperText,
  disabled = false,
  searchBy = 'name'
}: DeviceAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<IntuneDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<IntuneDevice | null>(null);

  // Debounced search function
  const searchDevices = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      setSearchError(null);

      try {
        if (searchBy === 'serial') {
          // Search by serial number (exact match)
          try {
            const device = await intuneApi.getDeviceBySerialNumber(query);
            setOptions([device]);
          } catch {
            // If not found, return empty array
            setOptions([]);
          }
        } else {
          // Search by device name (partial match)
          const devices = await intuneApi.searchDevicesByName(query);
          setOptions(devices);
        }
      } catch (error) {
        console.error('Error searching devices:', error);
        setSearchError('Failed to search devices. Please try again.');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [searchBy]
  );

  // Search when input changes
  useEffect(() => {
    if (inputValue && inputValue !== value) {
      searchDevices(inputValue);
    }
  }, [inputValue, value, searchDevices]);

  const handleInputChange = (_event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: IntuneDevice | null) => {
    setSelectedDevice(newValue);
    onSelect(newValue);
    if (newValue) {
      setInputValue(newValue.deviceName || '');
    }
  };

  const getDeviceIcon = (device: IntuneDevice) => {
    const os = device.operatingSystem?.toLowerCase() || '';
    if (os.includes('windows')) return <Computer />;
    if (os.includes('ios') || os.includes('iphone')) return <Smartphone />;
    if (os.includes('android')) return <Smartphone />;
    if (os.includes('ipad')) return <Tablet />;
    return <Computer />;
  };

  const getComplianceIcon = (device: IntuneDevice) => {
    const state = device.complianceState?.toLowerCase() || '';
    if (state === 'compliant') {
      return <Check sx={{ fontSize: 16, color: 'success.main' }} />;
    }
    return <Warning sx={{ fontSize: 16, color: 'warning.main' }} />;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Autocomplete
        options={options}
        loading={loading}
        disabled={disabled}
        value={selectedDevice}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={handleChange}
        getOptionLabel={(option) => option.deviceName || ''}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            helperText={helperText || `Search by device ${searchBy}`}
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
                {getDeviceIcon(option)}
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {option.deviceName}
                </Typography>
                {getComplianceIcon(option)}
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 3 }}>
                {option.manufacturer && (
                  <Chip
                    label={`${option.manufacturer} ${option.model || ''}`}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
                {option.serialNumber && (
                  <Chip
                    label={`SN: ${option.serialNumber}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
                {option.operatingSystem && (
                  <Chip
                    label={`${option.operatingSystem} ${option.osVersion || ''}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
              {option.userPrincipalName && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                  Assigned to: {option.userPrincipalName}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        noOptionsText={
          inputValue.length < 2
            ? 'Type at least 2 characters to search'
            : 'No devices found'
        }
      />
      {searchError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {searchError}
        </Alert>
      )}
      {selectedDevice && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedDevice.serialNumber && (
            <Chip
              label={`Serial: ${selectedDevice.serialNumber}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {selectedDevice.manufacturer && selectedDevice.model && (
            <Chip
              label={`${selectedDevice.manufacturer} ${selectedDevice.model}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
          {selectedDevice.complianceState && (
            <Chip
              icon={selectedDevice.complianceState === 'Compliant' ? <Check /> : <Warning />}
              label={selectedDevice.complianceState}
              size="small"
              color={selectedDevice.complianceState === 'Compliant' ? 'success' : 'warning'}
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default DeviceAutocomplete;
