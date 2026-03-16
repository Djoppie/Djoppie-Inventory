/**
 * Old Device Configuration Section
 *
 * Manages multiple old devices being returned during a rollout
 * Supports QR scanning and serial number entry for each device
 * Auto-checks serial numbers in Djoppie DB with debounce
 *
 * Design: Neumorphic soft UI with warning orange accent for old devices
 */

import { useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type { Asset } from '../../types/asset.types';
import { ROLLOUT_TIMING, ROLLOUT_UI } from '../../constants/rollout.constants';

// Status options for returned devices
export type ReturnDeviceStatus = 'Defect' | 'UitDienst';

// Old device configuration interface
export interface OldDeviceConfig {
  id: string;
  serialNumber: string;
  linkedAsset: Asset | null;
  returnStatus?: ReturnDeviceStatus;
}

interface OldDeviceConfigSectionProps {
  devices: OldDeviceConfig[];
  onChange: (devices: OldDeviceConfig[]) => void;
  onScanRequest: (deviceIndex: number) => void;
  onSerialSearch: (deviceIndex: number, serial: string) => void;
}

export const OldDeviceConfigSection = ({
  devices,
  onChange,
  onScanRequest,
  onSerialSearch,
}: OldDeviceConfigSectionProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Neumorphic color constants
  const neuBg = isDark ? '#1e2328' : '#e8eef3';
  const neuShadowDark = isDark ? '#161a1d' : '#c5cad0';
  const neuShadowLight = isDark ? '#262c33' : '#ffffff';

  const addDevice = () => {
    const newDevice: OldDeviceConfig = {
      id: `old-device-${Date.now()}-${Math.random()}`,
      serialNumber: '',
      linkedAsset: null,
      returnStatus: 'UitDienst', // Default to swap/retirement
    };
    onChange([...devices, newDevice]);
  };

  const removeDevice = (index: number) => {
    onChange(devices.filter((_, i) => i !== index));
  };

  const updateDevice = (index: number, updates: Partial<OldDeviceConfig>) => {
    const updated = [...devices];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  // Track which serial numbers are being auto-checked (debounce)
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastSearched = useRef<Record<string, string>>({});

  // Auto-check serial numbers with debounce
  useEffect(() => {
    const timers = debounceTimers.current;

    devices.forEach((device, index) => {
      const serial = device.serialNumber.trim();

      // Only auto-check if:
      // - Serial number is at least MIN_SERIAL_LENGTH_FOR_SEARCH characters
      // - Device is not already linked to an asset
      // - Serial hasn't been searched yet (or changed)
      if (serial.length >= ROLLOUT_UI.MIN_SERIAL_LENGTH_FOR_SEARCH && !device.linkedAsset && serial !== lastSearched.current[device.id]) {
        // Clear existing timer for this device
        if (timers[device.id]) {
          clearTimeout(timers[device.id]);
        }

        // Set new debounce timer
        timers[device.id] = setTimeout(() => {
          lastSearched.current[device.id] = serial;
          onSerialSearch(index, serial);
        }, ROLLOUT_TIMING.SERIAL_SEARCH_DEBOUNCE_MS);
      }
    });

    // Cleanup timers on unmount
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [devices, onSerialSearch]);

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
                bgcolor: 'warning.main',
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
            In te leveren apparaat
          </Typography>
        </Stack>

        {devices.length > 0 && (
          <Chip
            label={`${devices.length} ${devices.length === 1 ? 'apparaat' : 'apparaten'}`}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 700,
              bgcolor: neuBg,
              color: '#FF9800',
              border: 'none',
              boxShadow: `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}`,
            }}
          />
        )}
      </Stack>

      {/* Visual summary - Neumorphic Chip bar */}
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
            In te leveren apparaten
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {devices.map((device) => (
              <Chip
                key={device.id}
                icon={<HistoryIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={
                  device.linkedAsset
                    ? `${device.linkedAsset.assetCode} — ${device.linkedAsset.assetName}`
                    : device.serialNumber || 'Niet gekoppeld'
                }
                size="small"
                sx={{
                  height: 26,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: neuBg,
                  color: device.linkedAsset ? '#FF9800' : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'),
                  border: 'none',
                  boxShadow: device.linkedAsset
                    ? `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}, 0 0 0 2px rgba(255, 152, 0, 0.3)`
                    : `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}`,
                  transition: 'all 0.2s ease',
                  '& .MuiChip-icon': { color: device.linkedAsset ? '#FF9800' : (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)') },
                  '&:hover': {
                    boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Device entry cards - Neumorphic */}
      <Stack spacing={2.5}>
        {devices.map((device, index) => (
          <Box
            key={device.id}
            sx={{
              position: 'relative',
              borderRadius: 3,
              p: 2.5,
              bgcolor: neuBg,
              boxShadow: device.linkedAsset
                ? `4px 4px 8px ${neuShadowDark}, -4px -4px 8px ${neuShadowLight}, 0 0 0 2px rgba(255, 152, 0, 0.3)`
                : `4px 4px 8px ${neuShadowDark}, -4px -4px 8px ${neuShadowLight}`,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: `slideIn 0.3s ease-out ${index * 0.05}s backwards`,
              '@keyframes slideIn': {
                from: {
                  opacity: 0,
                  transform: 'translateY(-10px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
              '&:hover': {
                boxShadow: `6px 6px 12px ${neuShadowDark}, -6px -6px 12px ${neuShadowLight}, inset 0 0 0 2px rgba(255, 152, 0, 0.2)`,
                '& .delete-button': {
                  opacity: 1,
                  transform: 'scale(1)',
                },
              },
            }}
          >
            {/* Device card header - Neumorphic */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: neuBg,
                  boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                  color: '#FF9800',
                  transition: 'all 0.3s ease',
                }}
              >
                <HistoryIcon sx={{ fontSize: '1.1rem' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#FF9800' }}>
                  Apparaat {index + 1}
                </Typography>
                {device.linkedAsset && (
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                    {device.linkedAsset.assetCode}
                  </Typography>
                )}
              </Box>
              <IconButton
                className="delete-button"
                size="small"
                onClick={() => removeDevice(index)}
                aria-label="Verwijder apparaat"
                sx={{
                  opacity: 0,
                  transform: 'scale(0.8)',
                  transition: 'all 0.2s ease',
                  color: 'error.main',
                  bgcolor: neuBg,
                  boxShadow: `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}`,
                  '&:hover': {
                    bgcolor: neuBg,
                    boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                  },
                }}
              >
                <DeleteOutlineIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Stack>

            {/* QR Scan Button - Djoppie Neumorphic */}
            <Button
              fullWidth
              size="small"
              startIcon={<QrCodeScannerIcon />}
              onClick={() => onScanRequest(index)}
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
                // Djoppie neumorphic raised style
                boxShadow: `4px 4px 8px ${neuShadowDark}, -4px -4px 8px ${neuShadowLight}, inset 0 0 0 1px rgba(255, 119, 0, 0.15)`,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: neuBg,
                  transform: 'translateY(-1px)',
                  // Enhanced depth with orange glow
                  boxShadow: `5px 5px 10px ${neuShadowDark}, -5px -5px 10px ${neuShadowLight}, 0 3px 8px rgba(255, 119, 0, 0.25), inset 0 0 0 2px rgba(255, 119, 0, 0.35)`,
                },
                '&:active': {
                  transform: 'translateY(0)',
                  // Press-down inset effect
                  boxShadow: `inset 3px 3px 6px ${neuShadowDark}, inset -3px -3px 6px ${neuShadowLight}, inset 0 0 0 2px rgba(255, 119, 0, 0.5)`,
                },
              }}
            >
              Scan QR-code
            </Button>

            {/* Serial number field - Neumorphic */}
            <TextField
              fullWidth
              label="Serienummer"
              value={device.serialNumber}
              onChange={(e) => {
                updateDevice(index, { serialNumber: e.target.value, linkedAsset: null });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSerialSearch(index, device.serialNumber);
                }
              }}
              size="small"
              placeholder="Voer serienummer in"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => onSerialSearch(index, device.serialNumber)}
                      disabled={!device.serialNumber.trim()}
                      size="small"
                      sx={{
                        color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
                        '&:hover': { color: '#FF7700' },
                      }}
                    >
                      <SearchIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: neuBg,
                  borderRadius: 2,
                  boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                  '& fieldset': { border: 'none' },
                  '&:hover, &.Mui-focused': {
                    boxShadow: `inset 3px 3px 6px ${neuShadowDark}, inset -3px -3px 6px ${neuShadowLight}, 0 0 0 2px rgba(255, 119, 0, 0.2)`,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                  '&.Mui-focused': { color: '#FF7700' },
                },
              }}
            />

            {/* Linked asset indicator - Neumorphic */}
            {device.linkedAsset && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: neuBg,
                  boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}, 0 0 0 2px rgba(76, 175, 80, 0.3)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CheckCircleIcon sx={{ fontSize: '1rem', color: '#4CAF50' }} />
                <Typography variant="caption" fontWeight={600} sx={{ color: '#4CAF50' }}>
                  {device.linkedAsset.assetCode} — {device.linkedAsset.assetName}
                </Typography>
              </Box>
            )}

            {/* Status selection - Defect or UitDienst */}
            <FormControl fullWidth size="small" sx={{ mt: 2 }}>
              <InputLabel
                id={`status-label-${device.id}`}
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                  '&.Mui-focused': { color: '#FF7700' },
                }}
              >
                Status na inleveren
              </InputLabel>
              <Select
                labelId={`status-label-${device.id}`}
                value={device.returnStatus || 'UitDienst'}
                label="Status na inleveren"
                onChange={(e) => updateDevice(index, { returnStatus: e.target.value as ReturnDeviceStatus })}
                sx={{
                  bgcolor: neuBg,
                  borderRadius: 2,
                  boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                  '& fieldset': { border: 'none' },
                  '&:hover, &.Mui-focused': {
                    boxShadow: `inset 3px 3px 6px ${neuShadowDark}, inset -3px -3px 6px ${neuShadowLight}, 0 0 0 2px rgba(255, 119, 0, 0.2)`,
                  },
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  },
                }}
              >
                <MenuItem value="Defect">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ReportProblemIcon sx={{ fontSize: '1rem', color: '#f44336' }} />
                    <span>Defect (voor reparatie)</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="UitDienst">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SwapHorizIcon sx={{ fontSize: '1rem', color: '#9e9e9e' }} />
                    <span>Uit Dienst (swap)</span>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        ))}
      </Stack>

      {/* Add device button - Djoppie Neumorphic style */}
      <Button
        fullWidth
        startIcon={<AddIcon />}
        onClick={addDevice}
        sx={{
          mt: devices.length > 0 ? 2.5 : 0,
          borderRadius: 2.5,
          bgcolor: `${neuBg} !important`,
          color: '#FF9800',
          fontWeight: 700,
          py: 1.5,
          textTransform: 'none',
          fontSize: '0.85rem',
          border: 'none',
          boxShadow: `5px 5px 10px ${neuShadowDark}, -5px -5px 10px ${neuShadowLight}, inset 0 0 0 1px rgba(255, 152, 0, 0.2)`,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: `${neuBg} !important`,
            transform: 'translateY(-2px)',
            boxShadow: `7px 7px 14px ${neuShadowDark}, -7px -7px 14px ${neuShadowLight}, inset 0 0 0 2px rgba(255, 152, 0, 0.4)`,
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: `inset 4px 4px 8px ${neuShadowDark}, inset -4px -4px 8px ${neuShadowLight}, inset 0 0 0 2px rgba(255, 152, 0, 0.5)`,
          },
        }}
      >
        Apparaat Toevoegen
      </Button>
    </Box>
  );
};

export default OldDeviceConfigSection;
