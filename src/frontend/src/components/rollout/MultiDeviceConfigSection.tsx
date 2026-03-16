/**
 * Multi-Device Configuration Section
 *
 * Redesigned "Nieuw Apparaat" section for RolloutWorkplaceDialog
 * Supports adding multiple devices with different types to a single workplace
 *
 * Design: Neumorphic soft UI with orange accent (#FF7700)
 * Features: Type selection, template assignment, serial numbers, visual summary
 */

import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import MonitorIcon from '@mui/icons-material/Monitor';
import DockIcon from '@mui/icons-material/Dock';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import ComputerIcon from '@mui/icons-material/Computer';
import VideocamIcon from '@mui/icons-material/Videocam';
import { TemplateSelector } from './TemplateSelector';
import type { Asset, AssetTemplate } from '../../types/asset.types';

// Device configuration interface
export interface DeviceConfig {
  id: string;
  type: 'laptop' | 'desktop' | 'monitor' | 'docking' | 'keyboard' | 'mouse';
  template: AssetTemplate | null;
  serialNumber: string;
  linkedAsset: Asset | null;
  metadata?: Record<string, string>;
}

// Device type definitions with icons and colors
const DEVICE_TYPES = [
  { value: 'laptop' as const, label: 'Laptop', icon: LaptopIcon, color: '#FF7700' },
  { value: 'desktop' as const, label: 'Desktop', icon: DesktopWindowsIcon, color: '#FF7700' },
  { value: 'monitor' as const, label: 'Monitor', icon: MonitorIcon, color: '#2196F3' },
  { value: 'docking' as const, label: 'Docking', icon: DockIcon, color: '#9C27B0' },
  { value: 'keyboard' as const, label: 'Keyboard', icon: KeyboardIcon, color: '#4CAF50' },
  { value: 'mouse' as const, label: 'Mouse', icon: MouseIcon, color: '#FF5722' },
];

interface MultiDeviceConfigSectionProps {
  devices: DeviceConfig[];
  onChange: (devices: DeviceConfig[]) => void;
  showLegacyFields?: boolean;
}

export const MultiDeviceConfigSection = ({
  devices,
  onChange,
}: MultiDeviceConfigSectionProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const addDevice = () => {
    const newDevice: DeviceConfig = {
      id: `device-${Date.now()}-${Math.random()}`,
      type: 'laptop',
      template: null,
      serialNumber: '',
      linkedAsset: null,
    };
    onChange([...devices, newDevice]);
  };

  const removeDevice = (index: number) => {
    onChange(devices.filter((_, i) => i !== index));
  };

  const updateDevice = (index: number, updates: Partial<DeviceConfig>) => {
    const updated = [...devices];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  // Neumorphic color constants
  const neuBg = isDark ? '#1e2328' : '#e8eef3';
  const neuShadowDark = isDark ? '#161a1d' : '#c5cad0';
  const neuShadowLight = isDark ? '#262c33' : '#ffffff';

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
                bgcolor: 'success.main',
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
            Nieuw Apparaat
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
              color: '#FF7700',
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
            Configuratie overzicht
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {devices.map((device) => {
              const deviceType = DEVICE_TYPES.find(t => t.value === device.type);
              const DeviceIcon = deviceType?.icon || ComputerIcon;
              return (
                <Chip
                  key={device.id}
                  icon={<DeviceIcon sx={{ fontSize: '0.85rem !important' }} />}
                  label={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box component="span" sx={{ fontWeight: 700 }}>{deviceType?.label}</Box>
                      {device.template && (
                        <Box component="span" sx={{ opacity: 0.7 }}>
                          — {device.template.brand}
                        </Box>
                      )}
                      {device.type === 'monitor' && device.metadata?.hasCamera === 'true' && (
                        <VideocamIcon sx={{ fontSize: '0.75rem', ml: 0.5, color: '#2196F3' }} />
                      )}
                    </Box>
                  }
                  size="small"
                  sx={{
                    height: 26,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: neuBg,
                    color: deviceType?.color,
                    border: 'none',
                    boxShadow: `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}`,
                    transition: 'all 0.2s ease',
                    '& .MuiChip-icon': { color: deviceType?.color },
                    '&:hover': {
                      boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Device entry cards - Neumorphic */}
      <Stack spacing={2.5}>
        {devices.map((device, index) => {
          const deviceType = DEVICE_TYPES.find(t => t.value === device.type);
          const DeviceIcon = deviceType?.icon || ComputerIcon;

          return (
            <Box
              key={device.id}
              sx={{
                position: 'relative',
                borderRadius: 3,
                p: 2.5,
                bgcolor: neuBg,
                boxShadow: `4px 4px 8px ${neuShadowDark}, -4px -4px 8px ${neuShadowLight}`,
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
                  boxShadow: `6px 6px 12px ${neuShadowDark}, -6px -6px 12px ${neuShadowLight}, inset 0 0 0 2px rgba(255, 119, 0, 0.2)`,
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
                    color: deviceType?.color,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <DeviceIcon sx={{ fontSize: '1.1rem' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: deviceType?.color }}>
                      {deviceType?.label}
                    </Typography>
                    {device.linkedAsset ? (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: '0.75rem !important' }} />}
                        label="Bestaand"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(76, 175, 80, 0.15)',
                          color: '#4CAF50',
                          border: 'none',
                          '& .MuiChip-icon': { color: '#4CAF50' },
                        }}
                      />
                    ) : (
                      <Chip
                        icon={<FiberNewIcon sx={{ fontSize: '0.75rem !important' }} />}
                        label="Nieuw"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(255, 152, 0, 0.15)',
                          color: '#FF9800',
                          border: 'none',
                          '& .MuiChip-icon': { color: '#FF9800' },
                        }}
                      />
                    )}
                  </Stack>
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                    {device.linkedAsset ? device.linkedAsset.assetCode : `Apparaat ${index + 1}`}
                  </Typography>
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

              {/* Device type selector - Neumorphic */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 600, color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }}>
                  Apparaat type
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {DEVICE_TYPES.map((dt) => {
                    const DtIcon = dt.icon;
                    const isSelected = device.type === dt.value;
                    return (
                      <Chip
                        key={dt.value}
                        icon={<DtIcon sx={{ fontSize: '0.9rem !important' }} />}
                        label={dt.label}
                        size="small"
                        onClick={() => updateDevice(index, { type: dt.value, template: null })}
                        sx={{
                          height: 30,
                          fontSize: '0.75rem',
                          fontWeight: isSelected ? 700 : 500,
                          bgcolor: neuBg,
                          color: isSelected ? dt.color : (isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'),
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected
                            ? `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}, 0 0 0 2px ${dt.color}40`
                            : `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}`,
                          '&:hover': {
                            boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                            color: dt.color,
                          },
                          '& .MuiChip-icon': {
                            color: isSelected ? dt.color : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'),
                          },
                        }}
                      />
                    );
                  })}
                </Stack>
              </Box>

              {/* Template selector */}
              <Box sx={{ mb: 2.5 }}>
                <TemplateSelector
                  equipmentType={device.type}
                  value={device.template}
                  onChange={(template) => updateDevice(index, { template })}
                  label={`${deviceType?.label} merk/model`}
                  error={!device.template}
                />
              </Box>

              {/* Serial number field - Neumorphic */}
              <TextField
                fullWidth
                label="Serienummer (optioneel)"
                value={device.serialNumber}
                onChange={(e) => updateDevice(index, { serialNumber: e.target.value })}
                size="small"
                placeholder="Kan later worden ingevuld"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCodeScannerIcon sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)', fontSize: '1rem' }} />
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

              {/* Monitor camera option - Only for monitors */}
              {device.type === 'monitor' && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={device.metadata?.hasCamera === 'true'}
                      onChange={(e) => updateDevice(index, {
                        metadata: { ...device.metadata, hasCamera: e.target.checked ? 'true' : 'false' }
                      })}
                      icon={<VideocamIcon sx={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)' }} />}
                      checkedIcon={<VideocamIcon sx={{ color: '#2196F3' }} />}
                      sx={{
                        '&:hover': { bgcolor: 'transparent' },
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: device.metadata?.hasCamera === 'true'
                          ? '#2196F3'
                          : (isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'),
                      }}
                    >
                      Ingebouwde camera
                    </Typography>
                  }
                  sx={{
                    mt: 1.5,
                    ml: 0,
                    p: 1,
                    borderRadius: 2,
                    bgcolor: neuBg,
                    boxShadow: device.metadata?.hasCamera === 'true'
                      ? `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}, 0 0 0 2px rgba(33, 150, 243, 0.3)`
                      : `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                    },
                  }}
                />
              )}
            </Box>
          );
        })}
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
          color: '#4CAF50',
          fontWeight: 700,
          py: 1.5,
          textTransform: 'none',
          fontSize: '0.85rem',
          border: 'none',
          boxShadow: `5px 5px 10px ${neuShadowDark}, -5px -5px 10px ${neuShadowLight}, inset 0 0 0 1px rgba(76, 175, 80, 0.2)`,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: `${neuBg} !important`,
            transform: 'translateY(-2px)',
            boxShadow: `7px 7px 14px ${neuShadowDark}, -7px -7px 14px ${neuShadowLight}, inset 0 0 0 2px rgba(76, 175, 80, 0.4)`,
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: `inset 4px 4px 8px ${neuShadowDark}, inset -4px -4px 8px ${neuShadowLight}, inset 0 0 0 2px rgba(76, 175, 80, 0.5)`,
          },
        }}
      >
        Nieuw Apparaat Toevoegen
      </Button>
    </Box>
  );
};

export default MultiDeviceConfigSection;
