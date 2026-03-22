/**
 * DeviceDisplaySection - Display Intune devices and owner assets
 *
 * Shows clickable chips for Intune devices and Djoppie DB assets
 * that belong to the selected user.
 */

import {
  Box,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import LaptopIcon from '@mui/icons-material/Laptop';
import ComputerIcon from '@mui/icons-material/Computer';
import type { IntuneDevice } from '../../../types/graph.types';
import type { Asset } from '../../../types/asset.types';

interface DeviceDisplaySectionProps {
  userDevices: IntuneDevice[];
  ownerAssets: Asset[];
  ownerAssetsLoading: boolean;
  onDeviceClick: (
    event: React.MouseEvent<HTMLElement>,
    type: 'intune' | 'owner',
    data: IntuneDevice | Asset
  ) => void;
}

export function DeviceDisplaySection({
  userDevices,
  ownerAssets,
  ownerAssetsLoading,
  onDeviceClick,
}: DeviceDisplaySectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const chipBaseSx = {
    bgcolor: isDark ? '#1e2328' : '#e8eef3',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    boxShadow: isDark
      ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
      : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',
    transition: 'all 0.2s ease',
  };

  // Purple color for user devices
  const purpleColor = '#9C27B0';

  const intuneChipSx = {
    ...chipBaseSx,
    color: purpleColor,
    '& .MuiChip-icon': { color: purpleColor },
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: isDark
        ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, 0 0 0 2px rgba(156, 39, 176, 0.4)'
        : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, 0 0 0 2px rgba(156, 39, 176, 0.3)',
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: isDark
        ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
        : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
    },
  };

  const ownerChipSx = {
    ...chipBaseSx,
    color: purpleColor,
    '& .MuiChip-icon': { color: purpleColor },
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: isDark
        ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, 0 0 0 2px rgba(156, 39, 176, 0.4)'
        : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, 0 0 0 2px rgba(156, 39, 176, 0.3)',
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: isDark
        ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
        : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
    },
  };

  const containerSx = {
    mb: 3,
    p: 2,
    borderRadius: 3,
    bgcolor: isDark ? '#1e2328' : '#e8eef3',
    boxShadow: isDark
      ? 'inset 5px 5px 10px #161a1d, inset -5px -5px 10px #262c33'
      : 'inset 5px 5px 10px #c5cad0, inset -5px -5px 10px #ffffff',
    transform: 'translateZ(6px)',
  };

  const hasIntuneDevices = userDevices.length > 0;
  const hasOwnerAssets = ownerAssets.length > 0 || ownerAssetsLoading;

  if (!hasIntuneDevices && !hasOwnerAssets) {
    return null;
  }

  return (
    <>
      {/* Intune Devices */}
      {hasIntuneDevices && (
        <Box sx={containerSx}>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{
              mb: 1.5,
              display: 'block',
              color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            HUIDIGE APPARATEN (INTUNE) — Klik voor toevoegen of inleveren
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {userDevices.map((device) => (
              <Chip
                key={device.id || device.serialNumber}
                icon={<LaptopIcon sx={{ fontSize: '0.9rem !important' }} />}
                label={`${device.deviceName || '?'} — ${device.serialNumber || ''}`}
                size="small"
                onClick={(e) => onDeviceClick(e, 'intune', device)}
                sx={intuneChipSx}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Owner Assets from Djoppie DB */}
      {hasOwnerAssets && (
        <Box sx={containerSx}>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{
              mb: 1.5,
              display: 'block',
              color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            ASSETS IN DJOPPIE DB — Klik voor toevoegen of inleveren
          </Typography>
          {ownerAssetsLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} sx={{ color: purpleColor }} />
              <Typography variant="caption" color="text.secondary">
                Assets laden...
              </Typography>
            </Box>
          ) : (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {ownerAssets.map((asset) => (
                <Chip
                  key={asset.id}
                  icon={<ComputerIcon sx={{ fontSize: '0.9rem !important' }} />}
                  label={`${asset.assetCode} — ${asset.assetName || asset.alias || ''}`}
                  size="small"
                  onClick={(e) => onDeviceClick(e, 'owner', asset)}
                  sx={ownerChipSx}
                />
              ))}
            </Stack>
          )}
        </Box>
      )}
    </>
  );
}
