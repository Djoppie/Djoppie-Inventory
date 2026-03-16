/**
 * Update Workplace Assets Section
 *
 * Allows selection of existing assets with status "Nieuw" from inventory
 * These are assets that have been created but not yet assigned
 *
 * Design: Neumorphic soft UI with Djoppie blue accent for existing assets
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
  Autocomplete,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import type { Asset } from '../../types/asset.types';
import { getAssets } from '../../api/assets.api';

// Update asset configuration interface
export interface UpdateAssetConfig {
  id: string;
  linkedAsset: Asset;
}

interface UpdateWorkplaceAssetsSectionProps {
  devices: UpdateAssetConfig[];
  onChange: (devices: UpdateAssetConfig[]) => void;
  onScanRequest: () => void;
}

export const UpdateWorkplaceAssetsSection = ({
  devices,
  onChange,
  onScanRequest,
}: UpdateWorkplaceAssetsSectionProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Neumorphic color constants
  const neuBg = isDark ? '#1e2328' : '#e8eef3';
  const neuShadowDark = isDark ? '#161a1d' : '#c5cad0';
  const neuShadowLight = isDark ? '#262c33' : '#ffffff';

  // State for available assets (status = Nieuw)
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  // Fetch assets with status "Nieuw" on mount
  useEffect(() => {
    const fetchAssets = async () => {
      setIsLoading(true);
      try {
        const assets = await getAssets('Nieuw');
        setAvailableAssets(assets);
      } catch (error) {
        console.error('Error fetching assets with status Nieuw:', error);
        setAvailableAssets([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssets();
  }, []);

  // Filter out already selected assets
  const filteredAssets = useMemo(() => {
    const selectedIds = new Set(devices.map(d => d.linkedAsset.id));
    return availableAssets.filter(asset => !selectedIds.has(asset.id));
  }, [availableAssets, devices]);

  // Search filter
  const searchFilteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return filteredAssets;
    const query = searchQuery.toLowerCase();
    return filteredAssets.filter(asset =>
      asset.assetCode.toLowerCase().includes(query) ||
      asset.assetName?.toLowerCase().includes(query) ||
      asset.serialNumber?.toLowerCase().includes(query) ||
      asset.brand?.toLowerCase().includes(query) ||
      asset.model?.toLowerCase().includes(query)
    );
  }, [filteredAssets, searchQuery]);

  const addAsset = (asset: Asset) => {
    const newConfig: UpdateAssetConfig = {
      id: `update-asset-${Date.now()}-${Math.random()}`,
      linkedAsset: asset,
    };
    onChange([...devices, newConfig]);
    setSelectedAssetId(null);
    setSearchQuery('');
  };

  const removeDevice = (index: number) => {
    onChange(devices.filter((_, i) => i !== index));
  };

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: 2.5,
        bgcolor: isDark ? 'rgba(30, 35, 40, 0.8)' : 'rgba(232, 238, 243, 0.8)',
        backdropFilter: 'blur(12px)',
        boxShadow: `inset 4px 4px 8px ${neuShadowDark}, inset -4px -4px 8px ${neuShadowLight}`,
      }}
    >
      {/* Section header with count badge - Neumorphic */}
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: neuBg,
              boxShadow: `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}`,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#2196F3',
              }}
            />
          </Box>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.75rem',
              color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            }}
          >
            Bestaand Asset Koppelen
          </Typography>
        </Stack>

        {devices.length > 0 && (
          <Chip
            label={`${devices.length} ${devices.length === 1 ? 'asset' : 'assets'}`}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 700,
              bgcolor: neuBg,
              color: '#2196F3',
              border: 'none',
              boxShadow: `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}`,
            }}
          />
        )}
      </Stack>

      {/* Visual summary - Selected assets */}
      {devices.length > 0 && (
        <Box
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: 2.5,
            bgcolor: neuBg,
            boxShadow: `inset 3px 3px 6px ${neuShadowDark}, inset -3px -3px 6px ${neuShadowLight}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 1.5,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.65rem',
              color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
            }}
          >
            Geselecteerde assets uit inventaris
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {devices.map((device, index) => (
              <Chip
                key={device.id}
                icon={<InventoryIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={`${device.linkedAsset.assetCode} — ${device.linkedAsset.assetName || device.linkedAsset.alias || ''}`}
                size="small"
                onDelete={() => removeDevice(index)}
                deleteIcon={<DeleteOutlineIcon sx={{ fontSize: '0.9rem !important' }} />}
                sx={{
                  height: 28,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: neuBg,
                  color: '#2196F3',
                  border: 'none',
                  boxShadow: `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}, 0 0 0 2px rgba(33, 150, 243, 0.3)`,
                  transition: 'all 0.2s ease',
                  '& .MuiChip-icon': { color: '#2196F3' },
                  '& .MuiChip-deleteIcon': {
                    color: 'error.main',
                    '&:hover': { color: 'error.dark' },
                  },
                  '&:hover': {
                    boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* QR Scan Button - Djoppie Neumorphic */}
      <Button
        fullWidth
        size="small"
        startIcon={<QrCodeScannerIcon />}
        onClick={onScanRequest}
        sx={{
          mb: 2,
          borderRadius: 2,
          bgcolor: neuBg,
          color: '#FF7700',
          fontWeight: 600,
          fontSize: '0.8rem',
          py: 1,
          border: 'none',
          textTransform: 'none',
          boxShadow: `4px 4px 8px ${neuShadowDark}, -4px -4px 8px ${neuShadowLight}, inset 0 0 0 1px rgba(255, 119, 0, 0.15)`,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: neuBg,
            transform: 'translateY(-1px)',
            boxShadow: `5px 5px 10px ${neuShadowDark}, -5px -5px 10px ${neuShadowLight}, 0 3px 8px rgba(255, 119, 0, 0.25), inset 0 0 0 2px rgba(255, 119, 0, 0.35)`,
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: `inset 3px 3px 6px ${neuShadowDark}, inset -3px -3px 6px ${neuShadowLight}, inset 0 0 0 2px rgba(255, 119, 0, 0.5)`,
          },
        }}
      >
        Scan QR-code bestaand asset
      </Button>

      {/* Asset search/selection - Neumorphic */}
      <Autocomplete
        options={searchFilteredAssets}
        getOptionLabel={(option) => `${option.assetCode} — ${option.assetName || option.alias || ''}`}
        loading={isLoading}
        inputValue={searchQuery}
        onInputChange={(_, value) => setSearchQuery(value)}
        value={availableAssets.find(a => a.id === selectedAssetId) || null}
        onChange={(_, asset) => {
          if (asset) {
            addAsset(asset);
          }
        }}
        filterOptions={(x) => x} // Already filtered by searchFilteredAssets
        noOptionsText={
          isLoading
            ? 'Laden...'
            : searchQuery.trim()
              ? 'Geen assets gevonden'
              : 'Zoek op assetcode, naam of serienummer'
        }
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          return (
            <li {...otherProps} key={key}>
              <Box sx={{ py: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <InventoryIcon sx={{ fontSize: '1rem', color: '#2196F3' }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {option.assetCode}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.assetName || option.alias || 'Geen naam'}
                      {option.brand && option.model ? ` — ${option.brand} ${option.model}` : ''}
                    </Typography>
                  </Box>
                </Stack>
                {option.serialNumber && (
                  <Typography variant="caption" sx={{ display: 'block', ml: 3.5, color: 'text.secondary' }}>
                    S/N: {option.serialNumber}
                  </Typography>
                )}
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Zoek bestaand asset (status: Nieuw)"
            placeholder="Assetcode, naam of serienummer..."
            size="small"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '1.1rem', color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: neuBg,
                borderRadius: 2,
                boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                '& fieldset': { border: 'none' },
                '&:hover, &.Mui-focused': {
                  boxShadow: `inset 3px 3px 6px ${neuShadowDark}, inset -3px -3px 6px ${neuShadowLight}, 0 0 0 2px rgba(33, 150, 243, 0.2)`,
                },
              },
              '& .MuiInputLabel-root': {
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                '&.Mui-focused': { color: '#2196F3' },
              },
            }}
          />
        )}
      />

      {/* Info text */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 1.5,
          color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
          fontStyle: 'italic',
        }}
      >
        {filteredAssets.length} beschikbare assets met status "Nieuw" in inventaris
      </Typography>
    </Box>
  );
};

export default UpdateWorkplaceAssetsSection;
