import { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getAssetBySerialNumber } from '../../api/assets.api';
import type { Asset } from '../../types/asset.types';

interface SerialSearchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAssetFound?: (asset: Asset) => void;
  onCreate?: (serial: string) => void;
  required?: boolean;
  helperText?: string;
}

/**
 * Serial number search field with asset lookup functionality
 * Allows searching for existing assets by serial number and optionally creating new ones
 */
export const SerialSearchField = ({
  label,
  value,
  onChange,
  onAssetFound,
  onCreate,
  required = false,
  helperText,
}: SerialSearchFieldProps) => {
  const [searching, setSearching] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!value || !value.trim()) {
      setError('Voer een serienummer in');
      return;
    }

    setSearching(true);
    setError(null);
    setAsset(null);

    try {
      const foundAsset = await getAssetBySerialNumber(value);
      setAsset(foundAsset);
      if (onAssetFound) {
        onAssetFound(foundAsset);
      }
    } catch (err) {
      setAsset(null);
      setError('Asset niet gevonden');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAsset(null);
          setError(null);
        }}
        onKeyPress={handleKeyPress}
        required={required}
        helperText={helperText}
        error={!!error}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleSearch}
                disabled={!value || searching}
                edge="end"
              >
                {searching ? <CircularProgress size={20} /> : <SearchIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {asset && (
        <Alert severity="success" sx={{ mt: 1 }}>
          <strong>Gevonden:</strong> {asset.assetCode} - {asset.assetName}
          {asset.brand && asset.model && (
            <span> ({asset.brand} {asset.model})</span>
          )}
        </Alert>
      )}

      {error && onCreate && (
        <Alert
          severity="info"
          sx={{ mt: 1 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => onCreate(value)}
            >
              Nieuw Aanmaken
            </Button>
          }
        >
          Asset niet gevonden met serienummer "{value}"
        </Alert>
      )}

      {error && !onCreate && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default SerialSearchField;
