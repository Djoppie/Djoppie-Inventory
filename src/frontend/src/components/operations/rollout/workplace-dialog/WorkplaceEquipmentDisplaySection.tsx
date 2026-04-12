/**
 * WorkplaceEquipmentDisplaySection - Display current equipment at physical workplace
 *
 * Shows the equipment currently assigned to the selected physical workplace:
 * - Docking station
 * - Monitors (1-3)
 * - Keyboard
 * - Mouse
 *
 * Clicking on equipment allows adding it as "old device" for replacement.
 */

import {
  Box,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  useTheme,
  Tooltip,
} from '@mui/material';
import DockIcon from '@mui/icons-material/Dock';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import PlaceIcon from '@mui/icons-material/Place';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import type { PhysicalWorkplace } from '../../../../types/physicalWorkplace.types';
import { SERVICE_COLOR, BUILDING_COLOR } from '../../../../constants/filterColors';

interface EquipmentSlot {
  type: 'docking' | 'monitor1' | 'monitor2' | 'monitor3' | 'keyboard' | 'mouse';
  label: string;
  icon: React.ReactElement;
  assetId?: number;
  assetCode?: string;
  serialNumber?: string;
}

interface WorkplaceEquipmentDisplaySectionProps {
  workplace: PhysicalWorkplace | null | undefined;
  isLoading: boolean;
  onEquipmentClick?: (slot: EquipmentSlot) => void;
}

const EQUIPMENT_ICONS = {
  docking: <DockIcon sx={{ fontSize: '0.9rem !important' }} />,
  monitor1: <MonitorIcon sx={{ fontSize: '0.9rem !important' }} />,
  monitor2: <MonitorIcon sx={{ fontSize: '0.9rem !important' }} />,
  monitor3: <MonitorIcon sx={{ fontSize: '0.9rem !important' }} />,
  keyboard: <KeyboardIcon sx={{ fontSize: '0.9rem !important' }} />,
  mouse: <MouseIcon sx={{ fontSize: '0.9rem !important' }} />,
};

const EQUIPMENT_LABELS = {
  docking: 'Docking Station',
  monitor1: 'Monitor 1',
  monitor2: 'Monitor 2',
  monitor3: 'Monitor 3',
  keyboard: 'Toetsenbord',
  mouse: 'Muis',
};

export function WorkplaceEquipmentDisplaySection({
  workplace,
  isLoading,
  onEquipmentClick,
}: WorkplaceEquipmentDisplaySectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Don't render if no workplace selected
  if (!workplace && !isLoading) {
    return null;
  }

  // Build equipment slots from workplace data
  const equipmentSlots: EquipmentSlot[] = workplace ? [
    // Docking station (if workplace has one)
    ...(workplace.hasDockingStation ? [{
      type: 'docking' as const,
      label: EQUIPMENT_LABELS.docking,
      icon: EQUIPMENT_ICONS.docking,
      assetId: workplace.dockingStationAssetId,
      assetCode: workplace.dockingStationAssetCode,
      serialNumber: workplace.dockingStationSerialNumber,
    }] : []),
    // Monitors based on monitorCount
    ...(workplace.monitorCount >= 1 ? [{
      type: 'monitor1' as const,
      label: EQUIPMENT_LABELS.monitor1,
      icon: EQUIPMENT_ICONS.monitor1,
      assetId: workplace.monitor1AssetId,
      assetCode: workplace.monitor1AssetCode,
      serialNumber: workplace.monitor1SerialNumber,
    }] : []),
    ...(workplace.monitorCount >= 2 ? [{
      type: 'monitor2' as const,
      label: EQUIPMENT_LABELS.monitor2,
      icon: EQUIPMENT_ICONS.monitor2,
      assetId: workplace.monitor2AssetId,
      assetCode: workplace.monitor2AssetCode,
      serialNumber: workplace.monitor2SerialNumber,
    }] : []),
    ...(workplace.monitorCount >= 3 ? [{
      type: 'monitor3' as const,
      label: EQUIPMENT_LABELS.monitor3,
      icon: EQUIPMENT_ICONS.monitor3,
      assetId: workplace.monitor3AssetId,
      assetCode: workplace.monitor3AssetCode,
      serialNumber: workplace.monitor3SerialNumber,
    }] : []),
    // Keyboard
    {
      type: 'keyboard' as const,
      label: EQUIPMENT_LABELS.keyboard,
      icon: EQUIPMENT_ICONS.keyboard,
      assetId: workplace.keyboardAssetId,
      assetCode: workplace.keyboardAssetCode,
      serialNumber: workplace.keyboardSerialNumber,
    },
    // Mouse
    {
      type: 'mouse' as const,
      label: EQUIPMENT_LABELS.mouse,
      icon: EQUIPMENT_ICONS.mouse,
      assetId: workplace.mouseAssetId,
      assetCode: workplace.mouseAssetCode,
      serialNumber: workplace.mouseSerialNumber,
    },
  ] : [];

  const filledSlots = equipmentSlots.filter(slot => slot.assetId);
  const emptySlots = equipmentSlots.filter(slot => !slot.assetId);

  const containerSx = {
    mb: 3,
    p: 2,
    borderRadius: 3,
    bgcolor: isDark ? '#1e2328' : '#e8eef3',
    boxShadow: isDark
      ? 'inset 5px 5px 10px #161a1d, inset -5px -5px 10px #262c33'
      : 'inset 5px 5px 10px #c5cad0, inset -5px -5px 10px #ffffff',
    transform: 'translateZ(6px)',
    border: '1px solid',
    borderColor: isDark ? 'rgba(0, 150, 136, 0.2)' : 'rgba(0, 150, 136, 0.15)',
  };

  const filledChipSx = {
    bgcolor: isDark ? '#1e2328' : '#e8eef3',
    fontWeight: 600,
    border: 'none',
    cursor: onEquipmentClick ? 'pointer' : 'default',
    color: SERVICE_COLOR,
    boxShadow: isDark
      ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
      : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',
    transition: 'all 0.2s ease',
    '& .MuiChip-icon': { color: SERVICE_COLOR },
    ...(onEquipmentClick && {
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: isDark
          ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, 0 0 0 2px rgba(0, 150, 136, 0.4)'
          : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, 0 0 0 2px rgba(0, 150, 136, 0.3)',
      },
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: isDark
          ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
          : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
      },
    }),
  };

  const emptyChipSx = {
    bgcolor: isDark ? '#1e2328' : '#e8eef3',
    fontWeight: 600,
    border: '1px dashed',
    borderColor: isDark ? 'rgba(255, 152, 0, 0.4)' : 'rgba(255, 152, 0, 0.3)',
    color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
    boxShadow: isDark
      ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
      : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
    '& .MuiChip-icon': {
      color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
    },
  };

  return (
    <Box sx={containerSx}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <PlaceIcon sx={{ color: SERVICE_COLOR, fontSize: '1rem' }} />
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{
            color: SERVICE_COLOR,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          WERKPLEK APPARATUUR — {workplace?.code}
        </Typography>
        {filledSlots.length > 0 && (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '0.75rem !important' }} />}
            label={`${filledSlots.length}/${equipmentSlots.length} toegewezen`}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 600,
              bgcolor: 'rgba(34, 197, 94, 0.12)',
              color: '#16a34a',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              '& .MuiChip-icon': { color: '#16a34a', marginLeft: '4px' },
            }}
          />
        )}
        {emptySlots.length > 0 && (
          <Chip
            icon={<WarningIcon sx={{ fontSize: '0.75rem !important' }} />}
            label={`${emptySlots.length} ontbreekt`}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 600,
              bgcolor: 'rgba(255, 152, 0, 0.12)',
              color: BUILDING_COLOR,
              border: '1px solid rgba(255, 152, 0, 0.3)',
              '& .MuiChip-icon': { color: BUILDING_COLOR, marginLeft: '4px' },
            }}
          />
        )}
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} sx={{ color: SERVICE_COLOR }} />
          <Typography variant="caption" color="text.secondary">
            Werkplek apparatuur laden...
          </Typography>
        </Box>
      ) : (
        <>
          {/* Filled Equipment Slots */}
          {filledSlots.length > 0 && (
            <Box sx={{ mb: emptySlots.length > 0 ? 1.5 : 0 }}>
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  display: 'block',
                  mb: 0.75,
                  fontSize: '0.65rem',
                }}
              >
                Huidige apparatuur — Klik om te vervangen
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {filledSlots.map((slot) => (
                  <Tooltip
                    key={slot.type}
                    title={
                      <Box>
                        <Typography variant="caption" fontWeight={600}>{slot.label}</Typography>
                        <br />
                        <Typography variant="caption">Asset: {slot.assetCode}</Typography>
                        {slot.serialNumber && (
                          <>
                            <br />
                            <Typography variant="caption">S/N: {slot.serialNumber}</Typography>
                          </>
                        )}
                      </Box>
                    }
                    arrow
                  >
                    <Chip
                      icon={slot.icon}
                      label={`${slot.label}: ${slot.assetCode}`}
                      size="small"
                      onClick={onEquipmentClick ? () => onEquipmentClick(slot) : undefined}
                      sx={filledChipSx}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>
          )}

          {/* Empty Equipment Slots */}
          {emptySlots.length > 0 && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  display: 'block',
                  mb: 0.75,
                  fontSize: '0.65rem',
                }}
              >
                Ontbrekende apparatuur — Voeg toe via configuratie
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {emptySlots.map((slot) => (
                  <Chip
                    key={slot.type}
                    icon={slot.icon}
                    label={`${slot.label}: Niet toegewezen`}
                    size="small"
                    sx={emptyChipSx}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
